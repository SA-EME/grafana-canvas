// hooks/useCanvasController.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SimpleOptions, Viewport, CanvasNode, CanvasLink, ShapeType } from '../types';
import { uuid } from '../utils/ids';

interface PanelSize {
  width: number;
  height: number;
}

function screenToWorld(vp: Viewport, sx: number, sy: number) {
  return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale };
}

export function useCanvasController(
  options: SimpleOptions,
  onOptionsChange: (o: SimpleOptions) => void,
  size: PanelSize
) {
  const optCanvas = options.canvas;

  const defaultVp = options.defaultViewport ?? { x: 0, y: 0, scale: 1 };

  const [viewport, setViewport] = useState<Viewport>(defaultVp);
  const [nodes, setNodes] = useState<CanvasNode[]>(optCanvas.nodes);
  const [links, setLinks] = useState<CanvasLink[]>(optCanvas.links);

  useEffect(
    () => setViewport(options.defaultViewport ?? { x: 0, y: 0, scale: 1 }),
    [options.defaultViewport?.x, options.defaultViewport?.y, options.defaultViewport?.scale]
  );
  useEffect(() => setNodes(optCanvas.nodes), [optCanvas.nodes]);
  useEffect(() => setLinks(optCanvas.links), [optCanvas.links]);

  const commitCanvas = useCallback(
    (partial: Partial<SimpleOptions['canvas']>) => {
      onOptionsChange({
        ...options,
        canvas: {
          ...options.canvas,
          ...partial,
        },
      });
    },
    [onOptionsChange, options]
  );

  const setViewportLive = useCallback((vp: Viewport) => setViewport(vp), []);
  const commitViewport = useCallback((vp: Viewport) => commitCanvas({ viewport: vp }), [commitCanvas]);

  const commitNodes = useCallback((ns: CanvasNode[]) => commitCanvas({ nodes: ns }), [commitCanvas]);
  const commitLinks = useCallback((ls: CanvasLink[]) => commitCanvas({ links: ls }), [commitCanvas]);

  const addNode = useCallback(() => {
    const centerWorld = screenToWorld(viewport, size.width / 2, size.height / 2);

    const n: CanvasNode = {
      nodeId: uuid(),
      kind: 'generic',
      x: centerWorld.x - 60,
      y: centerWorld.y - 30,
      w: 120,
      h: 60,
      label: `Node ${nodes.length + 1}`,
      dataId: undefined,
    };

    const next = [...nodes, n];
    setNodes(next);
    commitNodes(next);
  }, [viewport, size.width, size.height, nodes, commitNodes]);

  const addShape = useCallback(
    (shapeType: ShapeType) => {
      const center = screenToWorld(viewport, size.width / 2, size.height / 2);
      const minZ = nodes.length > 0 ? Math.min(...nodes.map((n) => n.zIndex ?? 0)) : 0;

      const n: CanvasNode = {
        nodeId: uuid(),
        elementKind: 'shape',
        kind: 'generic',
        shapeType,
        x: center.x - 100,
        y: center.y - 75,
        w: 200,
        h: 150,
        fillColor: '#5555aa',
        fillOpacity: 0.25,
        strokeColor: '#888888',
        strokeWidth: 1,
        rx: shapeType === 'rect' ? 8 : 0,
        zIndex: Math.min(minZ - 1, -1),
      };

      const next = [...nodes, n];
      setNodes(next);
      commitNodes(next);
    },
    [viewport, size.width, size.height, nodes, commitNodes]
  );

  const addText = useCallback(() => {
    const center = screenToWorld(viewport, size.width / 2, size.height / 2);
    const maxZ = nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex ?? 0)) : 0;

    const n: CanvasNode = {
      nodeId: uuid(),
      elementKind: 'text',
      kind: 'generic',
      x: center.x - 100,
      y: center.y - 12,
      w: 200,
      h: 32,
      content: 'Text',
      fontSize: 18,
      textColor: '#ffffff',
      zIndex: Math.max(maxZ + 1, 1),
    };

    const next = [...nodes, n];
    setNodes(next);
    commitNodes(next);
  }, [viewport, size.width, size.height, nodes, commitNodes]);

  const addNodeFromData = useCallback(
    (dataId: string) => {
      const centerWorld = screenToWorld(viewport, size.width / 2, size.height / 2);

      const n: CanvasNode = {
        nodeId: uuid(),
        kind: 'generic',
        x: centerWorld.x - 60,
        y: centerWorld.y - 30,
        w: 120,
        h: 60,
        label: undefined,
        dataId,
      };

      const next = [...nodes, n];
      setNodes(next);
      commitNodes(next);
    },
    [viewport, size.width, size.height, nodes, commitNodes]
  );

  const updateNodeLive = useCallback((nodeId: string, patch: Partial<CanvasNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.nodeId === nodeId ? { ...n, ...patch } : n))
    );
  }, []);

  const deleteNode = useCallback(
    (nodeId: string) => {
      const nextNodes = nodes.filter((n) => n.nodeId !== nodeId);
      const nextLinks = links.filter((l) => l.fromNodeId !== nodeId && l.toNodeId !== nodeId);

      setNodes(nextNodes);
      setLinks(nextLinks);

      // Single commitCanvas to avoid two onOptionsChange calls with the same stale
      // options closure where the second would restore the deleted node.
      commitCanvas({ nodes: nextNodes, links: nextLinks });
    },
    [nodes, links, commitCanvas]
  );

  const addLink = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
        return;
      }

      const exists = links.some(
        (l) =>
          (l.fromNodeId === fromNodeId && l.toNodeId === toNodeId) ||
          (l.fromNodeId === toNodeId && l.toNodeId === fromNodeId)
      );
      if (exists) {
        return;
      }

      const nextLinks = [
        ...links,
        { linkId: uuid(), fromNodeId, toNodeId } as CanvasLink,
      ];
      setLinks(nextLinks);
      commitLinks(nextLinks);
    },
    [links, commitLinks]
  );

  const bringToFront = useCallback(
    (nodeId: string) => {
      const maxZ = Math.max(...nodes.map((n) => n.zIndex ?? 0));
      const next = nodes.map((n) => (n.nodeId === nodeId ? { ...n, zIndex: maxZ + 1 } : n));
      setNodes(next);
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const sendToBack = useCallback(
    (nodeId: string) => {
      const minZ = Math.min(...nodes.map((n) => n.zIndex ?? 0));
      const next = nodes.map((n) => (n.nodeId === nodeId ? { ...n, zIndex: minZ - 1 } : n));
      setNodes(next);
      commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const patchNode = useCallback(
    (nodeId: string, patch: Partial<CanvasNode>, commit: boolean) => {
      const next = nodes.map((n) => (n.nodeId === nodeId ? { ...n, ...patch } : n));
      setNodes(next);
      if (commit) commitNodes(next);
    },
    [nodes, commitNodes]
  );

  const resetView = useCallback(() => {
    const vp = options.defaultViewport ?? { x: 0, y: 0, scale: 1 };
    setViewport(vp);
    commitViewport(vp);
  }, [options.defaultViewport, commitViewport]);

  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) {
      resetView();
      return;
    }
    const padding = 80;

    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.w));
    const maxY = Math.max(...nodes.map((n) => n.y + n.h));

    const worldW = maxX - minX;
    const worldH = maxY - minY;

    const scaleX = (size.width - padding * 2) / worldW;
    const scaleY = (size.height - padding * 2) / worldH;
    const scale = Math.max(0.2, Math.min(4, Math.min(scaleX, scaleY)));

    const worldCx = minX + worldW / 2;
    const worldCy = minY + worldH / 2;

    const vp: Viewport = {
      scale,
      x: size.width / 2 - worldCx * scale,
      y: size.height / 2 - worldCy * scale,
    };

    setViewport(vp);
    commitViewport(vp);
  }, [nodes, size.width, size.height, commitViewport, resetView]);

  return useMemo(
    () => ({
      viewport,
      nodes,
      links,

      setViewportLive,
      commitViewport,

      addNode,
      addShape,
      addText,
      addNodeFromData,

      updateNodeLive,
      deleteNode,
      addLink,
      patchNode,
      bringToFront,
      sendToBack,

      resetView,
      zoomToFit,

      commitNodes,
      commitLinks,
    }),
    [
      viewport,
      nodes,
      links,
      setViewportLive,
      commitViewport,
      addNode,
      addShape,
      addText,
      addNodeFromData,
      updateNodeLive,
      deleteNode,
      addLink,
      patchNode,
      bringToFront,
      sendToBack,
      resetView,
      zoomToFit,
      commitNodes,
      commitLinks,
    ]
  );
}
