# Wrap Studio 3D

A React, Tailwind CSS, and Three.js vehicle-wrap editor inspired by Tesla's public custom-wrap workflow. Choose a vehicle, layer local image files on a 2D print canvas, and see the composite update live on a rotatable 3D car. Export the finished 2048 × 1024 wrap template as a PNG.

All image processing happens in the browser. Uploaded files are represented with local object URLs and are never sent to a server. The car is built from optimized Three.js geometry, avoiding an unverified third-party model license or a fragile runtime download.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite in Chrome.

## Test

```bash
npm test
```

Run `npm run build` to create a production bundle.
