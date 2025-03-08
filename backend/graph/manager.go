package graph

import "sync"

type Manager struct {
	lock sync.RWMutex

	Graphs map[string]*Graph
}
