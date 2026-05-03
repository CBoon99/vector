# Doppleit Vector - MVP Ready ✅

## Core Functionality (v1 - Ready Now)

### 1. Upload Image
- ✅ Drag & drop any image format
- ✅ PNG, JPG, GIF, WebP supported
- ✅ Image appears immediately on canvas

### 2. Pick Colors
- ✅ **Eyedropper Tool** - Click to pick colors from images
- ✅ HEX color input
- ✅ RGB color input  
- ✅ HSL color input
- ✅ System color picker
- ✅ Color wheel
- ✅ Opacity slider

### 3. Edit with Pixel Tool
**Workflow:**
1. Click **Eyedropper** button
2. Click on image to pick a color (auto-switches to Pixel tool)
3. Use **Pixel** tool to paint individual pixels
4. Selected color updates in color picker

### 4. Export in Any Format
- ✅ **PNG** - With transparency option
  - Check "Transparent PNG" for no background
  - Uncheck to add background (white, black, gray options)
- ✅ **JPEG** - Always white background
- ✅ **SVG** - With transparency option
  - Check "Transparent SVG" for transparent background
  - Uncheck for white background
- ✅ **PDF** - Full content rendering

---

## v2 Features (Coming Soon - Greyed Out)

The following features are marked as v2 and disabled:
- Pen tool (vector drawing)
- Rectangle tool
- Circle tool  
- Text tool
- Bezier tool
- Gradient tool
- Vectorize button

These will be enabled in Phase 2 after core image editing is polished.

---

## How to Use

### Basic Workflow

**1. Upload & View**
```
Drag image onto canvas → Image appears
```

**2. Pick Color from Image**
```
Click "Eyedropper" → Click on image → Color picked
```

**3. Paint Pixels**
```
Use "Pixel" tool → Click to paint → Image edits
```

**4. Export**
```
Choose format (PNG/JPG/SVG/PDF) → Configure options → Export
```

### Detailed Steps

#### Uploading an Image
1. Drag a PNG/JPG onto the upload area, OR
2. Click "Browse files" and select an image
3. Image appears on canvas within 1-2 seconds
4. Success message shows "Added to canvas"

#### Picking a Color
1. Click the **Eyedropper** button
2. Click anywhere on the image you want to sample
3. Eyedropper auto-switches to Pixel tool
4. Message shows picked color
5. Ready to paint!

#### Painting Pixels
1. Select **Pixel** tool (or auto-selected after eyedropper)
2. Click on the image to paint individual pixels
3. Each click paints one pixel
4. Color comes from the color picker

#### Exporting

**PNG:**
- Check "Transparent PNG" for transparent background
- Uncheck and pick color for solid background
- Click "PNG" button

**JPG:**
- Automatically white background
- Click "JPG" button

**SVG:**
- Check "Transparent SVG" for transparent (best for web)
- Uncheck for white background
- Click "SVG" button  

**PDF:**
- Click "PDF" button
- Opens in reader/prints directly

---

## What Works ✅

- Image upload (all formats)
- Image display on canvas
- Color picker (all methods)
- Eyedropper (sample colors from images)
- Pixel tool (paint single pixels)
- PNG export with transparency options
- JPEG export
- SVG export with transparency options
- PDF export
- Zoom in/out
- Snap-to-grid toggle
- Canvas clearing

---

## Known Limitations (v1 MVP)

- Drawing tools (pen, shapes) are disabled - use v2
- Text tool disabled - use v2
- Layer system exists but limited controls
- Undo/Redo available for basic operations
- No filters or effects (v2+)
- No blend modes (v2+)

---

## Testing Checklist

### Image Upload
- [ ] Drag PNG onto canvas
- [ ] Drag JPG onto canvas
- [ ] Drag GIF onto canvas
- [ ] Image appears immediately

### Color Picking  
- [ ] Click Eyedropper
- [ ] Click red area of image
- [ ] Color picker updates to red
- [ ] Auto-switched to Pixel tool

### Pixel Editing
- [ ] Select Pixel tool
- [ ] Click pixels to paint
- [ ] Multiple clicks paint multiple pixels
- [ ] Color comes from picker

### PNG Export (Transparent)
- [ ] Check "Transparent PNG"
- [ ] Export PNG
- [ ] Open in editor/browser
- [ ] Background is transparent (shows checkerboard)

### PNG Export (With Background)
- [ ] Uncheck "Transparent PNG"
- [ ] Select background color (white/black/gray)
- [ ] Export PNG
- [ ] Open in editor/browser  
- [ ] Background is solid color

### SVG Export (Transparent)
- [ ] Check "Transparent SVG"
- [ ] Export SVG
- [ ] Open in browser
- [ ] Background is transparent

### SVG Export (White Background)
- [ ] Uncheck "Transparent SVG"
- [ ] Export SVG
- [ ] Open in browser
- [ ] Background is white

### PDF Export
- [ ] Export as PDF
- [ ] Open PDF in reader
- [ ] Image and edits visible

---

## Browser Compatibility

✅ Works in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Performance Notes

- Canvas rendering: Real-time
- Pixel painting: Single pixels at a time (no brush yet)
- Large images (4000x3000+) may be slower
- Export typically takes 1-5 seconds

---

## Next Steps (Phase 2 - v2)

When you're ready to unlock more features:

1. **Drawing Tools** - Pen, Rectangle, Circle, Text
2. **Advanced Edit** - Bezier, Gradient, Vectorize
3. **Layers** - Full layer management
4. **Effects** - Filters, blur, shadows
5. **Vector** - Path operations, boolean ops
6. **Collaboration** - Real-time editing
7. **Plugins** - Extensibility system

---

## Support

### If Image Doesn't Appear
1. Try refreshing the page
2. Check browser console (F12) for errors
3. Try smaller image (test with < 2MB)
4. Try different format (PNG first, then JPG)

### If Eyedropper Doesn't Work
1. Make sure image is on canvas first
2. Click eyedropper, then click the image
3. Check color picker updated

### If Export is Empty
1. Try PNG first (most reliable)
2. Check file size in download folder
3. Try PDF - provides best debug info
4. Refresh page and retry

---

## Version Info

**Current:** v1 MVP  
**Status:** Core image editing + export ready  
**Next:** v2 with drawing tools and advanced features

---

*Last Updated: 2026-04-24*
