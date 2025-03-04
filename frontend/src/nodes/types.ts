import type { Node, BuiltInNode } from '@xyflow/react';

export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type TextEditorNode = Node<{ text: string }, 'text-editor'>;
export type AppNode = BuiltInNode | PositionLoggerNode | TextEditorNode;
