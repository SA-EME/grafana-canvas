import React from 'react';
import { css } from '@emotion/css';
import { Button, Dropdown, Menu } from '@grafana/ui';
import type { DeviceItem } from '../../utils/dataFrameToItems';
import type { ShapeType } from '../../types';

const styles = {
  toolbar: css`
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    pointer-events: auto;
  `,
};

interface Props {
  editMode: boolean;
  showViewControls: boolean;
  onAddNode: () => void;
  onAddNodeFromData: (dataId: string) => void;
  onAddShape: (type: ShapeType) => void;
  onAddText: () => void;
  dataItems: DeviceItem[];
  onResetView: () => void;
  onZoomToFit?: () => void;
}

export const Toolbar: React.FC<Props> = ({
  editMode,
  showViewControls,
  onAddNode,
  onAddNodeFromData,
  onAddShape,
  onAddText,
  dataItems,
  onResetView,
  onZoomToFit,
}) => {
  const hasItems = dataItems && dataItems.length > 0;

  const dataOverlay = (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      <Menu>
        {hasItems ? (
          dataItems.map((it) => (
            <Menu.Item
              key={it.id}
              label={it.name ? `${it.name}` : it.id}
              description={it.name ? `id: ${it.id}` : undefined}
              onClick={() => onAddNodeFromData(it.id)}
            />
          ))
        ) : (
          <Menu.Item label="No data available" disabled />
        )}
      </Menu>
    </div>
  );

  const shapeOverlay = (
    <Menu>
      <Menu.Item label="Rectangle" onClick={() => onAddShape('rect')} />
      <Menu.Item label="Ellipse" onClick={() => onAddShape('ellipse')} />
    </Menu>
  );

  return (
    <div className={styles.toolbar}>
      {editMode && (
        <>
          <Button size="sm" onClick={onAddNode}>
            Add node
          </Button>

          <Dropdown overlay={dataOverlay} placement="bottom-start">
            <Button size="sm" variant="secondary" disabled={!hasItems}>
              From data
            </Button>
          </Dropdown>

          <Dropdown overlay={shapeOverlay} placement="bottom-start">
            <Button size="sm" variant="secondary">
              Add shape
            </Button>
          </Dropdown>

          <Button size="sm" variant="secondary" onClick={onAddText}>
            Add text
          </Button>
        </>
      )}

      {showViewControls && (
        <>
          {onZoomToFit && (
            <Button size="sm" variant="secondary" onClick={onZoomToFit}>
              Zoom to fit
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={onResetView}>
            Reset view
          </Button>
        </>
      )}
    </div>
  );
};
