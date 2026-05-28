// utils/dataFrameToItems.ts
import { DataFrame } from '@grafana/data';

export interface DeviceExtraField {
  value: any;
  color?: string;
}

export interface DeviceItem {
  id: string;
  name?: string;
  value?: any;
  extraFields: Record<string, DeviceExtraField>;
}

function findFieldIndex(frame: DataFrame, candidates: string[]) {
  const lower = candidates.map((s) => s.toLowerCase());
  return frame.fields.findIndex((f) => lower.includes((f.name ?? '').toLowerCase()));
}

export function coerceValue(v: any): any {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    const n = Number(s);
    if (!Number.isNaN(n) && s !== '') return n;
    return s;
  }
  return v;
}

export function dataFrameToItems(frames: DataFrame[]): DeviceItem[] {
  const items: DeviceItem[] = [];

  for (const frame of frames) {
    const idIdx = findFieldIndex(frame, ['id', 'device_id', 'deviceid']);
    if (idIdx < 0) continue;

    const nameIdx = findFieldIndex(frame, ['name', 'device', 'hostname', 'label']);
    const valueIdx = findFieldIndex(frame, ['value', 'val', 'metric', 'state', 'status']);

    const reservedIdx = new Set([idIdx, nameIdx, valueIdx].filter((i) => i >= 0));

    const rowCount = frame.length;

    for (let i = 0; i < rowCount; i++) {
      const idVal = frame.fields[idIdx].values.get(i);
      const id = String(idVal ?? '').trim();
      if (!id) continue;

      const nameVal = nameIdx >= 0 ? frame.fields[nameIdx].values.get(i) : undefined;
      const valueVal = valueIdx >= 0 ? frame.fields[valueIdx].values.get(i) : undefined;

      const extraFields: Record<string, DeviceExtraField> = {};
      for (let fi = 0; fi < frame.fields.length; fi++) {
        if (reservedIdx.has(fi)) continue;
        const field = frame.fields[fi];
        const v = field.values.get(i);
        if (v !== null && v !== undefined) {
          // Only use the color when it was explicitly set via a 'fixed' override on this
          // field. Other modes (thresholds, palette…) are merged from panel defaults and
          // would incorrectly colorize unrelated fields via the global value mappings.
          const color =
            field.config?.color?.mode === 'fixed' ? field.config.color.fixedColor : undefined;
          extraFields[field.name] = { value: v, color };
        }
      }

      items.push({
        id,
        name: nameVal !== undefined ? String(nameVal) : undefined,
        value: coerceValue(valueVal),
        extraFields,
      });
    }
  }

  const map: Record<string, DeviceItem> = {};
  for (const it of items) {
    map[it.id] = it;
  }
  return Object.values(map);
}
