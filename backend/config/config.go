package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type GitLab struct {
	ApiKey            string
	InstanceURL       string
	ApplicationID     string
	ApplicationSecret string

	GroupIDs []int
}

type Config struct {
	Port            int
	MeiliMasterKey  string
	HostExternalURL string
	GitLab          GitLab
}

func FromEnvironment() (c *Config, err error) {
	c = &Config{}

	var getEnv = func(key string) (string, error) {
		value, ok := os.LookupEnv(key)
		if !ok {
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
