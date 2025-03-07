package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"pathflux/config"
	"pathflux/meili"
	"pathflux/web"
)

func main() {
	meiliHost, meiliAPIKey := os.Getenv("MEILI_HOST"), os.Getenv("MEILI_MASTER_KEY")
	if meiliHost == "" || meiliAPIKey == "" {
		log.Fatal("Both MEILI_HOST and MEILI_MASTER_KEY environment variables must be set")
	}

	cfg, err := config.FromEnvironment()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := log.New(os.Stdout, "", log.LstdFlags)

	dbLogger := log.New(logger.Writer(), "[meili] ", log.LstdFlags)

	client, err := meili.NewDBClient(ctx, cfg.GitLab, dbLogger, meiliHost, meiliAPIKey, func(items []meili.GitLabItem) {
		for _, item := range items {
			fmt.Println(item.Title)
		}
	}, func(items []meili.User) {
		for _, item := range items {
			fmt.Println(item.Name)
		}
	})
	if err != nil {
		log.Fatalf("failed to create MeiliSearch client: %v", err)
	}

	server := &web.Server{
		Cfg: cfg,
		DB:  client,
	}

	if err := server.Run(); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}

	log.Fatal("server stopped unexpectedly")
}
