import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.js?url';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { PageItem } from '../types';

import imageCompression from 'browser-image-compression';

// Set worker for pdfjs
if (typeof window !== 'undefined') {
  (pdfjs as any).GlobalWorkerOptions.workerSrc = pdfWorker;
}

const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (e) {
      // Fallback below
    }
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export async function extractPagesFromPdf(file: File, color: string): Promise<PageItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdfBuffer = new Uint8Array(arrayBuffer);
  
  const pdf = await pdfjs.getDocument({ data: sourcePdfBuffer }).promise;
  
  const fileId = file.name + '-' + Date.now();
  const results: PageItem[] = [];
  
  // Process in batches to avoid memory spikes and keep UI responsive
  const BATCH_SIZE = 5;
  for (let i = 0; i < pdf.numPages; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, pdf.numPages - i) }, async (_, j) => {
      const pageNum = i + j + 1;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 4.0 }); // High scale (approx 288 DPI) for crisp previews and fallbacks
      
      // Use OffscreenCanvas if available for better performance
      let canvas: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(viewport.width, viewport.height);
      } else {
        canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
      }
      
      const context = canvas.getContext('2d');
      
      if (context) {
        await (page as any).render({ canvasContext: context, viewport }).promise;
        
        // Use high-quality JPEG for speed and compatibility
        let dataUrl: string;
        if (canvas instanceof OffscreenCanvas) {
          const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 1.0 });
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        }
        
        return {
          id: generateId(),
          fileId: fileId,
          originalFileName: file.name,
          pageNumber: pageNum,
          dataUrl,
          rotation: 0,
          adjustments: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
          },
          annotations: [],
          color,
          sourcePdfBuffer, // Store reference to original PDF buffer
        } as PageItem;
      }
      return null;
    });
    
    const batchResults = await Promise.all(batch);
    results.push(...batchResults.filter((p): p is PageItem => p !== null));
  }

  return results;
}

export async function processImageFile(file: File, color: string): Promise<PageItem> {
  // Use ultra-high quality for images
  const options = {
    maxSizeMB: 10, // Increased from 5
    maxWidthOrHeight: 8192, // Increased from 4096 (8K support)
    useWebWorker: true,
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    
    return {
      id: generateId(),
      fileId: file.name + '-' + Date.now(),
      originalFileName: file.name,
      pageNumber: 1,
      dataUrl,
      rotation: 0,
      adjustments: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
      },
      annotations: [],
      color,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to original file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          id: generateId(),
          fileId: file.name + '-' + Date.now(),
          originalFileName: file.name,
          pageNumber: 1,
          dataUrl,
          rotation: 0,
          adjustments: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
          },
          annotations: [],
          color,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

async function applyAdjustmentsToImage(pageItem: PageItem): Promise<string> {
  // If no adjustments, no filters, and no annotations, return original dataUrl to save memory and avoid canvas issues
  const hasAdjustments = pageItem.adjustments && (
    (pageItem.adjustments.brightness !== undefined && pageItem.adjustments.brightness !== 100) || 
    (pageItem.adjustments.contrast !== undefined && pageItem.adjustments.contrast !== 100) || 
    (pageItem.adjustments.saturation !== undefined && pageItem.adjustments.saturation !== 100)
  );
  const hasFilter = pageItem.filter && pageItem.filter !== 'none';
  const hasAnnotations = pageItem.annotations && pageItem.annotations.length > 0;

  if (!hasAdjustments && !hasFilter && !hasAnnotations) {
    return pageItem.dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(pageItem.dataUrl);
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Apply filters
      let filterStr = '';
      if (pageItem.adjustments) {
        filterStr += `brightness(${pageItem.adjustments.brightness ?? 100}%) `;
        filterStr += `contrast(${pageItem.adjustments.contrast ?? 100}%) `;
        filterStr += `saturate(${pageItem.adjustments.saturation ?? 100}%) `;
      }
      
      if (pageItem.filter === 'grayscale') filterStr += 'grayscale(100%) ';
      if (pageItem.filter === 'punch') filterStr += 'contrast(120%) saturate(120%) ';
      if (pageItem.filter === 'golden') filterStr += 'sepia(30%) saturate(140%) brightness(110%) ';
      if (pageItem.filter === 'radiate') filterStr += 'brightness(115%) saturate(130%) ';
      if (pageItem.filter === 'warm-contrast') filterStr += 'sepia(10%) contrast(110%) saturate(110%) ';
      if (pageItem.filter === 'calm') filterStr += 'saturate(80%) brightness(105%) ';
      if (pageItem.filter === 'cool-light') filterStr += 'hue-rotate(10deg) saturate(90%) brightness(110%) ';
      if (pageItem.filter === 'vivid-cool') filterStr += 'saturate(140%) hue-rotate(10deg) ';
      if (pageItem.filter === 'dramatic-cool') filterStr += 'contrast(130%) hue-rotate(20deg) saturate(80%) ';
      
      if (filterStr.trim()) {
        ctx.filter = filterStr.trim();
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Reset filter for annotations
      ctx.filter = 'none';
      
      // Draw annotations
      pageItem.annotations?.forEach(anno => {
        const x = (anno.x / 100) * canvas.width;
        const y = (anno.y / 100) * canvas.height;
        
        ctx.save();
        if (anno.rotation) {
          ctx.translate(x, y);
          ctx.rotate((anno.rotation * Math.PI) / 180);
          ctx.translate(-x, -y);
        }

        if (anno.type === 'rect') {
          const w = (anno.width! / 100) * canvas.width;
          const h = (anno.height! / 100) * canvas.height;
          ctx.fillStyle = anno.color;
          ctx.fillRect(x, y, w, h);
        } else if (anno.type === 'text') {
          ctx.fillStyle = anno.color;
          ctx.font = `bold ${anno.fontSize}px Arial`;
          ctx.textBaseline = 'top';
          ctx.fillText(anno.text || '', x, y);
        } else if (anno.type === 'image' && anno.image) {
          // Image annotations would need to be loaded as well, but for now we skip or use a placeholder
          // In a real app, we'd wait for all annotation images to load
        }
        ctx.restore();
      });
      
      try {
        resolve(canvas.toDataURL('image/jpeg', 1.0)); // High quality JPEG for speed
      } catch (e) {
        console.error('Canvas toDataURL failed:', e);
        resolve(pageItem.dataUrl);
      }
    };
    img.onerror = () => {
      console.error('Failed to load image for adjustments');
      resolve(pageItem.dataUrl);
    };
    img.src = pageItem.dataUrl;
  });
}

export async function generatePdfFromPages(pages: PageItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Cache for loaded PDF documents to avoid re-loading same buffer
  const loadedPdfs = new Map<Uint8Array, PDFDocument>();

  for (const pageItem of pages) {
    // Check if we can use the original PDF page (no crop, no adjustments, no filters, no annotations)
    const hasAdjustments = pageItem.adjustments && (
      (pageItem.adjustments.brightness !== undefined && pageItem.adjustments.brightness !== 100) || 
      (pageItem.adjustments.contrast !== undefined && pageItem.adjustments.contrast !== 100) || 
      (pageItem.adjustments.saturation !== undefined && pageItem.adjustments.saturation !== 100)
    );
    const hasFilter = pageItem.filter && pageItem.filter !== 'none';
    const hasAnnotations = pageItem.annotations && pageItem.annotations.length > 0;
    const hasCrop = !!pageItem.crop;
    const isEdited = !!pageItem.isEdited;

    if (pageItem.sourcePdfBuffer && !hasAdjustments && !hasFilter && !hasAnnotations && !hasCrop && !isEdited) {
      // 100% Quality: Copy original PDF page
      let sourceDoc = loadedPdfs.get(pageItem.sourcePdfBuffer);
      if (!sourceDoc) {
        sourceDoc = await PDFDocument.load(pageItem.sourcePdfBuffer);
        loadedPdfs.set(pageItem.sourcePdfBuffer, sourceDoc);
      }
      
      const [copiedPage] = await pdfDoc.copyPages(sourceDoc, [pageItem.pageNumber - 1]);
      
      // Handle rotation (pdf-lib uses degrees)
      if (pageItem.rotation !== 0) {
        copiedPage.setRotation(degrees(pageItem.rotation));
      }
      
      pdfDoc.addPage(copiedPage);
      continue;
    }

    // Otherwise, render to high-quality image and embed
    const adjustedDataUrl = await applyAdjustmentsToImage(pageItem);
    
    // Manual conversion of data URL to ArrayBuffer to avoid fetch restrictions
    const base64Data = adjustedDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBytes = bytes.buffer;

    let image;
    
    if (adjustedDataUrl.startsWith('data:image/jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      image = await pdfDoc.embedPng(imageBytes);
    }

    // UI rotation is clockwise, pdf-lib rotation is counter-clockwise
    const rotationCW = ((pageItem.rotation % 360) + 360) % 360;
    const rotationCCW = (360 - rotationCW) % 360;
    
    const isVertical = rotationCW === 90 || rotationCW === 270;
    
    // Standard A4 dimensions in points
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;
    
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    // Determine if the page should be landscape or portrait based on image aspect ratio
    const isLandscape = (isVertical ? imgHeight : imgWidth) > (isVertical ? imgWidth : imgHeight);
    
    const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
    const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;
    
    const scaleX = pageWidth / (isVertical ? imgHeight : imgWidth);
    const scaleY = pageHeight / (isVertical ? imgWidth : imgHeight);
    const scaleFactor = Math.min(scaleX, scaleY);
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;
    
    // Center the image on the A4 page
    let x = (pageWidth - (isVertical ? drawHeight : drawWidth)) / 2;
    let y = (pageHeight - (isVertical ? drawWidth : drawHeight)) / 2;

    // Adjust x,y for rotation (pdf-lib rotates around bottom-left of the drawn area)
    if (rotationCCW === 90) {
      x += drawHeight;
    } else if (rotationCCW === 180) {
      x += drawWidth;
      y += drawHeight;
    } else if (rotationCCW === 270) {
      y += drawWidth;
    }
    
    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      rotate: degrees(rotationCCW),
    });
  }
  
  return await pdfDoc.save();
}

export const FILE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];
