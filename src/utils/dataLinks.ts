// utils/dataLinks.ts
import type { PanelData, Field, LinkModel, ScopedVars, InterpolateFunction } from '@grafana/data';

export function getDataLinksForId(
  data: PanelData,
  dataId: string,
  replaceVariables: InterpolateFunction
): Array<LinkModel<Field>> {
  for (const frame of data.series) {
    const idFieldIdx = frame.fields.findIndex((f) =>
      ['id', 'device_id', 'deviceid'].includes((f.name ?? '').toLowerCase())
    );
    if (idFieldIdx < 0) continue;

    let rowIndex = -1;
    for (let i = 0; i < frame.length; i++) {
      if (String(frame.fields[idFieldIdx].values.get(i)) === dataId) {
        rowIndex = i;
        break;
      }
    }
    if (rowIndex < 0) continue;

    const fieldValues: Record<string, any> = {};
    const scopedVars: ScopedVars = {};

    for (const f of frame.fields) {
      const v = f.values.get(rowIndex);
      fieldValues[f.name] = v;
      scopedVars[f.name] = { text: String(v ?? ''), value: v };
    }

    scopedVars['__data'] = {
      text: frame.refId || '',
      value: {
        name: frame.name || '',
        refId: frame.refId || '',
        fields: fieldValues,
      },
    };

    const result: Array<LinkModel<Field>> = [];
    const seen = new Set<string>();

    for (const field of frame.fields) {
      if (!field.config.links?.length) continue;
      for (const link of field.config.links) {
        const href = replaceVariables(link.url, scopedVars);
        if (seen.has(href)) continue;
        seen.add(href);

        result.push({
          href,
          title: link.title ? replaceVariables(link.title, scopedVars) : href,
          target: link.targetBlank ? '_blank' : '_self',
          origin: field,
        });
      }
    }

    if (result.length > 0) return result;
  }

  return [];
}
