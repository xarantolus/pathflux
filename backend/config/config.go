package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type GitLab struct {
	ApiKey            string
	InstanceURL       string
	ApplicationID     string
	ApplicationSecret string

	GroupIDs []int

	UserUpdateInterval time.Duration
	ItemUpdateInterval time.Duration
}

type Config struct {
	Port            int
	MeiliMasterKey  string
	HostExternalURL string
	GitLab          GitLab
}

func FromEnvironment() (c *Config, err error) {
	c = &Config{}

	var getEnv = func(key string, defaultValue ...string) (string, error) {
		value, ok := os.LookupEnv(key)
		if !ok {
			if len(defaultValue) > 0 {
				return defaultValue[0], nil
			}

			return "", fmt.Errorf("missing env variable %q", key)
		}
		return value, nil
	}

	port, err := getEnv("PORT")
	if err != nil {
		port = "8080"
	}

	c.Port, err = strconv.Atoi(port)
	if err != nil {
		return nil, fmt.Errorf("port is not a number: %w", err)
	}

	userUpdateInterval, err := getEnv("USER_UPDATE_INTERVAL", "6h")
	if err != nil {
		return nil, err
	}
	c.GitLab.UserUpdateInterval, err = time.ParseDuration(userUpdateInterval)
	if err != nil {
		return nil, fmt.Errorf("user update interval is not a valid duration: %w", err)
	}

	itemUpdateInterval, err := getEnv("ITEM_UPDATE_INTERVAL", "5m")
	if err != nil {
		return nil, err
	}
	c.GitLab.ItemUpdateInterval, err = time.ParseDuration(itemUpdateInterval)
	if err != nil {
		return nil, fmt.Errorf("item update interval is not a valid duration: %w", err)
	}

	c.MeiliMasterKey, err = getEnv("MEILI_MASTER_KEY")
	if err != nil {
		return nil, err
	}

	c.HostExternalURL, err = getEnv("HOST_EXTERNAL_URL")
	if err != nil {
		return nil, err
	}

	c.GitLab.ApiKey, err = getEnv("GITLAB_API_KEY")
	if err != nil {
		return nil, err
	}

	c.GitLab.InstanceURL, err = getEnv("GITLAB_INSTANCE_URL")
	if err != nil {
		return nil, err
	}

	c.GitLab.ApplicationID, err = getEnv("GITLAB_APPLICATION_ID")
	if err != nil {
		return nil, err
	}

	c.GitLab.ApplicationSecret, err = getEnv("GITLAB_APPLICATION_SECRET")
	if err != nil {
		return nil, err
	}

	groupIDs, ok := os.LookupEnv("GITLAB_GROUP_IDS")
	if !ok {
		return nil, fmt.Errorf("missing env variable %q", "GITLAB_GROUP_IDS")
	}

	for _, groupID := range strings.Split(groupIDs, ",") {
		num, err := strconv.Atoi(strings.TrimSpace(groupID))
		if err != nil {
			return nil, fmt.Errorf("group id %q is not a number", groupID)
		}

		c.GitLab.GroupIDs = append(c.GitLab.GroupIDs, num)
	}

	return c, nil
}
