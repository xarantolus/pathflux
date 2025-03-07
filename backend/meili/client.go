package meili

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"pathflux/config"
	"reflect"
	"strconv"
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

type ItemUpdateCallback func(items []GitLabItem)
type UserUpdateCallback func(users []User)

type DBClient struct {
	logger       *log.Logger
	client       meilisearch.ServiceManager
	gitlabConfig config.GitLab
	gitlabClient *gitlab.Client

	groups map[int]*gitlab.Group

	// Gets called when an item change is noticed
	updateItemCallback  ItemUpdateCallback
	updateUsersCallback UserUpdateCallback
}

func NewDBClient(ctx context.Context, gitlabConfig config.GitLab, logger *log.Logger, meiliHost, meiliAPIKey string, onUpdateItem ItemUpdateCallback, onUpdateUser UserUpdateCallback) (client *DBClient, err error) {
	var httpClient = &http.Client{
		Timeout: 1 * time.Minute,
	}

	meili := meilisearch.New(meiliHost, meilisearch.WithAPIKey(meiliAPIKey), meilisearch.WithCustomClient(httpClient))

	// Set up users index
	err = ensureIndexExists(
		meili,
		logger,
		USERS_INDEX,
		"id",
		[]string{"name", "username", "bio", "id"},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to set up users index: %w", err)
	}

	// Set up issues index
	err = ensureIndexExists(
		meili,
		logger,
		ISSUES_INDEX,
		"id",
		[]string{"title", "slug", "iid", "description", "labels", "state"},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to set up issues index: %w", err)
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
		client:              meili,
		logger:              logger,
		gitlabConfig:        gitlabConfig,
		gitlabClient:        gc,
		groups:              groups,
		updateItemCallback:  onUpdateItem,
		updateUsersCallback: onUpdateUser,
	}

	go client.syncInBackground(ctx)

	return
}

func ensureIndexExists(client meilisearch.ServiceManager, logger *log.Logger, indexName string, primaryKey string, searchableAttributes []string) error {
	// Check if index exists
	_, err := client.GetIndex(indexName)
	if err != nil {
		if !strings.Contains(err.Error(), "index_not_found") {
			return fmt.Errorf("failed to get index: %w", err)
		}

		logger.Printf("Index %q not found, creating...", indexName)

		createTask, err := client.CreateIndex(&meilisearch.IndexConfig{
			PrimaryKey: primaryKey,
			Uid:        indexName,
		})
		if err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}

		_, err = client.WaitForTask(createTask.TaskUID, 0)
		if err != nil {
			return fmt.Errorf("failed to wait for task: %w", err)
		}
	}

	index := client.Index(indexName)

	// Get current settings
	currentSettings, err := index.GetSettings()
	if err != nil {
		return fmt.Errorf("failed to get index settings: %w", err)
	}

	originalSettingsInterface, err := copystructure.Copy(currentSettings)
	if err != nil {
		return fmt.Errorf("failed to copy current settings: %w", err)
	}
	originalSettings := originalSettingsInterface.(*meilisearch.Settings)

	// Compare and update settings if necessary
	var settingsChanged bool

	// Update searchable attributes
	if searchableAttributes != nil {
		currentSettings.SearchableAttributes = searchableAttributes
		settingsChanged = settingsChanged || !reflect.DeepEqual(originalSettings.SearchableAttributes, currentSettings.SearchableAttributes)
	}
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
		logger.Printf("Updating index %q settings", indexName)
		settingsTask, err := index.UpdateSettings(currentSettings)
		if err != nil {
			return fmt.Errorf("failed to update index settings: %w", err)
		}

		_, err = client.WaitForTask(settingsTask.TaskUID, 0)
		if err != nil {
			return fmt.Errorf("failed to wait for index settings to apply: %w", err)
		}
	}

	return nil
}

func (c *DBClient) syncInBackground(ctx context.Context) {
	// timer will fire immediately, and later every 6 hours
	userUpdateTimer := time.NewTimer(0)
	groupItemsTimer := time.NewTimer(0)

	const (
		userUpdateInterval = 6 * time.Hour
		groupItemsInterval = 30 * time.Minute
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

			count, err := c.syncUsers()
			if err != nil {
				c.logger.Printf("Failed to sync users: %v", err)
			}

			c.logger.Printf("Synced %d users", count)

			userUpdateTimer.Reset(userUpdateInterval)
		case <-groupItemsTimer.C:
			c.logger.Printf("Syncing items from %d GitLab group(s)", len(c.groups))

			var total int
			for _, group := range c.groups {
				count, err := c.syncGroupItems(group)
				if err != nil {
					c.logger.Printf("Error while syncing items for group %q: %v", group.Name, err)
				}

				total += count
				c.logger.Printf("Synced %d items for group %q", count, group.Name)
			}

			c.logger.Printf("Synced %d items", total)

			groupItemsTimer.Reset(groupItemsInterval)
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

func FromGitLabUser(user *gitlab.User) User {
	return User{
		GitlabID:  user.ID,
		Username:  user.Username,
		Name:      user.Name,
		State:     user.State,
		AvatarURL: user.AvatarURL,
		WebURL:    user.WebURL,
	}
}
func FromGitLabGroupMember(user *gitlab.GroupMember) User {
	return User{
		GitlabID:  user.ID,
		Username:  user.Username,
		Name:      user.Name,
		State:     user.State,
		AvatarURL: user.AvatarURL,
		WebURL:    user.WebURL,
	}
}

func (c *DBClient) syncUsers() (count int, err error) {
	var users []User
	var seenIDs = make(map[int]struct{})

	index := c.client.Index(USERS_INDEX)

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

			user := FromGitLabGroupMember(member)

			var meiliUser User
			err = index.GetDocument(strconv.Itoa(member.ID), &meilisearch.DocumentQuery{
				Fields: []string{"*"},
			}, &meiliUser)
			if err != nil || meiliUser != user {
				users = append(users, user)
			}
		}
	}

	if len(users) == 0 {
		return 0, nil
	}

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

	c.updateUsersCallback(users)

	return len(users), nil
}

func (c *DBClient) syncGroupItems(group *gitlab.Group) (count int, err error) {
	var (
		outputChannel = make(chan any, perPageEntries)
		errorChannel  = make(chan error)
	)
	go func() {
		issueErr := listAllGroupIssues(c.gitlabClient, group.ID, outputChannel)
		prErr := listAllGroupMergeRequests(c.gitlabClient, group.ID, outputChannel)
		epicErr := listAllGroupEpics(c.gitlabClient, group.ID, outputChannel)

		close(outputChannel)

		// send nil or combined error on error channel
		var combinedError error = nil
		var errors = []error{issueErr, prErr, epicErr}
		for _, err := range errors {
			if err != nil {
				if combinedError == nil {
					combinedError = err
				} else {
					combinedError = fmt.Errorf("%w; %v", combinedError, err)
				}
			}
		}
		errorChannel <- combinedError
	}()

	var updatedItems []GitLabItem

	index := c.client.Index(ISSUES_INDEX)

	for input := range outputChannel {
		var outItem GitLabItem
		switch item := input.(type) {
		case *gitlab.Issue:
			var involvedUsers []User

			if item.Author != nil {
				involvedUsers = append(involvedUsers, User{
					GitlabID:  item.Author.ID,
					Username:  item.Author.Username,
					Name:      item.Author.Name,
					State:     item.Author.State,
					AvatarURL: item.Author.AvatarURL,
					WebURL:    item.Author.WebURL,
				})
			}
			for _, assignee := range item.Assignees {
				involvedUsers = append(involvedUsers, User{
					GitlabID:  assignee.ID,
					Username:  assignee.Username,
					Name:      assignee.Name,
					State:     assignee.State,
					AvatarURL: assignee.AvatarURL,
					WebURL:    assignee.WebURL,
				})
			}

			outItem = GitLabItem{
				ID:            "i" + strconv.Itoa(item.ID),
				Kind:          "issue",
				InvolvedUsers: deduplicateUsers(involvedUsers),
				WebURL:        item.WebURL,
				Title:         item.Title,
				Description:   item.Description,
				IID:           item.IID,
				State:         GitLabItemState(item.State),
				CreatedAt:     item.CreatedAt,
				UpdatedAt:     item.UpdatedAt,
				ClosedAt:      item.ClosedAt,
				Slug:          strings.Split(item.References.Full, "#")[0] + "#" + strconv.Itoa(item.IID),
				Labels:        convertLabels(item.LabelDetails, item.Labels),
			}
		case *gitlab.BasicMergeRequest:
			var involvedUsers []User
			if item.Author != nil {
				involvedUsers = append(involvedUsers, User{
					GitlabID:  item.Author.ID,
					Username:  item.Author.Username,
					Name:      item.Author.Name,
					State:     item.Author.State,
					AvatarURL: item.Author.AvatarURL,
					WebURL:    item.Author.WebURL,
				})
			}

			for _, assignee := range item.Assignees {
				involvedUsers = append(involvedUsers, User{
					GitlabID:  assignee.ID,
					Username:  assignee.Username,
					Name:      assignee.Name,
					State:     assignee.State,
					AvatarURL: assignee.AvatarURL,
					WebURL:    assignee.WebURL,
				})
			}

			outItem = GitLabItem{
				ID:            "mr" + strconv.Itoa(item.ID),
				Kind:          "merge_request",
				InvolvedUsers: deduplicateUsers(involvedUsers),
				WebURL:        item.WebURL,
				Title:         item.Title,
				Description:   item.Description,
				IID:           item.IID,
				CreatedAt:     item.CreatedAt,
				UpdatedAt:     item.UpdatedAt,
				ClosedAt:      item.ClosedAt,
				State:         GitLabItemState(item.State),
				Slug:          strings.Split(item.References.Full, "!")[0] + "!" + strconv.Itoa(item.IID),
				Labels:        convertLabels(item.LabelDetails, item.Labels),
			}
		case *gitlab.Epic:
			var involvedUsers []User
			if item.Author != nil {
				involvedUsers = append(involvedUsers, User{
					GitlabID:  item.Author.ID,
					Username:  item.Author.Username,
					Name:      item.Author.Name,
					State:     item.Author.State,
					AvatarURL: item.Author.AvatarURL,
					WebURL:    item.Author.WebURL,
				})
			}

			outItem = GitLabItem{
				ID:            "e" + strconv.Itoa(item.ID),
				Kind:          "epic",
				InvolvedUsers: deduplicateUsers(involvedUsers),
				WebURL:        item.WebURL,
				Title:         item.Title,
				Description:   item.Description,
				IID:           item.IID,
				CreatedAt:     item.CreatedAt,
				UpdatedAt:     item.UpdatedAt,
				ClosedAt:      item.ClosedAt,
				State:         GitLabItemState(item.State),
				Slug:          "&" + strconv.Itoa(item.IID),
				Labels:        convertLabels(nil, item.Labels),
			}
		default:
			panic("invalid type: " + fmt.Sprintf("%T", item))
		}

		// Try to find the item in our index
		var existingItem GitLabItem
		err := index.GetDocument(outItem.ID, &meilisearch.DocumentQuery{
			Fields: []string{"*"},
		}, &existingItem)
		// If item doesn't exist or has changed, add it to updates and call the callback
		if err != nil || !reflect.DeepEqual(existingItem, outItem) {
			updatedItems = append(updatedItems, outItem)
		}
	}

	task, err := index.AddDocuments(updatedItems)
	if err != nil {
		return 0, fmt.Errorf("failed to add items: %w", err)
	}

	res, err := c.client.WaitForTask(task.TaskUID, 0)
	if err != nil {
		return 0, fmt.Errorf("failed to wait for task: %w", err)
	}

	if res.Status != meilisearch.TaskStatusSucceeded {
		return 0, fmt.Errorf("item add task was not successful: %q", res.Status)
	}

	c.updateItemCallback(updatedItems)

	return len(updatedItems), <-errorChannel
}

func deduplicateUsers(users []User) []User {
	var ids = make(map[int]struct{})
	var outUsers []User
	for _, user := range users {
		if _, ok := ids[user.GitlabID]; ok {
			continue
		}
		ids[user.GitlabID] = struct{}{}
		outUsers = append(outUsers, user)
	}
	return outUsers
}

func convertLabels(labels []*gitlab.LabelDetails, fallback []string) []Label {
	var outLabels []Label
	for _, label := range labels {
		outLabels = append(outLabels, Label{
			ID:          label.ID,
			Name:        label.Name,
			Color:       label.Color,
			Description: label.Description,
			TextColor:   label.TextColor,
		})
	}
	if len(outLabels) == 0 {
		for _, name := range fallback {
			outLabels = append(outLabels, Label{
				Name: name,
			})
		}
	}
	return outLabels
}

type Label struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Color           string `json:"color"`
	Description     string `json:"description"`
	DescriptionHTML string `json:"description_html"`
	TextColor       string `json:"text_color"`
}

type GitLabItemState string

const (
	GitLabItemStateOpened GitLabItemState = "opened"
	GitLabItemStateClosed GitLabItemState = "closed"
	GitLabItemStateLocked GitLabItemState = "locked"
	GitLabItemStateMerged GitLabItemState = "merged"
)

// Basically combines things from an issue, merge request, epic etc.
type GitLabItem struct {
	ID string `json:"id"`

	Kind        string  `json:"kind"`
	WebURL      string  `json:"web_url"`
	Slug        string  `json:"slug"`
	Labels      []Label `json:"labels"`
	Title       string  `json:"title"`
	Description string  `json:"description"`

	InvolvedUsers []User `json:"involved_users"`

	IID       int             `json:"iid"`
	State     GitLabItemState `json:"state"`
	CreatedAt *time.Time      `json:"created_at"`
	UpdatedAt *time.Time      `json:"updated_at"`
	ClosedAt  *time.Time      `json:"closed_at"`
}
