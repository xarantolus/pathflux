package web

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"pathflux/config"
	"pathflux/meili"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

type Server struct {
	Cfg *config.Config
	DB  *meili.DBClient
}

func (s *Server) Run() (err error) {
	app := fiber.New(fiber.Config{
		AppName: "MOVE Search",
	})

	api := app.Group("/api/v1")
	api.Get("/users/search", s.SearchUsers)
	api.Get("/items/search", s.SearchItems)

	frontend := os.DirFS("../frontend/dist")
	app.Use("/", filesystem.New(filesystem.Config{
		Root: http.FS(frontend),
	}))

	indexFile, err := fs.ReadFile(frontend, "index.html")
	if err != nil {
		log.Fatal("Could not read index.html from embedded filesystem")
	}
	app.Get("/*", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html")
		c.Set("Content-Length", strconv.Itoa(len(indexFile)))
		return c.Status(http.StatusOK).Send(indexFile)
	})

	return app.Listen(":" + strconv.FormatInt(int64(s.Cfg.Port), 10))
}
