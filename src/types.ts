export interface PageItem {
  id: string;
  fileId: string;
  originalFileName: string;
  pageNumber: number;
  dataUrl: string; // The image representation of the page
  rotation: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  filter?: 'none' | 'grayscale' | 'punch' | 'golden' | 'radiate' | 'warm-contrast' | 'calm' | 'cool-light' | 'vivid-cool' | 'dramatic-cool';
  annotations?: Annotation[];
  color: string; // For grouping/marking
}

export interface Annotation {
  id: string;
  type: 'text' | 'rect' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  image?: string; // Data URL for image annotation
  color: string;
  fontSize?: number;
  rotation?: number;
}

export interface FileGroup {
  id: string;
  name: string;
  color: string;
}
