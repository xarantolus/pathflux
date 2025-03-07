package meili

import (
	"fmt"

	gitlab "gitlab.com/gitlab-org/api/client-go"
)

const perPageEntries = 100

func listAllGroupMembers(g *gitlab.Client, groupID interface{}) (users []*gitlab.GroupMember, err error) {
	var page = 1

	for {
		members, _, err := g.Groups.ListAllGroupMembers(groupID, &gitlab.ListGroupMembersOptions{
			ListOptions: gitlab.ListOptions{
				Page:    page,
				PerPage: perPageEntries,
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

func listAllGroupIssues(client *gitlab.Client, groupID any, outputChannel chan any) error {
	options := &gitlab.ListGroupIssuesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		// WithLabelDetails: gitlab.Ptr(true),
	}

	for {
		issues, resp, err := client.Issues.ListGroupIssues(groupID, options)
		if err != nil {
			return err
		}

		for _, issue := range issues {
			if issue.Confidential {
				continue
			}
			outputChannel <- issue
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return nil
}

func listAllGroupMergeRequests(client *gitlab.Client, groupID any, outputChannel chan any) error {
	options := &gitlab.ListGroupMergeRequestsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		// WithLabelsDetails: gitlab.Ptr(true),
	}

	for {
		mergeRequests, resp, err := client.MergeRequests.ListGroupMergeRequests(groupID, options)
		if err != nil {
			return err
		}

		for _, mergeRequest := range mergeRequests {
			outputChannel <- mergeRequest
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return nil
}

func listAllGroupEpics(client *gitlab.Client, groupID any, outputChannel chan any) error {
	options := &gitlab.ListGroupEpicsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		// WithLabelDetails:        gitlab.Ptr(true),
		IncludeAncestorGroups:   gitlab.Ptr(true),
		IncludeDescendantGroups: gitlab.Ptr(true),
	}

	for {
		epics, resp, err := client.Epics.ListGroupEpics(groupID, options)
		if err != nil {
			return err
		}

		for _, epic := range epics {
			outputChannel <- epic
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return nil
}
