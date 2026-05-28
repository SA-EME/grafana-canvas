// components/nodes/NodeShape.tsx
import React, { useLayoutEffect, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { CanvasNode } from '../../types';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface ResizePatch {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  node: CanvasNode;
  label: string;
  fill: string;
  theme: GrafanaTheme2;
  viewportScale: number;
  editMode: boolean;
  selected: boolean;
  linkOrigin: boolean;
  onClick: (clientX: number, clientY: number) => void;
  onDrag: (x: number, y: number, commit: boolean) => void;
  onResize: (patch: ResizePatch, commit: boolean) => void;
}

const MIN_SIZE = 20;

export const NodeShape: React.FC<Props> = ({
  node,
  label,
  fill,
  theme,
  viewportScale,
  editMode,
  selected,
  linkOrigin,
  onClick,
  onDrag,
  onResize,
}) => {
  const textRef = useRef<SVGTextElement>(null);

  // Measure rendered text dimensions and sync node.w/h so the selection box stays accurate.
  // Runs only when content or fontSize changes to avoid update loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (node.elementKind !== 'text' || !textRef.current) {
      return;
    }
    try {
      const bbox = textRef.current.getBBox();
      if (bbox.width < 1) {
        return;
      }
      const newW = Math.ceil(bbox.width) + 8;
      const newH = Math.ceil(bbox.height) + 8;
      if (Math.abs(newW - node.w) > 1 || Math.abs(newH - node.h) > 1) {
        onResize({ x: node.x, y: node.y, w: newW, h: newH }, true);
      }
    } catch (_) {
      // getBBox throws when element is not attached to the DOM
    }
  }, [node.content, node.fontSize]);

  const dragRef = useRef({
    dragging: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  });

  const resizeRef = useRef({
    active: false,
    handle: 'se' as ResizeHandle,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  // ── Main drag (move) ────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<SVGGElement>) => {
    e.stopPropagation();
    onClick(e.clientX, e.clientY);

    if (!editMode) return;

    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      dragging: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: node.x,
      startY: node.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!editMode || !dragRef.current.dragging) return;
    e.stopPropagation();

    const dx = (e.clientX - dragRef.current.startClientX) / viewportScale;
    const dy = (e.clientY - dragRef.current.startClientY) / viewportScale;
    onDrag(dragRef.current.startX + dx, dragRef.current.startY + dy, false);
  };

  const onPointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (!editMode || !dragRef.current.dragging) return;
    e.stopPropagation();

    dragRef.current.dragging = false;
    (e.currentTarget as any).releasePointerCapture?.(e.pointerId);

    const dx = (e.clientX - dragRef.current.startClientX) / viewportScale;
    const dy = (e.clientY - dragRef.current.startClientY) / viewportScale;
    onDrag(dragRef.current.startX + dx, dragRef.current.startY + dy, true);
  };

  // ── Resize handles ──────────────────────────────────────────────────────
  const computeResize = (handle: ResizeHandle, dx: number, dy: number): ResizePatch => {
    const { startX, startY, startW, startH } = resizeRef.current;

    let x = startX, y = startY, w = startW, h = startH;

    if (handle === 'se') {
      w = Math.max(MIN_SIZE, startW + dx);
      h = Math.max(MIN_SIZE, startH + dy);
    } else if (handle === 'sw') {
      w = Math.max(MIN_SIZE, startW - dx);
      x = startX + (startW - w);
      h = Math.max(MIN_SIZE, startH + dy);
    } else if (handle === 'ne') {
      w = Math.max(MIN_SIZE, startW + dx);
      h = Math.max(MIN_SIZE, startH - dy);
      y = startY + (startH - h);
    } else {
      // nw
      w = Math.max(MIN_SIZE, startW - dx);
      x = startX + (startW - w);
      h = Math.max(MIN_SIZE, startH - dy);
      y = startY + (startH - h);
    }

    return { x, y, w, h };
  };

  const onHandlePointerDown = (e: React.PointerEvent<SVGRectElement>, handle: ResizeHandle) => {
    e.stopPropagation();
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);

    resizeRef.current = {
      active: true,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: node.x,
      startY: node.y,
      startW: node.w,
      startH: node.h,
    };
  };

  const onHandlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!resizeRef.current.active) return;
    e.stopPropagation();

    const dx = (e.clientX - resizeRef.current.startClientX) / viewportScale;
    const dy = (e.clientY - resizeRef.current.startClientY) / viewportScale;
    onResize(computeResize(resizeRef.current.handle, dx, dy), false);
  };

  const onHandlePointerUp = (e: React.PointerEvent<SVGRectElement>) => {
    if (!resizeRef.current.active) return;
    e.stopPropagation();

    resizeRef.current.active = false;
    (e.currentTarget as any).releasePointerCapture?.(e.pointerId);

    const dx = (e.clientX - resizeRef.current.startClientX) / viewportScale;
    const dy = (e.clientY - resizeRef.current.startClientY) / viewportScale;
    onResize(computeResize(resizeRef.current.handle, dx, dy), true);
  };

  const elementKind = node.elementKind ?? 'node';

  // Resize handles rendered for nodes and shapes when selected in edit mode
  const showHandles = editMode && selected && elementKind !== 'text';
  const hs = Math.max(6, 8 / viewportScale); // handle screen size stays ~8px
  const half = hs / 2;
  const sw = 1.5 / viewportScale;

  const resizeHandles = showHandles && (
    <>
      {(
        [
          { type: 'nw' as ResizeHandle, cx: node.x, cy: node.y, cursor: 'nw-resize' },
          { type: 'ne' as ResizeHandle, cx: node.x + node.w, cy: node.y, cursor: 'ne-resize' },
          { type: 'sw' as ResizeHandle, cx: node.x, cy: node.y + node.h, cursor: 'sw-resize' },
          { type: 'se' as ResizeHandle, cx: node.x + node.w, cy: node.y + node.h, cursor: 'se-resize' },
        ] as Array<{ type: ResizeHandle; cx: number; cy: number; cursor: string }>
      ).map((h) => (
        <rect
          key={h.type}
          x={h.cx - half}
          y={h.cy - half}
          width={hs}
          height={hs}
          rx={2 / viewportScale}
          fill={theme.colors.primary.main}
          stroke="white"
          strokeWidth={sw}
          style={{ cursor: h.cursor }}
          onPointerDown={(e) => onHandlePointerDown(e, h.type)}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        />
      ))}
    </>
  );

  // ── Shape (rect or ellipse) ──────────────────────────────────────────────
  if (elementKind === 'shape') {
    const selectionBox = selected && (
      <rect
        x={node.x - 3}
        y={node.y - 3}
        width={node.w + 6}
        height={node.h + 6}
        fill="none"
        stroke={theme.colors.primary.main}
        strokeWidth={2}
        strokeDasharray="5 3"
        style={{ pointerEvents: 'none' }}
      />
    );

    const shapeProps = {
      fill,
      fillOpacity: node.fillOpacity ?? 0.25,
      stroke: node.strokeColor ?? 'rgba(255,255,255,0.15)',
      strokeWidth: node.strokeWidth ?? 1,
    };

    return (
      <g onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        {node.shapeType === 'ellipse' ? (
          <ellipse
            cx={node.x + node.w / 2}
            cy={node.y + node.h / 2}
            rx={node.w / 2}
            ry={node.h / 2}
            {...shapeProps}
          />
        ) : (
          <rect
            x={node.x}
            y={node.y}
            width={node.w}
            height={node.h}
            rx={node.rx ?? 8}
            ry={node.rx ?? 8}
            {...shapeProps}
          />
        )}
        {selectionBox}
        {resizeHandles}
      </g>
    );
  }

  // ── Text ─────────────────────────────────────────────────────────────────
  if (elementKind === 'text') {
    return (
      <g onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        {editMode && (
          <rect
            x={node.x}
            y={node.y}
            width={node.w}
            height={node.h}
            fill="transparent"
            stroke={selected ? theme.colors.primary.main : 'rgba(255,255,255,0.1)'}
            strokeWidth={selected ? 2 : 1}
            strokeDasharray={selected ? '5 3' : '3 3'}
          />
        )}
        <text
          ref={textRef}
          x={node.x}
          y={node.y + (node.fontSize ?? 16)}
          fill={node.textColor ?? '#ffffff'}
          fontSize={node.fontSize ?? 16}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={Math.max(2, (node.fontSize ?? 16) * 0.15)}
          paintOrder="stroke fill"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.content ?? ''}
        </text>
      </g>
    );
  }

  // ── Node (default) ───────────────────────────────────────────────────────
  const stroke = linkOrigin
    ? theme.colors.warning.main
    : selected
    ? theme.colors.primary.main
    : 'rgba(255,255,255,0.15)';

  const strokeWidth = linkOrigin ? 4 : selected ? 3 : 2;

  return (
    <g onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={12}
        ry={12}
        fill={fill}
        opacity={0.92}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={node.x + 12}
        y={node.y + node.h / 2 + 5}
        fill={theme.colors.text.primary}
        fontSize={node.fontSize ?? 14}
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
      {resizeHandles}
    </g>
  );
};
