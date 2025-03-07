package main

import (
	"context"
	"log"
	"os"
	"pathflux/config"
	"pathflux/meili"
	"time"
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
	client, err := meili.NewDBClient(ctx, cfg.GitLab, dbLogger, meiliHost, meiliAPIKey)
	if err != nil {
		log.Fatalf("failed to create MeiliSearch client: %v", err)
	}

	_ = client

	time.Sleep(5 * time.Minute)
}
