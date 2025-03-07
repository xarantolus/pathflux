package meili

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"pathflux/config"
	"reflect"
	"strings"
	"time"

	"github.com/meilisearch/meilisearch-go"
	"github.com/mitchellh/copystructure"
	gitlab "gitlab.com/gitlab-org/api/client-go"
)

const (
	USERS_INDEX  = "gitlab_users"
	ISSUES_INDEX = "gitlab_items"
)

type DBClient struct {
	logger       *log.Logger
	client       meilisearch.ServiceManager
	gitlabConfig config.GitLab
	gitlabClient *gitlab.Client

	groups map[int]*gitlab.Group
}

func NewDBClient(ctx context.Context, gitlabConfig config.GitLab, logger *log.Logger, meiliHost, meiliAPIKey string) (client *DBClient, err error) {
	var httpClient = &http.Client{
		Timeout: 1 * time.Minute,
	}

	meili := meilisearch.New(meiliHost, meilisearch.WithAPIKey(meiliAPIKey), meilisearch.WithCustomClient(httpClient))

	// Ensure our users index exists
	_, err = meili.GetIndex(USERS_INDEX)
	if err != nil {
		if !strings.Contains(err.Error(), "index_not_found") {
			return nil, fmt.Errorf("failed to get index: %w", err)
		}

		logger.Printf("Index %q not found, creating...", USERS_INDEX)

		createTask, err := meili.CreateIndex(&meilisearch.IndexConfig{
			PrimaryKey: "id",
			Uid:        USERS_INDEX,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create index: %w", err)
		}

		_, err = meili.WaitForTask(createTask.TaskUID, 0)
		if err != nil {
			return nil, fmt.Errorf("failed to wait for task: %w", err)
		}
	}

	index := meili.Index(USERS_INDEX)

	currentSettings, err := index.GetSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to get index settings: %w", err)
	}
	originalSettingsInterface, err := copystructure.Copy(currentSettings)
	if err != nil {
		log.Fatalf("Failed to copy current settings: %v", err)
	}
	originalSettings := originalSettingsInterface.(*meilisearch.Settings)

	var settingsChanged bool
	// Note: order is important for searchable attributes, as it defines ranking importance
	currentSettings.SearchableAttributes = []string{"name", "username", "bio", "id"}
	settingsChanged = settingsChanged || !reflect.DeepEqual(originalSettings.SearchableAttributes, currentSettings.SearchableAttributes)
	currentSettings.RankingRules = []string{
		"sort",
		"words",
		"typo",
		"proximity",
		"attribute",
		"exactness",
	}
	settingsChanged = settingsChanged || !reflect.DeepEqual(originalSettings.RankingRules, currentSettings.RankingRules)

	if settingsChanged {
		log.Printf("Updating index settings: %#v", currentSettings)
		settingsTask, err := index.UpdateSettings(currentSettings)
		if err != nil {
			log.Fatalf("Failed to update index settings: %v", err)
		}

		_, err = meili.WaitForTask(settingsTask.TaskUID, 0)
		if err != nil {
			log.Fatalf("Failed to wait for index settings to apply: %v", err)
		}
	}

	gc, err := gitlab.NewClient(gitlabConfig.ApiKey, gitlab.WithBaseURL(gitlabConfig.InstanceURL))
	if err != nil {
		return nil, fmt.Errorf("failed to create gitlab client: %w", err)
	}

	var groups = make(map[int]*gitlab.Group)
	for _, groupID := range gitlabConfig.GroupIDs {
		group, _, err := gc.Groups.GetGroup(groupID, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to get group %d: %w", groupID, err)
		}

		logger.Printf("Loaded group %q", group.Name)
		groups[groupID] = group
	}

	client = &DBClient{
		client:       meili,
		logger:       logger,
		gitlabConfig: gitlabConfig,
		gitlabClient: gc,
		groups:       groups,
	}

	go client.syncInBackground(ctx)

	return
}

func (c *DBClient) syncInBackground(ctx context.Context) {
	// timer will fire immediately, and later every 6 hours
	userUpdateTimer := time.NewTimer(0)

	const (
		userUpdateInterval = 6 * time.Hour
	)

	for {
		select {
		case <-ctx.Done():
			if !userUpdateTimer.Stop() {
				<-userUpdateTimer.C
			}
			return
		case <-userUpdateTimer.C:
			c.logger.Printf("Syncing users from %d GitLab group(s)", len(c.groups))

			count, err := c.syncUsers(ctx)
			if err != nil {
				c.logger.Printf("Failed to sync users: %v", err)
			}

			c.logger.Printf("Synced %d users", count)

			userUpdateTimer.Reset(userUpdateInterval)
		}
	}
}

type User struct {
	GitlabID  int    `json:"id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	State     string `json:"state"`
	AvatarURL string `json:"avatar_url"`
	WebURL    string `json:"web_url"`
}

func listAllGroupMembers(g *gitlab.Client, groupID interface{}) (users []*gitlab.GroupMember, err error) {
	var page = 1

	for {
		members, _, err := g.Groups.ListAllGroupMembers(groupID, &gitlab.ListGroupMembersOptions{
			ListOptions: gitlab.ListOptions{
				Page:    page,
				PerPage: 100,
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to list group members: %w", err)
		}

		if len(members) == 0 {
			break
		}

		users = append(users, members...)
		page++
	}

	return users, nil
}

func (c *DBClient) syncUsers(ctx context.Context) (count int, err error) {
	var users []User
	var seenIDs = make(map[int]struct{})

	for _, group := range c.groups {
		members, err := listAllGroupMembers(c.gitlabClient, group.ID)
		if err != nil {
			return 0, fmt.Errorf("failed to get group members for group %q: %w", group.Name, err)
		}

		for _, member := range members {
			if _, ok := seenIDs[member.ID]; ok {
				continue
			}
			seenIDs[member.ID] = struct{}{}

			users = append(users, User{
				GitlabID:  member.ID,
				Username:  member.Username,
				Name:      member.Name,
				State:     member.State,
				AvatarURL: member.AvatarURL,
				WebURL:    member.WebURL,
			})
		}
	}

	index := c.client.Index(USERS_INDEX)
	task, err := index.AddDocuments(users)
	if err != nil {
		return 0, fmt.Errorf("failed to add users: %w", err)
	}

	res, err := c.client.WaitForTask(task.TaskUID, 0)
	if err != nil {
		return 0, fmt.Errorf("failed to wait for task: %w", err)
	}

	if res.Status != meilisearch.TaskStatusSucceeded {
		return 0, fmt.Errorf("user add task was not successful: %q", res.Status)
	}

	return len(users), nil
}
