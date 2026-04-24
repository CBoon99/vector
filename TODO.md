# Doppleit Vector — Actionable TODO

Focus: load image → snap to grid → pixel detection → auto-vectorise with per-pixel/group recolour → crop → multi-format export.

## Status snapshot

| Feature | State | Notes |
|---|---|---|
| Load image | Working | Drop-zone + file picker in `index.html` 48–71 route through `FileImportService` |
| Snap to grid | Stub | Checkbox exists (`index.html` 169) but no listener, no snap logic in tools |
| Pixel edit | Partial | `pixelEditService.js` paints one pixel at a time; no eyedropper, no select-by-colour, no brush size, edits don't merge on export |
| Auto-vectorise | Partial | `cellularVectorize.js` works (one rect per cell). Button `#vectorize` in `index.html` 263 is not wired. No recolour UI |
| Crop | Missing | No tool, no button, no service |
| Export | Mostly working | PNG/JPG/SVG/PDF/WebP OK. TIFF/BMP/AI/EPS/DXF stubbed |

---

## Priority 1 — wire what already exists (~half day)

- [ ] **Wire the Vectorize button.** `src/js/app.js` — add click listener for `#vectorize`, call `cellularVectorize` on the selected raster layer, push rects into `layerManager`.
- [ ] **Wire snap-to-grid.** Listener on `#snap-grid` writes to `stateManager`. Update `getCanvasPoint()` in `pen-tool.js:63`, `rectangle-tool.js:98`, `circle-tool.js`, `polygon-tool.js` to snap: `x = Math.round(x / grid) * grid`.
- [ ] **Draw the grid.** Add a grid render pass in `canvasManager.js` gated on the snap-to-grid flag.
- [ ] **Fix ErrorHandler typo.** `app.js:141` — `ErrorHandler.handleError` → `ErrorHandler.handle`. Export errors currently swallow silently.

## Priority 2 — pixel/cell recolour workflow (the core feature)

- [ ] **Recolour-cell tool.** Since cellular vectorise emits one rect per cell, recolour = click → hit-test object → set `obj.fill` → redraw. ~50 lines.
- [ ] **Select-by-colour.** Iterate `layerManager` objects, match `fill` within tolerance of clicked colour, multi-select. Enables group recolour in one click.
- [ ] **Eyedropper tool.** Sample pixel/cell under cursor, set active fill/stroke colour.
- [ ] **Brush-size support.** `pixelEditService.js:76` currently hardcodes 1×1 fillRect. Take a `size` param from the UI.
- [ ] **Flatten editCanvas on export.** Pixel edits live on a separate canvas that isn't merged — exports currently lose them.

## Priority 3 — crop

- [ ] **Build `src/js/tools/crop-tool.js`.** Drag to draw rect, handles to resize, Enter commits / Esc cancels.
- [ ] **Add crop button** to `index.html` toolbar and register in `app.js` tool switcher.
- [ ] **Commit behaviour.** Start with destructive: clip all objects to rect, resize artboard. Non-destructive clip-path can come later.

## Priority 4 — export formats

- [ ] **TIFF via `utif.js`.** `canvas.toBlob('image/tiff')` silently fails in most browsers. `exportService.js:249–257`.
- [ ] **BMP via manual encoder.** ~20 lines: pixel data → BMP header + DIB header + pixel array.
- [ ] **AI/EPS/DXF.** Currently headers-only. Low ROI — skip unless a user asks.

## Priority 5 — polish

- [ ] **Active-raster highlight** so users see which image the pixel/recolour tool will affect.
- [ ] **Undo/redo integration** for pixel paint and cell recolour. History manager exists, just needs hooks.
- [ ] **"Load + auto-vectorise" one-shot.** Wire `#import-cell-poster` checkbox so drop-image immediately produces the editable cell grid. This is the killer flow.

---

## Key files for this work

- `src/js/app.js` — main wiring, event handlers
- `src/js/services/cellularVectorize.js` — the vectoriser you'll build the recolour UI on top of
- `src/js/services/pixelEditService.js` — pixel paint (needs brush size, eyedropper, bucket)
- `src/js/services/exportService.js` — format encoders
- `src/js/core/canvasManager.js` — rendering, needs grid draw
- `src/js/core/layerManager.js` — object model, hit-testing lives here
- `index.html` — UI controls (many buttons exist without listeners)
