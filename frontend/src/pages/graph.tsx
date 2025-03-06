import { useCallback } from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	addEdge,
	useNodesState,
	useEdgesState,
	type OnConnect,
} from '@xyflow/react';

import { initialNodes, nodeTypes } from '../nodes';
import { initialEdges, edgeTypes } from '../edges';


export default function Graph() {
	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const onConnect: OnConnect = useCallback(
		(connection) => setEdges((edges) => addEdge(connection, edges)),
		[setEdges]
	);

	return (
		<div className="w-full h-screen">
			<ReactFlow
				colorMode='system'
				nodes={nodes}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				edges={edges}
				edgeTypes={edgeTypes}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
			>
				<Background />
				<MiniMap />
				<Controls />
			</ReactFlow>
		</div>
	);
}
