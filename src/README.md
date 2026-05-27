# Saeme Canvas Panel

An interactive SVG canvas panel for Grafana that lets you build network topology maps, infrastructure diagrams, and system overviews directly inside your dashboards.

## Overview

Saeme Canvas Panel gives you a free-form canvas where you can place nodes representing devices or services, connect them with links, and have their visual state driven by live Grafana query data. Build anything from a simple server-room layout to a full network map with real-time status coloring.

## Features

### Canvas Elements

- **Network nodes** — Represent switches, routers, or generic equipment. Drag them freely on the canvas.
- **Shapes** — Rectangles and ellipses for creating background zones, grouping areas, or decorative regions. Fully configurable fill color, opacity, border radius, and stroke.
- **Text labels** — Freestanding text elements with configurable font size and color.

### Data Binding

Nodes can be bound to a Grafana query result via a **Data ID**. When bound, the node's label and fill color are driven by the live data:

- The fill color follows your panel's **threshold** and **color mapping** field configuration.
- Clicking a bound node can open configured **data links** (navigate to a dashboard, external URL, etc.).

### Interactions

- **Pan & zoom** — Navigate the canvas with mouse drag and scroll wheel.
- **Edit mode** — Add, move, resize, and delete elements. Draw links between nodes.
- **Resize handles** — Corner handles appear on selected nodes and shapes for precise resizing.
- **Z-ordering** — Bring any element to the front or send it to the back.
- **Node inspector** — Inspect and edit element properties (label, value, font size, colors) from the side panel.

### Panel Options

| Option | Description |
|--------|-------------|
| **Edit mode** | Enable the toolbar and drag handles for building/editing the canvas. |
| **Show grid** | Display a background alignment grid. |
| **Show mini HUD** | Show the viewport info overlay (position, scale, element count). |
| **Show view controls** | Show "Zoom to fit" and "Reset view" buttons. |
| **Show node inspector** | Show the inspector panel when clicking a node. Disable to use data links on click instead. |
| **Default viewport** | Set the X/Y position and scale the canvas resets to. |

## Data Format

Your query must expose the following fields (case-insensitive):

| Field | Accepted names |
|-------|---------------|
| **ID** | `id`, `device_id`, `deviceid` |
| **Name** | `name`, `device`, `hostname`, `label` |
| **Value** | `value`, `val`, `metric`, `state`, `status` |

The **ID** field is used to bind a node to a data row. The **value** field drives threshold-based color mapping.

## Getting Started

1. Add the panel to a dashboard and configure a data source query that returns device data.
2. Enable **Edit mode** in the panel options.
3. Use **Add node** to place a manual node, or **From data** to place a node bound to a specific device from your query.
4. Use **Add shape** to create background rectangles or ellipses for grouping your nodes.
5. Use **Add text** to add labels or titles to regions of your canvas.
6. Select a node and click **Link** to draw a connection to another node.
7. Disable **Edit mode** when your layout is ready for production use.

## Data Links

When **Show node inspector** is disabled, clicking a data-bound node triggers its configured data links:

- **One data link** → navigates directly (no popup).
- **Multiple data links** → opens a menu to choose which link to follow.

Data links are configured in the panel's **Field** tab under **Data links**, just like any other Grafana panel.
