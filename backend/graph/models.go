package graph

import "sync"

type Graph struct {
	lock sync.RWMutex

	Nodes []*Node `json:"nodes"`
	Edges []*Edge `json:"edges"`
}

type Edge struct {
	ID string `json:"id"`

	From string `json:"from"`
	To   string `json:"to"`
}

type Node struct {
	ID string `json:"id"`

	Label string `json:"label"`
}
