// utils/dataFrameToItems.ts
import { DataFrame } from '@grafana/data';

export interface DeviceItem {
  id: string;
  name?: string;
  value?: any;
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

    const rowCount = frame.length;

    for (let i = 0; i < rowCount; i++) {
      const idVal = frame.fields[idIdx].values.get(i);
      const id = String(idVal ?? '').trim();
      if (!id) continue;

      const nameVal = nameIdx >= 0 ? frame.fields[nameIdx].values.get(i) : undefined;
      const valueVal = valueIdx >= 0 ? frame.fields[valueIdx].values.get(i) : undefined;

      items.push({
        id,
        name: nameVal !== undefined ? String(nameVal) : undefined,
        value: coerceValue(valueVal),
      });
    }
  }

  const map: Record<string, DeviceItem> = {};
  for (const it of items) {
    map[it.id] = it;
  }
  return Object.values(map);
}
