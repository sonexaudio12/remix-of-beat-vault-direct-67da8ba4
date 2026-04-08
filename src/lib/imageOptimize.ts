export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxWidth: 800,
  maxHeight: 200,
  quality: 0.85,
};

function isSvg(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

function isPng(file: File): boolean {
  return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
}

export async function optimizeImage(
  file: File,
  opts: OptimizeOptions = {}
): Promise<File> {
  if (isSvg(file)) return file;

  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...opts };

  const img = await loadImage(file);
  const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);

  // If the image is already small enough, skip processing
  if (width >= img.naturalWidth && height >= img.naturalHeight && file.size < 200_000) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  const preserveAlpha = isPng(file);
  const mimeType = preserveAlpha ? 'image/png' : 'image/webp';
  const blob = await canvasToBlob(canvas, mimeType, preserveAlpha ? undefined : quality);

  const ext = preserveAlpha ? 'png' : 'webp';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function fitDimensions(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let w = srcW;
  let h = srcH;
  if (w > maxW) {
    h = Math.round(h * (maxW / w));
    w = maxW;
  }
  if (h > maxH) {
    w = Math.round(w * (maxH / h));
    h = maxH;
  }
  return { width: w, height: h };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      quality
    );
  });
}
