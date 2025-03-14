import { Handle, NodeResizeControl, Position, ResizeParams, type NodeProps } from '@xyflow/react';

import { type TextGraphNode } from './types';
import Markdown from '@/components/Markdown';
import { Card } from '@/components/ui/card';

export function TextGraphNode({
  selected,
  data,
}: NodeProps<TextGraphNode>) {
  const onResize = (_: any, resizeParams: ResizeParams) => {
    // Resize the node
    console.log(resizeParams);
  };

  return (
    // We add this class to use the same styles as React Flow's default nodes.
    <Card className="w-full h-full p-4">
      { selected && <NodeResizeControl onResize={onResize} /> }
      <Markdown className='w-full h-full'
        content={data.content}
      />

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}
