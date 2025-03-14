package graph

import "sync"

type Graph struct {
	lock sync.RWMutex

	Nodes []*Node `json:"nodes"`
	Edges []*Edge `json:"edges"`
}

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Node struct {
	ID   string   `json:"id"`
	Type NodeType `json:"type"`

	Position Position `json:"position"`
}

type Marker struct {
	Type   string `json:"type"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Color  string `json:"color"`
}

type Edge struct {
	ID   string `json:"id"`
	Type string `json:"type"`

	Source string `json:"source"`
	Target string `json:"target"`

	MarkerEnd string `json:"markerEnd"`
}

type NodeType string

const (
	// NodeTypeText is a markdown text node
	NodeTypeText NodeType = "text"
)

// Literally just a markdown text node
type TextNode struct {
	Node

	// Content is a markdown string
	Content string `json:"content"`
}
