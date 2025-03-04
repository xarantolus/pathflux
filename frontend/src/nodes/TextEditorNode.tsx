import { Handle, Position, type NodeProps } from '@xyflow/react';

import { type TextEditorNode } from './types';

export function TextEditorNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<TextEditorNode>) {
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  return (
    // We add this class to use the same styles as React Flow's default nodes.
    <div className="react-flow__node-default">
      <textarea
        style={{ width: '100%', height: '100%' }}
        defaultValue={data.text}
      />

      <div>
        {x} {y}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
