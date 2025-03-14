

export interface Graph {
	nodes: Node[];
	edges: Edge[];
}

export interface Position {
	x: number;
	y: number;
}

type NodeType = "text";

export interface Node {
	id: string;
	type: NodeType;
	position: Position;
}

export interface Marker {
	type: string;
	width: number;
	height: number;
	color: string;
}

export interface Edge {
	id: string;
	type: string;
	source: string;
	target: string;
	markerEnd: string;
}

export interface TextNode extends Node {
	content: string;
}
