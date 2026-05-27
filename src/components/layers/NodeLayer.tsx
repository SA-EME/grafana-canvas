// components/layers/NodeLayer.tsx
import React from 'react';
import type { FieldConfig, GrafanaTheme2 } from '@grafana/data';
import { CanvasNode, Viewport } from '../../types';
import { DeviceMap } from '../../hooks/useGrafanaDataMap';
import { coerceValue } from '../../utils/dataFrameToItems';
import { getNodeFillColor } from '../../utils/colors';
import { NodeShape } from '../nodes/NodeShape';

interface ResizePatch {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  nodes: CanvasNode[];
  deviceMap: DeviceMap;
  theme: GrafanaTheme2;
  viewport: Viewport;
  editMode: boolean;
  selectedNodeId: string | null;
  linkFromNodeId: string | null;
  onNodeClick: (nodeId: string, clientX: number, clientY: number) => void;
  onNodeDrag: (nodeId: string, x: number, y: number, commit: boolean) => void;
  onNodeResize: (nodeId: string, patch: ResizePatch, commit: boolean) => void;
  fieldConfigDefaults: FieldConfig;
}

export const NodeLayer: React.FC<Props> = ({
  nodes,
  deviceMap,
  theme,
  viewport,
  editMode,
  selectedNodeId,
  linkFromNodeId,
  onNodeClick,
  onNodeDrag,
  onNodeResize,
  fieldConfigDefaults,
}) => {
  const sorted = [...nodes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <g>
      {sorted.map((node) => {
        const elementKind = node.elementKind ?? 'node';
        const item = node.dataId ? deviceMap[node.dataId] : undefined;

        const label = node.label ?? item?.name ?? node.dataId ?? node.nodeId;

        const rawValue =
          item?.value !== undefined
            ? item.value
            : node.customValue !== undefined
            ? coerceValue(node.customValue)
            : undefined;

        const fill =
          elementKind === 'node'
            ? getNodeFillColor(theme, fieldConfigDefaults, rawValue)
            : node.fillColor ?? '#5555aa';

        const selected = selectedNodeId === node.nodeId;
        const linkOrigin = linkFromNodeId === node.nodeId;

        return (
          <NodeShape
            key={node.nodeId}
            node={node}
            label={label}
            fill={fill}
            theme={theme}
            viewportScale={viewport.scale}
            editMode={editMode}
            selected={selected}
            linkOrigin={linkOrigin}
            onClick={(cx, cy) => onNodeClick(node.nodeId, cx, cy)}
            onDrag={(x, y, commit) => onNodeDrag(node.nodeId, x, y, commit)}
            onResize={(patch, commit) => onNodeResize(node.nodeId, patch, commit)}
          />
        );
      })}
    </g>
  );
};
