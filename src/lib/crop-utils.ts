export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * Automatically detects the content area (non-background) and returns a crop.
 * It samples all four edges to detect the background color more accurately.
 */
export async function getAutoTrimCrop(
  imageSrc: string,
  tolerance = 25 // Tolerance for background color matching
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return null;

  // Use a smaller canvas for faster detection (max 800px)
  const maxDim = 800;
  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Sample edges to guess background color
  let bgR = 0, bgG = 0, bgB = 0;
  let samples = 0;
  
  // Sample top and bottom edges
  for (let x = 0; x < canvas.width; x += 20) {
    const topIdx = (0 * canvas.width + x) * 4;
    const botIdx = ((canvas.height - 1) * canvas.width + x) * 4;
    bgR += data[topIdx] + data[botIdx];
    bgG += data[topIdx + 1] + data[botIdx + 1];
    bgB += data[topIdx + 2] + data[botIdx + 2];
    samples += 2;
  }
  
  bgR /= samples;
  bgG /= samples;
  bgB /= samples;

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let found = false;

  // Scan pixels in steps for speed, then refine
  const step = 2;
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      // If pixel is significantly different from background
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

      if (a > 50 && diff > tolerance) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;

  // Add a small margin (1%)
  const marginX = (maxX - minX) * 0.01;
  const marginY = (maxY - minY) * 0.01;

  // Map back to original coordinates
  return {
    x: Math.max(0, (minX - marginX) / scale),
    y: Math.max(0, (minY - marginY) / scale),
    width: Math.min(image.width, ((maxX - minX) + 2 * marginX) / scale),
    height: Math.min(image.height, ((maxY - minY) + 2 * marginY) / scale),
  };
}

/**
 * This function was adapted from the one in the `react-easy-crop` project.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  adjustments?: { brightness: number; contrast: number; saturation: number }
): Promise<string | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central point to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.filter = `brightness(${adjustments?.brightness ?? 100}%) contrast(${adjustments?.contrast ?? 100}%) saturate(${adjustments?.saturation ?? 100}%)`
  ctx.drawImage(image, 0, 0)
  ctx.filter = 'none'

  // Create a second canvas for the crop
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = pixelCrop.width
  cropCanvas.height = pixelCrop.height
  const cropCtx = cropCanvas.getContext('2d')

  if (!cropCtx || pixelCrop.width <= 0 || pixelCrop.height <= 0) return null

  // Draw the cropped area from the first canvas onto the second one
  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As Base64 string
  return cropCanvas.toDataURL('image/jpeg', 1.0);
}
