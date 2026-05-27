// utils/colors.ts
import { FieldType, getDisplayProcessor } from '@grafana/data';
import type { GrafanaTheme2, FieldConfig } from '@grafana/data';

export function getDisplayForValue(theme: GrafanaTheme2, config: FieldConfig, value: any) {
  const type =
    typeof value === 'number'
      ? FieldType.number
      : typeof value === 'boolean'
      ? FieldType.boolean
      : FieldType.string;

  // Field minimal pour que Grafana applique mappings/thresholds
  const field: any = {
    name: 'value',
    type,
    config: config ?? {},
  };

  const processor = getDisplayProcessor({ field, theme });
  return processor(value);
}

export function getNodeFillColor(theme: GrafanaTheme2, config: FieldConfig, value: any): string {
  const disp = getDisplayForValue(theme, config, value);

  // disp.color peut être une string ou un objet selon versions => on sécurise
  const c: any = disp.color;
  if (typeof c === 'string') return c;
  if (c?.toString) return c.toString();

  // fallback
  return theme.colors.text.secondary;
}