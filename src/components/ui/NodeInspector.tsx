// components/ui/NodeInspector.tsx
import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { Button, Badge, Input, Field, Switch, Icon } from '@grafana/ui';
import type { CanvasNode } from '../../types';
import type { DeviceItem, DeviceExtraField } from '../../utils/dataFrameToItems';
import { coerceValue } from '../../utils/dataFrameToItems';
import type { FieldConfig, GrafanaTheme2, LinkModel, Field as DataField } from '@grafana/data';
import { getDisplayForValue } from '../../utils/colors';

const styles = {
  panel: css`
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 12;
    width: 280px;
    border-radius: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.45);
    color: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(6px);
    pointer-events: auto;
  `,
  title: css`
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  `,
  row: css`
    font-size: 12px;
    margin: 6px 0;
    opacity: 0.95;
  `,
  actions: css`
    display: flex;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: wrap;
  `,
  fields: css`
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  colorRow: css`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 600;
    opacity: 0.9;
    cursor: pointer;
    user-select: none;
    margin: 12px 0 6px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    &:hover {
      opacity: 1;
    }
  `,
  sectionHeaderFirst: css`
    border-top: none;
    padding-top: 0;
    margin-top: 8px;
  `,
  extraRow: css`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    margin: 3px 0;
    opacity: 0.95;
  `,
  extraKey: css`
    font-size: 13px;
    opacity: 0.7;
    flex-shrink: 0;
  `,
  extraVal: css`
    font-size: 13px;
    text-align: right;
    word-break: break-all;
  `,
  linkItem: css`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 0;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    text-decoration: none;
    opacity: 0.9;
    &:hover {
      opacity: 1;
      text-decoration: underline;
    }
  `,
  colorLabel: css`
    font-size: 12px;
    opacity: 0.8;
    min-width: 80px;
  `,
  colorInput: css`
    width: 36px;
    height: 28px;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 2px;
    background: transparent;
  `,
};

interface Props {
  editMode: boolean;
  selectedNode?: CanvasNode;
  selectedItem?: DeviceItem;
  linkFromNodeId: string | null;
  dataLinks: Array<LinkModel<DataField>>;
  showCanvasSection: boolean;
  onDelete: () => void;
  onStartLink: () => void;
  onCancelLink: () => void;
  onNodePatch: (patch: Partial<CanvasNode>, commit: boolean) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  fieldConfigDefaults: FieldConfig;
  theme: GrafanaTheme2;
}

export const NodeInspector: React.FC<Props> = ({
  editMode,
  selectedNode,
  selectedItem,
  linkFromNodeId,
  dataLinks,
  showCanvasSection,
  onDelete,
  onStartLink,
  onCancelLink,
  onNodePatch,
  onBringToFront,
  onSendToBack,
  fieldConfigDefaults,
  theme,
}) => {
  if (!selectedNode) {
    return null;
  }

  const elementKind = selectedNode.elementKind ?? 'node';
  const isLinking = editMode && linkFromNodeId === selectedNode.nodeId;

  // ── Shape inspector ───────────────────────────────────────────────────────
  if (elementKind === 'shape') {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>
          <span>Selected shape</span>
        </div>

        <div className={styles.row}>
          <b>pos:</b> x={Math.round(selectedNode.x)} y={Math.round(selectedNode.y)}
        </div>
        <div className={styles.row}>
          <b>size:</b> {Math.round(selectedNode.w)}×{Math.round(selectedNode.h)}
        </div>

        {editMode && (
          <div className={styles.fields}>
            <div className={styles.colorRow}>
              <span className={styles.colorLabel}>Fill color</span>
              <input
                type="color"
                className={styles.colorInput}
                value={selectedNode.fillColor ?? '#5555aa'}
                onChange={(e) => onNodePatch({ fillColor: e.target.value }, false)}
                onBlur={(e) => onNodePatch({ fillColor: e.target.value }, true)}
              />
            </div>

            <Field label="Opacity (0–100)">
              <Input
                type="number"
                min={0}
                max={100}
                value={Math.round((selectedNode.fillOpacity ?? 0.25) * 100)}
                onChange={(e) =>
                  onNodePatch({ fillOpacity: Number(e.currentTarget.value) / 100 }, false)
                }
                onBlur={(e) =>
                  onNodePatch({ fillOpacity: Number(e.currentTarget.value) / 100 }, true)
                }
              />
            </Field>

            {selectedNode.shapeType !== 'ellipse' && (
              <Field label="Border radius">
                <Input
                  type="number"
                  min={0}
                  value={selectedNode.rx ?? 8}
                  onChange={(e) => onNodePatch({ rx: Number(e.currentTarget.value) }, false)}
                  onBlur={(e) => onNodePatch({ rx: Number(e.currentTarget.value) }, true)}
                />
              </Field>
            )}

            <div className={styles.colorRow}>
              <span className={styles.colorLabel}>Stroke color</span>
              <input
                type="color"
                className={styles.colorInput}
                value={selectedNode.strokeColor ?? '#888888'}
                onChange={(e) => onNodePatch({ strokeColor: e.target.value }, false)}
                onBlur={(e) => onNodePatch({ strokeColor: e.target.value }, true)}
              />
            </div>

            <Field label="Stroke width">
              <Input
                type="number"
                min={0}
                value={selectedNode.strokeWidth ?? 1}
                onChange={(e) => onNodePatch({ strokeWidth: Number(e.currentTarget.value) }, false)}
                onBlur={(e) => onNodePatch({ strokeWidth: Number(e.currentTarget.value) }, true)}
              />
            </Field>

            <Field label="Width">
              <Input
                type="number"
                min={1}
                value={Math.round(selectedNode.w)}
                onChange={(e) => onNodePatch({ w: Number(e.currentTarget.value) }, false)}
                onBlur={(e) => onNodePatch({ w: Number(e.currentTarget.value) }, true)}
              />
            </Field>

            <Field label="Height">
              <Input
                type="number"
                min={1}
                value={Math.round(selectedNode.h)}
                onChange={(e) => onNodePatch({ h: Number(e.currentTarget.value) }, false)}
                onBlur={(e) => onNodePatch({ h: Number(e.currentTarget.value) }, true)}
              />
            </Field>

            <div className={styles.actions}>
              <Button size="sm" variant="secondary" onClick={onBringToFront}>
                Bring to front
              </Button>
              <Button size="sm" variant="secondary" onClick={onSendToBack}>
                Send to back
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Text inspector ────────────────────────────────────────────────────────
  if (elementKind === 'text') {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>
          <span>Selected text</span>
        </div>

        <div className={styles.row}>
          <b>pos:</b> x={Math.round(selectedNode.x)} y={Math.round(selectedNode.y)}
        </div>

        {editMode && (
          <div className={styles.fields}>
            <Field label="Content">
              <Input
                value={selectedNode.content ?? ''}
                onChange={(e) => onNodePatch({ content: e.currentTarget.value }, false)}
                onBlur={(e) => onNodePatch({ content: e.currentTarget.value }, true)}
                placeholder="Text content"
              />
            </Field>

            <Field label="Font size">
              <Input
                type="number"
                min={6}
                max={256}
                value={selectedNode.fontSize ?? 18}
                onChange={(e) => onNodePatch({ fontSize: Math.min(256, Math.max(6, Number(e.currentTarget.value))) }, false)}
                onBlur={(e) => onNodePatch({ fontSize: Math.min(256, Math.max(6, Number(e.currentTarget.value))) }, true)}
              />
            </Field>

            <div className={styles.colorRow}>
              <span className={styles.colorLabel}>Text color</span>
              <input
                type="color"
                className={styles.colorInput}
                value={selectedNode.textColor ?? '#ffffff'}
                onChange={(e) => onNodePatch({ textColor: e.target.value }, false)}
                onBlur={(e) => onNodePatch({ textColor: e.target.value }, true)}
              />
            </div>

            <Field label="Background">
              <Switch
                value={selectedNode.showBackground !== false}
                onChange={(e) => onNodePatch({ showBackground: e.currentTarget.checked }, true)}
              />
            </Field>

            <div className={styles.actions}>
              <Button size="sm" variant="secondary" onClick={onBringToFront}>
                Bring to front
              </Button>
              <Button size="sm" variant="secondary" onClick={onSendToBack}>
                Send to back
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}

        {!editMode && (
          <div className={styles.row} style={{ marginTop: 10, opacity: 0.85 }}>
            (View mode) Click to inspect.
          </div>
        )}
      </div>
    );
  }

  // ── Node inspector (default) ──────────────────────────────────────────────
  const isManual = !selectedNode.dataId;

  const effectiveValue =
    selectedItem?.value !== undefined
      ? selectedItem.value
      : selectedNode.customValue !== undefined
      ? coerceValue(selectedNode.customValue)
      : undefined;

  const disp = getDisplayForValue(theme, fieldConfigDefaults, effectiveValue);
  const valueText = disp.text ?? (effectiveValue === undefined ? '(none)' : String(effectiveValue));

  const extraEntries = Object.entries(selectedItem?.extraFields ?? {}) as Array<[string, DeviceExtraField]>;

  // Canvas section collapsed by default in view mode, expanded in edit mode
  const [canvasOpen, setCanvasOpen] = useState(editMode);

  return (
    <div className={styles.panel}>
      <div className={styles.title}>
        <span>Selected node</span>
        <Badge text={valueText} color="blue" />
      </div>

      {/* ── Links section ── */}
      {dataLinks.length > 0 && (
        <>
          <div className={cx(styles.sectionHeader, styles.sectionHeaderFirst)}>
            Links
          </div>
          {dataLinks.map((link, i) => (
            <a
              key={i}
              className={styles.linkItem}
              href={link.href}
              target={link.target}
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                if (link.target === '_blank') {
                  window.open(link.href, '_blank');
                } else {
                  window.location.href = link.href;
                }
              }}
            >
              <Icon name="external-link-alt" size="xs" />
              {link.title || link.href}
            </a>
          ))}
        </>
      )}

      {/* ── Datasource section ── */}
      {extraEntries.length > 0 && (
        <>
          <div className={cx(styles.sectionHeader, dataLinks.length === 0 && styles.sectionHeaderFirst)}>
            <Icon name="database" size="xs" />
            Datasource
          </div>
          {extraEntries.map(([k, f]) => (
            <div key={k} className={styles.extraRow}>
              <span className={styles.extraKey}>{k}</span>
              <span className={styles.extraVal} style={f.color ? { color: f.color } : undefined}>
                {String(f.value)}
              </span>
            </div>
          ))}
        </>
      )}

      {/* ── Canvas section ── */}
      {showCanvasSection && (
        <>
          <div className={styles.sectionHeader} onClick={() => setCanvasOpen((o) => !o)}>
            <Icon name={canvasOpen ? 'angle-down' : 'angle-right'} size="xs" />
            Canvas
          </div>
          {canvasOpen && (
            <>
              <div className={styles.row}>
                <b>value:</b> {effectiveValue === undefined ? '(none)' : String(effectiveValue)}
              </div>
              <div className={styles.row}>
                <b>nodeId:</b> {selectedNode.nodeId}
              </div>
              <div className={styles.row}>
                <b>dataId:</b> {selectedNode.dataId ?? '(none)'}
              </div>
              <div className={styles.row}>
                <b>name:</b> {selectedItem?.name ?? selectedNode.label ?? '(none)'}
              </div>
              <div className={styles.row}>
                <b>pos:</b> x={Math.round(selectedNode.x)} y={Math.round(selectedNode.y)}
              </div>
              <div className={styles.row}>
                <b>size:</b> {selectedNode.w}×{selectedNode.h}
              </div>
            </>
          )}
        </>
      )}

      {editMode && (
        <div className={styles.fields}>
          {isManual && (
            <>
              <Field label="Label">
                <Input
                  value={selectedNode.label ?? ''}
                  onChange={(e) => onNodePatch({ label: e.currentTarget.value }, false)}
                  onBlur={(e) => onNodePatch({ label: e.currentTarget.value }, true)}
                  placeholder="Node label"
                />
              </Field>
              <Field label="Value">
                <Input
                  value={selectedNode.customValue ?? ''}
                  onChange={(e) => onNodePatch({ customValue: e.currentTarget.value }, false)}
                  onBlur={(e) => onNodePatch({ customValue: e.currentTarget.value }, true)}
                  placeholder="e.g. 42 or OK"
                />
              </Field>
            </>
          )}
          <Field label="Font size">
            <Input
              type="number"
              min={6}
              max={256}
              value={selectedNode.fontSize ?? 14}
              onChange={(e) => onNodePatch({ fontSize: Math.min(256, Math.max(6, Number(e.currentTarget.value))) }, false)}
              onBlur={(e) => onNodePatch({ fontSize: Math.min(256, Math.max(6, Number(e.currentTarget.value))) }, true)}
            />
          </Field>
        </div>
      )}

      {editMode && (
        <div className={styles.actions}>
          {!isLinking ? (
            <Button size="sm" variant="secondary" onClick={onStartLink}>
              Link
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={onCancelLink}>
              Cancel link
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={onBringToFront}>
            Bring to front
          </Button>
          <Button size="sm" variant="secondary" onClick={onSendToBack}>
            Send to back
          </Button>

          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      )}

      {!editMode && (
        <div className={styles.row} style={{ marginTop: 10, opacity: 0.85 }}>
          (View mode) Click nodes to inspect.
        </div>
      )}

      {isLinking && (
        <div className={styles.row} style={{ marginTop: 10, opacity: 0.9 }}>
          Click another node to create a link.
        </div>
      )}
    </div>
  );
};
