package meili

import (
	"fmt"
	"time"

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

func listAllGroupIssues(client *gitlab.Client, groupID any, updatedAfter *time.Time) ([]*gitlab.Issue, error) {
	var allIssues []*gitlab.Issue

	options := &gitlab.ListGroupIssuesOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		OrderBy: gitlab.Ptr("updated_at"),
		Sort:    gitlab.Ptr("desc"),
	}

	if updatedAfter != nil {
		options.UpdatedAfter = updatedAfter
	}

	for {
		issues, resp, err := client.Issues.ListGroupIssues(groupID, options)
		if err != nil {
			return nil, err
		}

		for _, issue := range issues {
			if issue.Confidential {
				continue
			}
			allIssues = append(allIssues, issue)
		}

		// Stop pagination if we've reached or passed the date threshold
		if updatedAfter != nil && len(issues) > 0 && issues[len(issues)-1].UpdatedAt.Before(*updatedAfter) {
			break
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return allIssues, nil
}

func listAllGroupMergeRequests(client *gitlab.Client, groupID any, updatedAfter *time.Time) ([]*gitlab.BasicMergeRequest, error) {
	var allMergeRequests []*gitlab.BasicMergeRequest

	options := &gitlab.ListGroupMergeRequestsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		OrderBy: gitlab.Ptr("updated_at"),
		Sort:    gitlab.Ptr("desc"),
	}

	if updatedAfter != nil {
		options.UpdatedAfter = updatedAfter
	}

	for {
		mergeRequests, resp, err := client.MergeRequests.ListGroupMergeRequests(groupID, options)
		if err != nil {
			return nil, err
		}

		allMergeRequests = append(allMergeRequests, mergeRequests...)

		// Stop pagination if we've reached or passed the date threshold
		if updatedAfter != nil && len(mergeRequests) > 0 && mergeRequests[len(mergeRequests)-1].UpdatedAt.Before(*updatedAfter) {
			break
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return allMergeRequests, nil
}

func listAllGroupEpics(client *gitlab.Client, groupID any, updatedAfter *time.Time) ([]*gitlab.Epic, error) {
	var allEpics []*gitlab.Epic

	options := &gitlab.ListGroupEpicsOptions{
		ListOptions: gitlab.ListOptions{
			Page:    1,
			PerPage: perPageEntries,
		},
		OrderBy:                 gitlab.Ptr("updated_at"),
		Sort:                    gitlab.Ptr("desc"),
		IncludeAncestorGroups:   gitlab.Ptr(true),
		IncludeDescendantGroups: gitlab.Ptr(true),
	}

	if updatedAfter != nil {
		options.UpdatedAfter = updatedAfter
	}

	for {
		epics, resp, err := client.Epics.ListGroupEpics(groupID, options)
		if err != nil {
			return nil, err
		}

		allEpics = append(allEpics, epics...)

		// Stop pagination if we've reached or passed the date threshold
		if updatedAfter != nil && len(epics) > 0 && epics[len(epics)-1].UpdatedAt.Before(*updatedAfter) {
			break
		}

		if resp.CurrentPage >= resp.TotalPages {
			break
		}

		options.Page = resp.NextPage
	}

	return allEpics, nil
}
