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
	Node,
} from '@xyflow/react';

import { initialNodes, nodeTypes } from '../nodes';
import { initialEdges, edgeTypes } from '../edges';
import { default as ContextMenu, ContextMenuProps} from '@/components/graph/node-contextmenu';

export default function Graph() {
	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const onConnect: OnConnect = useCallback(
		(connection) => setEdges((edges) => addEdge(connection, edges)),
		[setEdges]
	);
	const [menu, setMenu] = useState<ContextMenuProps | null>(null);
	const ref: Ref<any> = useRef(null);

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			// Prevent native context menu from showing
			event.preventDefault();

			// Get the pane's bounding rectangle (it may not fill the full screen)
			const pane = ref.current.getBoundingClientRect();

			// Calculate the click position relative to the pane
			const offsetX = event.clientX - pane.left;
			const offsetY = event.clientY - pane.top;

			// Assume fixed menu dimensions
			const menuWidth = 200;
			const menuHeight = 200;

			// Clamp the menu position inside the pane boundaries
			const left = offsetX + menuWidth > pane.width ? pane.width - menuWidth : offsetX;
			const top = offsetY + menuHeight > pane.height ? pane.height - menuHeight : offsetY;

			setMenu({
				node: node,
				left,
				top,
			});
		},
		[setMenu],
	);


	return (
		<div className="w-full h-screen">
			<ReactFlow
				ref={ref}
				onPaneClick={() => setMenu(null)}
				colorMode='system'
				nodes={nodes}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				edges={edges}
				edgeTypes={edgeTypes}
				onEdgesChange={onEdgesChange}
				onNodeContextMenu={onNodeContextMenu}
				onConnect={onConnect}
				fitView
			>
				<Background />
				<MiniMap />
				{menu && <ContextMenu {...menu} />}
				<Controls />
			</ReactFlow>
		</div>
	);
}
