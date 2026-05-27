
import React, { useMemo, useRef } from 'react';
import { css, cx } from '@emotion/css';
import { Viewport } from '../types';

interface CanvasStageProps {
  width: number;
  height: number;
  viewport: Viewport;

  onViewportChange: (vp: Viewport) => void;
  onViewportCommit: (vp: Viewport) => void;

  enableZoom?: boolean;
  enablePan?: boolean;

  // ✅ NEW
  onBackgroundPointerDown?: () => void;

  children: React.ReactNode;
}

const styles = {
  svg: css`
    position: absolute;
    inset: 0;
    touch-action: none; /* important pour pointer events */
    user-select: none;
    cursor: grab;
  `,
  svgDragging: css`
    cursor: grabbing;
  `,
};

export const CanvasStage: React.FC<CanvasStageProps> = ({
  width,
  height,
  viewport,
  onViewportChange,
  onViewportCommit,
  enablePan = true,
  enableZoom = true,
  onBackgroundPointerDown, // ✅ NEW
  children,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const panRef = useRef({
    dragging: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  });

  const transform = useMemo(() => {
    return `translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`;
  }, [viewport]);

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!enableZoom) {
      return;
    }
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const oldScale = viewport.scale;
    const zoomIntensity = 0.0015;
    const delta = -e.deltaY;

    let newScale = oldScale * (1 + delta * zoomIntensity);
    newScale = Math.max(0.2, Math.min(4, newScale));

    const worldBefore = { x: (sx - viewport.x) / viewport.scale, y: (sy - viewport.y) / viewport.scale };

    const newVp: Viewport = { ...viewport, scale: newScale };
    const screenAfter = { x: worldBefore.x * newVp.scale + newVp.x, y: worldBefore.y * newVp.scale + newVp.y };

    newVp.x += sx - screenAfter.x;
    newVp.y += sy - screenAfter.y;

    onViewportChange(newVp);
    onViewportCommit(newVp);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // ✅ NEW: si clic fond, on désélectionne côté parent
    onBackgroundPointerDown?.();

    if (!enablePan) {
      return;
    }
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);

    panRef.current.dragging = true;
    panRef.current.startClientX = e.clientX;
    panRef.current.startClientY = e.clientY;
    panRef.current.startX = viewport.x;
    panRef.current.startY = viewport.y;
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enablePan || !panRef.current.dragging) {
      return;
    }
    const dx = e.clientX - panRef.current.startClientX;
    const dy = e.clientY - panRef.current.startClientY;

    const newVp = { ...viewport, x: panRef.current.startX + dx, y: panRef.current.startY + dy };
    onViewportChange(newVp);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!enablePan) {
      return;
    }
    if (panRef.current.dragging) {
      panRef.current.dragging = false;
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
      onViewportCommit(viewport);
    }
  };

  return (
    <svg
      ref={svgRef}
      className={cx(styles.svg, panRef.current.dragging && styles.svgDragging)}
      width={width}
      height={height}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <g transform={transform}>{children}</g>
    </svg>
  );
};