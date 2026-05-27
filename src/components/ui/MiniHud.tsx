// components/ui/MiniHud.tsx
import React from 'react';
import { css } from '@emotion/css';
import { Viewport } from '../../types';

const styles = {
  hud: css`
    position: absolute;
    left: 8px;
    bottom: 8px;
    z-index: 10;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
  `,
};

interface Props {
  viewport: Viewport;
  nodesCount: number;
  availableItemsCount: number;
}

export const MiniHud: React.FC<Props> = ({ viewport, nodesCount, availableItemsCount }) => {
  return (
    <div className={styles.hud}>
      <div>
        View x={Math.round(viewport.x)} y={Math.round(viewport.y)} scale={viewport.scale.toFixed(2)}
      </div>
      <div>Nodes: {nodesCount}</div>
      <div>Data items: {availableItemsCount}</div>
    </div>
  );
};