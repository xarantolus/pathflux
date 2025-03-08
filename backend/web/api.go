package web

import (
	"pathflux/meili"

	"github.com/gofiber/fiber/v2"
)

func (s *Server) SearchUsers(c *fiber.Ctx) error {
	users, err := s.DB.SearchUsers(c.Context(), c.Query("q"))
	if err != nil {
		return err
	}
	return c.JSON(users)
}

func (s *Server) SearchItems(c *fiber.Ctx) error {
	state := meili.ParseItemState(c.Query("state"))
	sort := meili.ParseSort(c.Query("sort"))
	items, err := s.DB.SearchItems(c.Context(), c.Query("q"), state, sort)
	if err != nil {
		return err
	}
	return c.JSON(items)
}
