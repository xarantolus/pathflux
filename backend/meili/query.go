package meili

import (
	"context"
	"encoding/json"

	"github.com/meilisearch/meilisearch-go"
)

func (c *DBClient) SearchUsers(ctx context.Context, query string) (users []User, err error) {
	index := c.client.Index(USERS_INDEX)

	resp, err := index.SearchRawWithContext(ctx, query, &meilisearch.SearchRequest{
		Limit:                10,
		AttributesToRetrieve: []string{"*"},
	})
	if err != nil {
		return nil, err
	}

	var r struct {
		Hits []User `json:"hits"`
	}
	if err := json.Unmarshal(*resp, &r); err != nil {
		return nil, err
	}

	return r.Hits, nil
}

func (c *DBClient) SearchItems(ctx context.Context, query string) (items []GitLabItem, err error) {
	index := c.client.Index(ITEMS_INDEX)

	resp, err := index.SearchRawWithContext(ctx, query, &meilisearch.SearchRequest{
		Limit:                10,
		AttributesToRetrieve: []string{"*"},
	})
	if err != nil {
		return nil, err
	}

	var r struct {
		Hits []GitLabItem `json:"hits"`
	}
	if err := json.Unmarshal(*resp, &r); err != nil {
		return nil, err
	}

	return r.Hits, nil
}
