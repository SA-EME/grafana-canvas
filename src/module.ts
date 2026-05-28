import { PanelPlugin, FieldConfigProperty } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel)
  .setDefaults({
    editMode: true,
    showGrid: true,
    showMiniHud: true,
    showViewControls: true,
    showNodeInspector: true,
    showCanvasSection: true,
    defaultViewport: { x: 0, y: 0, scale: 1 },
    canvas: {
      viewport: { x: 0, y: 0, scale: 1 },
      nodes: [],
      links: [],
    },
  })
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Mappings]: {},
      [FieldConfigProperty.Thresholds]: {},
      [FieldConfigProperty.Color]: {},
      [FieldConfigProperty.Links]: {},
    },
  })
  .setPanelOptions((builder) => {
    return builder
      .addBooleanSwitch({
        path: 'editMode',
        name: 'Edit mode',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showGrid',
        name: 'Show grid',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showMiniHud',
        name: 'Show mini HUD',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showViewControls',
        name: 'Show view controls',
        description: 'Show Reset view and Zoom to fit buttons',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showNodeInspector',
        name: 'Show node inspector',
        description: 'Show the inspector panel on node click. Disable to use data links instead.',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'showCanvasSection',
        name: 'Show canvas section in inspector',
        description: 'Show nodeId, dataId, position and size in the node inspector.',
        defaultValue: true,
        showIf: (opts) => opts.showNodeInspector,
      })
      .addNumberInput({
        path: 'defaultViewport.x',
        name: 'Default viewport X',
        defaultValue: 0,
      })
      .addNumberInput({
        path: 'defaultViewport.y',
        name: 'Default viewport Y',
        defaultValue: 0,
      })
      .addSliderInput({
        path: 'defaultViewport.scale',
        name: 'Default viewport scale',
        defaultValue: 1,
        settings: { min: 0.1, max: 4, step: 0.05 },
      });
  });