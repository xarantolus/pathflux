import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react';

import { type PositionLoggerNode } from './types';
import GitLabItemCard from '@/components/GitLabItemCard';
import { GitLabItem } from '@/lib/types';
import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function PositionLoggerNode({
  selected,
  // positionAbsoluteX,
  // positionAbsoluteY,
  // data,
}: NodeProps<PositionLoggerNode>) {
  const test: GitLabItem = {
      "id": "i123456789",
      "group_id": 123456789,
      "kind": "issue",
      "web_url": "https://gitlab.example.com",
      "slug": "a/b/c#21",
      "labels": [
        {
          "id": 0,
          "name": "workflow::todo",
          "color": "",
          "description": "",
          "description_html": "",
          "text_color": ""
        }
      ],
    "title": "Testing tests for testing purposes with a very long title",
      "description": "Test whether the description looks good Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab obcaecati repellendus odio nihil ut quaerat dolorum officia aperiam voluptatibus. Itaque atque unde ab pariatur cupiditate possimus quibusdam consectetur maxime numquam.",
      "involved_users": [
        {
          "id": 0,
          "username": "ghost",
          "name": "Ghost User",
          "state": "active",
          "avatar_url": "",
          "web_url": "https://gitlab.example.com/ghost"
        },
        {
          "id": 2,
          "username": "ghost2",
          "name": "Ghost User 2",
          "state": "active",
          "avatar_url": "",
          "web_url": "https://gitlab.example.com/ghost"
        }
      ],
      "iid": 21,
      "state": "opened",
      "created_at": "2024-03-09T12:38:57.386+02:00",
      "updated_at": "2024-11-29T12:42:05.327+01:00",
      "closed_at": null
  }

  const [expanded, setExpanded] = useState(false);

  return (
    // We add this class to use the same styles as React Flow's default nodes.
    <Card className='w-full h-full p-4'>
      { selected && <NodeResizeControl /> }

      <CardTitle className="flex flex-col items-center">
        <h1 className='text-center overflow-wrap-anywhere text-lg font-semibold'>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab dolorem quasi, debitis eius nesciunt, incidunt iste nostrum neque doloribus saepe non nam ad dicta, laudantium assumenda tempora vel deserunt ea.</h1>
        <Separator />
      </CardTitle>

      <GitLabItemCard
        item={test}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <Separator />
      <GitLabItemCard
        item={test}
        expanded={expanded}
        setExpanded={setExpanded}
      />

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}
