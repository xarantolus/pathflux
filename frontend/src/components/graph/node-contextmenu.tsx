import React, { useCallback } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
} from "@/components/ui/context-menu"

export interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
	node: Node;
	top?: number;
	left?: number;
	right?: number;
	bottom?: number;
}

export default function NodeContextMenu({
	node,
	top = 0,
	left = 0,
	right,
	bottom,
	...props
}: ContextMenuProps) {
	const { setNodes, addNodes, setEdges } = useReactFlow();

	const duplicateNode = useCallback(() => {
		const position = {
			x: node.position.x + 50,
			y: node.position.y + 50,
		};

		addNodes({
			...node,
			selected: false,
			dragging: false,
			id: `${node.id}-copy`,
			position,
		});
	}, [node, addNodes]);

	const deleteNode = useCallback(() => {
		setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
		setEdges((edges) => edges.filter((edge) => edge.source !== node.id));
	}, [node, setNodes, setEdges]);

	return (
		<ContextMenu>
			<ContextMenuTrigger>Right click</ContextMenuTrigger>
			<ContextMenuContent
				style={{ position: 'absolute', top, left }}
				{...props}
			>
				<div style={{ padding: '0.5em' }}>
					<small>node: {node.id}</small>
				</div>
				<ContextMenuItem onSelect={duplicateNode}>
					duplicate
				</ContextMenuItem>
				<ContextMenuItem onSelect={deleteNode}>
					delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
