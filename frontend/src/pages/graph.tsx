import { Ref, useCallback, useRef, useState } from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	addEdge,
	useNodesState,
	useEdgesState,
	type OnConnect,
	NodeMouseHandler,
} from '@xyflow/react';

import { initialNodes, nodeTypes } from '../nodes';
import { initialEdges, edgeTypes } from '../edges';
// import {
// 	ContextMenu,
// 	ContextMenuContent,
// 	ContextMenuItem,
// 	ContextMenuTrigger,
// 	ContextMenuSeparator,
// } from "@/components/ui/context-menu";

interface NodeContextMenuProps {
	x: number;
	y: number;
	nodeId: string;
	isOpen: boolean;
}

export default function Graph() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const onConnect: OnConnect = useCallback(
		(connection) => setEdges((edges) => addEdge(connection, edges)),
		[setEdges]
	);
	const [contextMenu, setContextMenu] = useState<NodeContextMenuProps | null>(null);
	const ref: Ref<any> = useRef(null);

	const onNodeContextMenu: NodeMouseHandler = useCallback(
		(event, node) => {
			// Prevent native context menu from showing
			event.preventDefault();

			// Calculate position relative to the pane
			const { left, top } = ref.current.getBoundingClientRect();
			const x = event.clientX - left;
			const y = event.clientY - top;

			setContextMenu({
				x,
				y,
				nodeId: node.id,
				isOpen: true,
			});
		},
		[ref]
	);

	const handleDeleteNode = useCallback(() => {
		if (contextMenu) {
			setNodes((nds) => nds.filter((node) => node.id !== contextMenu.nodeId));
			setContextMenu(null);
		}
	}, [contextMenu, setNodes]);

	const handleEditNode = useCallback(() => {
		if (contextMenu) {
			// Implement edit functionality
			console.log(`Editing node: ${contextMenu.nodeId}`);
			setContextMenu(null);
		}
	}, [contextMenu]);

	const handleDuplicateNode = useCallback(() => {
		if (contextMenu) {
			const nodeToClone = nodes.find((node) => node.id === contextMenu.nodeId);
			if (nodeToClone) {
				const newNode = {
					...nodeToClone,
					id: `${nodeToClone.id}-clone-${Date.now()}`,
					position: {
						x: nodeToClone.position.x + 50,
						y: nodeToClone.position.y + 50,
					},
				};
				setNodes((nds) => [...nds, newNode]);
			}
			setContextMenu(null);
		}
	}, [contextMenu, nodes, setNodes]);

	return (
		<div className="w-full h-screen">
			<ReactFlow
				ref={ref}
				onPaneClick={() => setContextMenu(null)}
				onNodeContextMenu={onNodeContextMenu}
				colorMode='system'
				nodes={nodes}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				edges={edges}
				edgeTypes={edgeTypes}
				onEdgesChange={onEdgesChange}
				onScroll={() => setContextMenu(null)}
				onConnect={onConnect}
				fitView
				minZoom={0.1}
			>
				<Background />
				<MiniMap />
				<Controls />
				{contextMenu && (
					<div
						className="custom-context-menu"
						style={{
							position: 'absolute',
							left: `${contextMenu.x}px`,
							top: `${contextMenu.y}px`,
							zIndex: 1000,
						}}
					>
						<div className="bg-popover border border-border rounded-md shadow-md p-1 w-56">
							<div className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm rounded-sm" onClick={handleEditNode}>
								Edit Node
							</div>
							<div className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm rounded-sm" onClick={handleDuplicateNode}>
								Duplicate Node
							</div>
							<div className="h-px my-1 bg-border" />
							<div className="cursor-pointer hover:bg-accent hover:text-accent-foreground text-destructive px-2 py-1.5 text-sm rounded-sm" onClick={handleDeleteNode}>
								Delete Node
							</div>
						</div>
					</div>
				)}
			</ReactFlow>
		</div>
	);
}
