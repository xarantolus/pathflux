package model

type Edge struct {
	ID string `json:"id"`

	From string `json:"from"`
	To   string `json:"to"`
}

type Node struct {
	ID string `json:"id"`

	Label string `json:"label"`
}
