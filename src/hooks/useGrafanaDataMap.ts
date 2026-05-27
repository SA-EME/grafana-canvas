
import { PanelData } from '@grafana/data';
import { useMemo } from 'react';
import { dataFrameToItems, DeviceItem } from '../utils/dataFrameToItems';

export type DeviceMap = Record<string, DeviceItem>;

export function useGrafanaDataMap(data: PanelData) {
  const items = useMemo(() => dataFrameToItems(data.series ?? []), [data.series]);

  const deviceMap = useMemo(() => {
    const map: DeviceMap = {};
    for (const it of items) {
      if (it.id) {
        map[it.id] = it;
      }
    }
    return map;
  }, [items]);

  return { items, deviceMap };
}
