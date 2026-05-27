// components/layers/LinkLayer.tsx
import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { CanvasLink, CanvasNode } from '../../types';

interface Props {
  links: CanvasLink[];
  nodes: CanvasNode[];
  theme: GrafanaTheme2;
}

function nodeCenter(n: CanvasNode) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

export const LinkLayer: React.FC<Props> = ({ links, nodes, theme }) => {
  const nodeById = useMemo(() => {
    const m = new Map<string, CanvasNode>();
    nodes.forEach((n) => m.set(n.nodeId, n));
    return m;
  }, [nodes]);

  return (
    <g>
      {links.map((l) => {
        const from = nodeById.get(l.fromNodeId);
        const to = nodeById.get(l.toNodeId);
        if (!from || !to) {
          return null;
        }
        const a = nodeCenter(from);
        const b = nodeCenter(to);

        return (
          <line
            key={l.linkId}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={theme.colors.text.secondary}
            strokeOpacity={0.5}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};