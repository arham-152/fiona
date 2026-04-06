import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model: cocoSsd.ObjectDetection | null = null;

export async function loadDetectionModel() {
  if (!model) {
    // Ensure TFJS is initialized
    await tf.ready();
    model = await cocoSsd.load();
  }
  return model;
}

export async function detectSubject(imageElement: HTMLImageElement) {
  const net = await loadDetectionModel();
  const predictions = await net.detect(imageElement);
  
  if (predictions.length === 0) return null;

  // Filter for common subjects: person, cat, dog, bird, etc.
  // Or just pick the most confident one
  const mainSubject = predictions.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );

  return {
    bbox: mainSubject.bbox, // [x, y, width, height]
    class: mainSubject.class,
    score: mainSubject.score
  };
}

export function getSmartCropFromSubject(
  subjectBbox: [number, number, number, number],
  imgWidth: number,
  imgHeight: number,
  paddingFactor = 0.2
) {
  const [sx, sy, sw, sh] = subjectBbox;
  
  // Add some padding around the subject
  const padW = sw * paddingFactor;
  const padH = sh * paddingFactor;
  
  let x = Math.max(0, sx - padW);
  let y = Math.max(0, sy - padH);
  let width = Math.min(imgWidth - x, sw + 2 * padW);
  let height = Math.min(imgHeight - y, sh + 2 * padH);

  // Convert to percentages for react-image-crop
  return {
    unit: '%' as const,
    x: (x / imgWidth) * 100,
    y: (y / imgHeight) * 100,
    width: (width / imgWidth) * 100,
    height: (height / imgHeight) * 100
  };
}
