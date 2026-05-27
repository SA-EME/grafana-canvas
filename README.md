# saeme-canvas-panel

A Grafana panel plugin that provides an interactive SVG canvas for building network topology maps, infrastructure diagrams, and system overviews with real-time data binding.

## Features

- **Free-form canvas** with pan & zoom navigation
- **Network nodes** (switch, router, generic) bound to Grafana query data
- **Shapes** (rectangle, ellipse) for backgrounds and grouping zones
- **Text labels** for annotations and titles
- **Links** (edges) between nodes drawn as SVG lines
- **Real-time color mapping** via Grafana thresholds and field config
- **Data links** — click a node to navigate to a configured URL or dashboard
- **Resize handles** on nodes and shapes
- **Z-ordering** — bring to front / send to back
- **Edit mode** with toolbar for building layouts interactively
- **Configurable default viewport** (position + scale)

## Requirements

- Grafana ≥ 12.3.0
- Node.js ≥ 20

## Development

### Install dependencies

```bash
npm install
```

### Start in watch mode

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Run with Grafana (Docker)

```bash
npm run server
```

This spins up a local Grafana instance with the plugin loaded at `http://localhost:3000`.

### Lint

```bash
npm run lint
npm run lint:fix
```

## Data Format

The panel reads Grafana DataFrames and maps rows to canvas nodes via a device ID. Your query must return a frame with the following fields (names are case-insensitive):

| Purpose | Accepted field names |
|---------|---------------------|
| **ID** (required) | `id`, `device_id`, `deviceid` |
| **Display name** | `name`, `device`, `hostname`, `label` |
| **Value** (for color) | `value`, `val`, `metric`, `state`, `status` |

The **value** field drives the node's fill color through Grafana's standard threshold and color mapping system configured in the panel's Field tab.

## Panel Options

| Option | Default | Description |
|--------|---------|-------------|
| `editMode` | `true` | Show toolbar and drag handles for editing |
| `showGrid` | `true` | Background alignment grid |
| `showMiniHud` | `true` | Viewport info overlay |
| `showViewControls` | `true` | Zoom to fit / Reset view buttons |
| `showNodeInspector` | `true` | Inspector panel on node click. Disable to use data links on click instead. |
| `defaultViewport` | `{x:0, y:0, scale:1}` | Viewport position and zoom level on load |

## Architecture

```
SimplePanel
└── CanvasPanel              Main logic, state wiring
    ├── useGrafanaDataMap    Grafana DataFrames → DeviceMap
    ├── useCanvasController  Canvas state + persistence (onOptionsChange)
    ├── CanvasStage          SVG root, pan/zoom pointer events
    │   ├── GridLayer        Background grid
    │   ├── LinkLayer        SVG lines between nodes
    │   └── NodeLayer        Nodes, shapes, and text elements (sorted by zIndex)
    │       └── NodeShape    Individual draggable/resizable element
    ├── Toolbar              Add node / shape / text, zoom controls
    ├── NodeInspector        Selected element properties editor
    ├── DataLinksMenu        Data link navigation popup
    └── MiniHud              Viewport info overlay
```

Canvas state (nodes, links, viewport) is persisted in Grafana panel options via `onOptionsChange`. Live updates (drag, resize) stay local for performance and are committed on pointer-up.

## Canvas Elements

### Nodes
Network device nodes with optional data binding. Bound nodes display a name from the data source and are colored according to the configured value thresholds.

**Stored fields:** `nodeId`, `kind`, `x`, `y`, `w`, `h`, `label?`, `dataId?`, `customValue?`, `fontSize?`, `zIndex?`

### Shapes
Decorative rectangles or ellipses for backgrounds and grouping. Added to the canvas behind nodes by default (negative `zIndex`).

**Stored fields:** `shapeType`, `fillColor`, `fillOpacity`, `strokeColor`, `strokeWidth`, `rx`, `w`, `h`, `zIndex`

### Text
Freestanding text labels. Added in front of nodes by default (positive `zIndex`).

**Stored fields:** `content`, `fontSize`, `textColor`, `zIndex`

## Distributing

Sign and publish your plugin following the [Grafana plugin publishing guide](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin).

```bash
# Bump version and push tag to trigger the release workflow
npm version patch
git push origin main --follow-tags
```

The included GitHub Actions workflow (`.github/workflows/release.yml`) handles signing and packaging automatically when a version tag is pushed. Add your `GRAFANA_API_KEY` secret in the repository settings before triggering a release.

## License

Apache 2.0
