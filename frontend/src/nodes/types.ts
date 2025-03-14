import type { Node, BuiltInNode } from '@xyflow/react';

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type TextGraphNode = Node<{ content: string }, 'text'>;
export type AppNode = BuiltInNode | TextGraphNode | PositionLoggerNode;
