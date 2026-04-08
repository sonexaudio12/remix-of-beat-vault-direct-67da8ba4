

## Add Automatic Image Optimization for Logo Uploads

### Problem
Logo uploads are stored as-is, regardless of file size or resolution. Large images slow down page loads for tenant storefronts.

### Approach
Use the browser Canvas API to resize and compress logos client-side before uploading to storage. This avoids needing a server-side image processing pipeline.

### Plan

**1. Create a shared image optimization utility** (`src/lib/imageOptimize.ts`)
- Accept a `File` object and target constraints (max width: 800px, max height: 200px, quality: 0.85)
- Use `HTMLCanvasElement` to draw and resize the image
- For PNGs with transparency, output as PNG; otherwise output as WebP (with JPEG fallback)
- SVGs are skipped (already vector/lightweight)
- Return an optimized `File` object ready for upload
- Also generate a small thumbnail variant (max 200px wide) for admin previews

**2. Update `VisualPageBuilder.tsx` `handleLogoUpload`**
- Import and call the optimization function before uploading
- Skip optimization for SVG files
- Upload the optimized file instead of the raw file
- No changes to the upload destination or public URL logic

**3. Update `ThemeEditor.tsx` `handleLogoUpload`**
- Same changes as above — call optimizer before upload

### Technical Details

The optimization utility will:
- Load the image into an `Image` element via `URL.createObjectURL`
- Calculate scaled dimensions maintaining aspect ratio within max bounds
- Draw to a canvas at the target size
- Export via `canvas.toBlob()` with quality setting
- Wrap result as a new `File` object preserving a clean filename

Files to create/modify:
- **Create**: `src/lib/imageOptimize.ts`
- **Edit**: `src/components/admin/VisualPageBuilder.tsx` (lines ~261-279)
- **Edit**: `src/components/admin/ThemeEditor.tsx` (lines ~93-107)

