import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Button, Dropdown, Input, Menu } from '@grafana/ui';
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
  dataSearch: css`
    padding: 6px 8px 4px;
  `,
  dataList: css`
    max-height: 260px;
    overflow-y: auto;
    & > div {
      width: 100%;
    }
    & ul {
      width: 100%;
    }
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

const DataDropdownContent: React.FC<{ items: DeviceItem[]; onSelect: (id: string) => void }> = ({
  items,
  onSelect,
}) => {
  const [filter, setFilter] = useState('');
  const q = filter.toLowerCase();
  const filtered = q
    ? items.filter((it) => it.id.toLowerCase().includes(q) || (it.name ?? '').toLowerCase().includes(q))
    : items;

  return (
    <div>
      <div className={styles.dataSearch} onPointerDown={(e) => e.stopPropagation()}>
        <Input
          placeholder="Search…"
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          autoFocus
        />
      </div>
      <div className={styles.dataList}>
        <Menu>
          {filtered.length > 0 ? (
            filtered.map((it) => (
              <Menu.Item
                key={it.id}
                label={it.name ? `${it.name}` : it.id}
                description={it.name ? `id: ${it.id}` : undefined}
                onClick={() => onSelect(it.id)}
              />
            ))
          ) : (
            <Menu.Item label="No match" disabled />
          )}
        </Menu>
      </div>
    </div>
  );
};

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

  const dataOverlay = hasItems ? (
    <DataDropdownContent items={dataItems} onSelect={onAddNodeFromData} />
  ) : (
    <Menu>
      <Menu.Item label="No data available" disabled />
    </Menu>
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
