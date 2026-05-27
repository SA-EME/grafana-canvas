// types.ts
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type NodeKind = 'switch' | 'router' | 'generic';
export type ElementKind = 'node' | 'shape' | 'text';
export type ShapeType = 'rect' | 'ellipse';

export interface CanvasNode {
  nodeId: string;
  elementKind?: ElementKind; // undefined = 'node' for backward compat
  dataId?: string;
  kind: NodeKind;

  x: number;
  y: number;
  w: number;
  h: number;
  zIndex?: number;

  // node fields
  label?: string;
  customValue?: string;

  // shape fields
  shapeType?: ShapeType;
  fillColor?: string;
  fillOpacity?: number;
  rx?: number;
  strokeColor?: string;
  strokeWidth?: number;

  // text fields
  content?: string;
  fontSize?: number;
  textColor?: string;
}

export interface CanvasLink {
  linkId: string;
  fromNodeId: string;
  toNodeId: string;
  dataId?: string;
}

export interface CanvasOptionsState {
  viewport: Viewport;
  nodes: CanvasNode[];
  links: CanvasLink[];
}

export interface SimpleOptions {
  editMode: boolean;
  showGrid: boolean;
  showMiniHud: boolean;
  showViewControls: boolean;
  showNodeInspector: boolean;
  defaultViewport: Viewport;
  canvas: CanvasOptionsState;
}
