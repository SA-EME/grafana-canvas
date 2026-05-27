// components/CanvasPanel.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { PanelProps } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';

import { SimpleOptions } from '../types';
import { useGrafanaDataMap } from '../hooks/useGrafanaDataMap';
import { useCanvasController } from '../hooks/useCanvasController';
import { getDataLinksForId } from '../utils/dataLinks';

import { CanvasStage } from './CanvasStage';
import { GridLayer } from './layers/GridLayer';
import { LinkLayer } from './layers/LinkLayer';
import { NodeLayer } from './layers/NodeLayer';
import { Toolbar } from './ui/Toolbar';
import { MiniHud } from './ui/MiniHud';
import { NodeInspector } from './ui/NodeInspector';
import { DataLinksMenu } from './ui/DataLinksMenu';

interface Props extends PanelProps<SimpleOptions> {}

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

const getStyles = () => ({
  wrapper: css`
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
  `,
});

export const CanvasPanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  onOptionsChange,
  fieldConfig,
  replaceVariables,
}) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const { deviceMap, items } = useGrafanaDataMap(data);
  const canvas = useCanvasController(options, onOptionsChange, { width, height });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [linkFromNodeId, setLinkFromNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return undefined;
    return canvas.nodes.find((n) => n.nodeId === selectedNodeId);
  }, [selectedNodeId, canvas.nodes]);

  const selectedItem = useMemo(() => {
    if (!selectedNode?.dataId) return undefined;
    return deviceMap[selectedNode.dataId];
  }, [selectedNode?.dataId, deviceMap]);

  const handleNodeClick = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const node = canvas.nodes.find((n) => n.nodeId === nodeId);
      const elementKind = node?.elementKind ?? 'node';

      // Data links: only for network nodes (not shapes/texts), when inspector is disabled
      if (!options.showNodeInspector && elementKind === 'node') {
        if (node?.dataId) {
          const links = getDataLinksForId(data, node.dataId, replaceVariables);
          if (links.length === 1) {
            // Single link: navigate directly without popup
            const link = links[0];
            if (link.target === '_blank') {
              window.open(link.href, '_blank');
            } else {
              window.location.href = link.href;
            }
          } else if (links.length > 1) {
            setContextMenu({ x: clientX, y: clientY, nodeId });
          }
        }
        return;
      }

      // Shapes and texts never enter link mode or show inspector
      if (elementKind !== 'node') {
        setSelectedNodeId(nodeId);
        return;
      }

      // Normal node inspector behavior
      if (options.editMode && linkFromNodeId) {
        if (nodeId !== linkFromNodeId) {
          canvas.addLink(linkFromNodeId, nodeId);
        }
        setLinkFromNodeId(null);
        setSelectedNodeId(nodeId);
        return;
      }
      setSelectedNodeId(nodeId);
    },
    [options.showNodeInspector, options.editMode, linkFromNodeId, canvas, data, replaceVariables]
  );

  const handleNodeDrag = useCallback(
    (nodeId: string, x: number, y: number, commit: boolean) => {
      canvas.updateNodeLive(nodeId, { x, y });

      if (commit) {
        const next = canvas.nodes.map((n) => (n.nodeId === nodeId ? { ...n, x, y } : n));
        canvas.commitNodes(next);
      }
    },
    [canvas]
  );

  const handleNodeResize = useCallback(
    (nodeId: string, patch: { x: number; y: number; w: number; h: number }, commit: boolean) => {
      canvas.patchNode(nodeId, patch, commit);
    },
    [canvas]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    canvas.deleteNode(selectedNodeId);
    setSelectedNodeId(null);
    setLinkFromNodeId(null);
  }, [selectedNodeId, canvas]);

  const handleStartLink = useCallback(() => {
    if (!selectedNodeId) return;
    setLinkFromNodeId(selectedNodeId);
  }, [selectedNodeId]);

  const handleCancelLink = useCallback(() => setLinkFromNodeId(null), []);

  // Build data links for the current context menu target
  const contextMenuLinks = useMemo(() => {
    if (!contextMenu) return [];
    const node = canvas.nodes.find((n) => n.nodeId === contextMenu.nodeId);
    if (!node?.dataId) return [];
    return getDataLinksForId(data, node.dataId, replaceVariables);
  }, [contextMenu, canvas.nodes, data, replaceVariables]);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          background: ${theme.colors.background.primary};
        `
      )}
    >
      {(options.editMode || options.showViewControls) && (
        <Toolbar
          editMode={options.editMode}
          showViewControls={options.showViewControls}
          onAddNode={canvas.addNode}
          onAddNodeFromData={canvas.addNodeFromData}
          onAddShape={canvas.addShape}
          onAddText={canvas.addText}
          dataItems={items}
          onResetView={canvas.resetView}
          onZoomToFit={canvas.zoomToFit}
        />
      )}

      <CanvasStage
        width={width}
        height={height}
        viewport={canvas.viewport}
        onViewportChange={canvas.setViewportLive}
        onViewportCommit={canvas.commitViewport}
        enablePan={true}
        enableZoom={true}
        onBackgroundPointerDown={() => {
          setSelectedNodeId(null);
          setLinkFromNodeId(null);
          setContextMenu(null);
        }}
      >
        {options.showGrid && <GridLayer />}

        <LinkLayer links={canvas.links} nodes={canvas.nodes} theme={theme} />

        <NodeLayer
          nodes={canvas.nodes}
          deviceMap={deviceMap}
          theme={theme}
          viewport={canvas.viewport}
          editMode={options.editMode}
          selectedNodeId={selectedNodeId}
          linkFromNodeId={linkFromNodeId}
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeResize={handleNodeResize}
          fieldConfigDefaults={fieldConfig.defaults}
        />
      </CanvasStage>

      {options.showNodeInspector && (
        <NodeInspector
          editMode={options.editMode}
          selectedNode={selectedNode}
          selectedItem={selectedItem}
          linkFromNodeId={linkFromNodeId}
          onDelete={handleDeleteSelected}
          onStartLink={handleStartLink}
          onCancelLink={handleCancelLink}
          onNodePatch={(patch, commit) => {
            if (selectedNodeId) {
              canvas.patchNode(selectedNodeId, patch, commit);
            }
          }}
          onBringToFront={() => selectedNodeId && canvas.bringToFront(selectedNodeId)}
          onSendToBack={() => selectedNodeId && canvas.sendToBack(selectedNodeId)}
          fieldConfigDefaults={fieldConfig.defaults}
          theme={theme}
        />
      )}

      {contextMenu && contextMenuLinks.length > 0 && (
        <DataLinksMenu
          x={contextMenu.x}
          y={contextMenu.y}
          links={contextMenuLinks}
          onClose={() => setContextMenu(null)}
        />
      )}

      {options.showMiniHud && (
        <MiniHud
          viewport={canvas.viewport}
          nodesCount={canvas.nodes.length}
          availableItemsCount={items.length}
        />
      )}
    </div>
  );
};
