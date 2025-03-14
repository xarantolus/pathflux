import type { NodeTypes } from '@xyflow/react';

import { TextGraphNode } from './TextGraphNode';
import { AppNode } from './types';
import { PositionLoggerNode } from './PositionLoggerNode';

export const initialNodes: AppNode[] = [
  { id: 'a', type: 'input', position: { x: 0, y: 0 }, data: { label: 'wire' } },
  {
    id: 'b',
    type: 'position-logger',
    position: { x: -1000, y: -500 },
    data: { label: 'drag me!' },
  },
  { id: 'c', position: { x: 100, y: 100 }, data: { label: 'your ideas' } },
  {
    id: 'd',
    type: 'output',
    position: { x: 0, y: 200 },
    data: { label: 'with React Flow' },
  },
  {
    id: 'text',
    type: 'text',
    position: { x: -150, y: -200 },
    data: { content: '# Hello, world!\n\nHello, world!\n\nHello, world!\n\nHello, world!\n\nHello, world!\n\nHello, world!\n\n' }
  },
];

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'text': TextGraphNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
