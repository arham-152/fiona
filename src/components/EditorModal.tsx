import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { 
  X, RotateCcw, RotateCw, 
  Check, Trash2, Sparkles, ChevronLeft, ChevronRight,
  RefreshCcw, Crop as CropIcon, Undo2, Redo2, Type, Square, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { PageItem, Annotation } from '../types';
import { clsx } from 'clsx';
import { getCroppedImg, rotateSize } from '../lib/crop-utils';
import { analyzeImageForSmartCrop } from '../lib/gemini-ai';
import { detectSubject, getSmartCropFromSubject } from '../lib/ai-detection';

interface EditorModalProps {
  page: PageItem;
  onSave: (updatedPage: PageItem) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  page,
  onSave,
  onClose,
  onDelete,
  onNext,
  onPrev,
  isFirst,
  isLast,
}) => {
  const [editedPage, setEditedPage] = useState<PageItem>({ 
    ...page,
    annotations: page.annotations || []
  });
  
  // General History for Undo/Redo
  const [history, setHistory] = useState<PageItem[]>([{ ...page, annotations: page.annotations || [] }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback((newPage: PageItem) => {
    setHistory(prev => {
      const next = prev.slice(0, currentIndex + 1);
      // Simple check to avoid duplicate states
      if (JSON.stringify(next[next.length - 1]) === JSON.stringify(newPage)) return prev;
      const updated = [...next, newPage];
      setCurrentIndex(updated.length - 1);
      return updated;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setEditedPage(history[prevIndex]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setEditedPage(history[nextIndex]);
    }
  }, [currentIndex, history]);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isFitToScreen] = useState(true);
  
  // Cropper state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [cropHistory, setCropHistory] = useState<Crop[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [showGrid, setShowGrid] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const initialState = {
      ...page,
      annotations: page.annotations || []
    };
    setEditedPage(initialState);
    setHistory([initialState]);
    setCurrentIndex(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCropping(false);
    setSelectedAnnotationId(null);
    setZoom(1);
  }, [page]);

  const handleZoom = (dir: 'in' | 'out') => {
    setZoom(prev => {
      const next = dir === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.max(0.1, Math.min(3, next));
    });
  };

  const addToCropHistory = useCallback((newCrop: Crop) => {
    setCropHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      // Only add if it's significantly different to avoid spam
      const last = next[next.length - 1];
      if (last && last.x === newCrop.x && last.y === newCrop.y && last.width === newCrop.width && last.height === newCrop.height) {
        return prev;
      }
      const updated = [...next, newCrop];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

  const handleUndoCrop = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCrop(cropHistory[prevIndex]);
    }
  };

  const handleRedoCrop = () => {
    if (historyIndex < cropHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCrop(cropHistory[nextIndex]);
    }
  };

  // Annotation state
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  const handleRotate = (dir: 'left' | 'right') => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        rotation: (prev.rotation + (dir === 'left' ? -90 : 90)) % 360
      };
      addToHistory(updated);
      return updated;
    });
  };

  const handleAdjustment = (key: keyof PageItem['adjustments'], value: number) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        adjustments: {
          ...prev.adjustments,
          [key]: value
        }
      };
      // Debounce history for adjustments to avoid massive stacks
      return updated;
    });
  };

  // Debounced adjustment history
  useEffect(() => {
    const timer = setTimeout(() => {
      addToHistory(editedPage);
    }, 500);
    return () => clearTimeout(timer);
  }, [editedPage.adjustments]);

  const handleFilter = (filter: PageItem['filter']) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        filter
      };
      addToHistory(updated);
      return updated;
    });
  };

  const handleReset = () => {
    const resetState = { 
      ...page,
      annotations: page.annotations || [],
      filter: 'none'
    };
    setEditedPage(resetState);
    addToHistory(resetState);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCropping(false);
    setSelectedAnnotationId(null);
  };

  const addTextAnnotation = () => {
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'text',
      x: 50,
      y: 50,
      text: 'Double click to edit',
      color: '#000000',
      fontSize: 24
    };
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: [...(prev.annotations || []), newAnnotation]
      };
      addToHistory(updated);
      return updated;
    });
    setSelectedAnnotationId(newAnnotation.id);
  };

  const addRectAnnotation = () => {
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'rect',
      x: 40,
      y: 40,
      width: 20,
      height: 10,
      color: '#ffffff'
    };
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: [...(prev.annotations || []), newAnnotation]
      };
      addToHistory(updated);
      return updated;
    });
    setSelectedAnnotationId(newAnnotation.id);
  };

  const addImageAnnotation = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const dataUrl = re.target?.result as string;
          const newAnnotation: Annotation = {
            id: crypto.randomUUID(),
            type: 'image',
            x: 40,
            y: 40,
            width: 20,
            height: 20,
            image: dataUrl,
            color: 'transparent'
          };
          setEditedPage(prev => {
            const updated = {
              ...prev,
              annotations: [...(prev.annotations || []), newAnnotation]
            };
            addToHistory(updated);
            return updated;
          });
          setSelectedAnnotationId(newAnnotation.id);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeAnnotation = (id: string) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: (prev.annotations || []).filter(a => a.id !== id)
      };
      addToHistory(updated);
      return updated;
    });
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: (prev.annotations || []).map(a => a.id === id ? { ...a, ...updates } : a)
      };
      // We don't add to history on every tiny movement to avoid lag
      return updated;
    });
  };

  // Add to history after annotation move/resize finishes
  const commitAnnotationChange = useCallback(() => {
    addToHistory(editedPage);
  }, [addToHistory, editedPage]);

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    try {
      const image = imgRef.current;
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.naturalWidth,
        image.naturalHeight,
        editedPage.rotation
      );

      // Calculate scale between displayed image and natural bounding box
      const scaleX = bBoxWidth / image.width;
      const scaleY = bBoxHeight / image.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImage = await getCroppedImg(
        editedPage.dataUrl,
        pixelCrop,
        editedPage.rotation,
        { horizontal: false, vertical: false },
        editedPage.adjustments
      );
      
      if (croppedImage) {
        setEditedPage(prev => {
          const updated = {
            ...prev,
            dataUrl: croppedImage,
            rotation: 0, // Reset rotation after applying crop to the base image
            adjustments: { brightness: 100, contrast: 100, saturation: 100 } // Reset adjustments as they are baked in
          };
          addToHistory(updated);
          return updated;
        });
        setCrop(undefined);
        setCompletedCrop(undefined);
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 100,
        },
        undefined,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCropHistory([initialCrop]);
    setHistoryIndex(0);
  };

  const handleSmartSuggest = async () => {
    if (!imgRef.current) return;
    setIsDetecting(true);
    try {
      // Try local AI first (TensorFlow.js)
      const subject = await detectSubject(imgRef.current);
      if (subject) {
        const { width, height } = imgRef.current;
        const newCrop = getSmartCropFromSubject(subject.bbox, width, height);
        setCrop(newCrop);
        // Trigger pixel crop update
        setCompletedCrop({
          unit: 'px',
          x: (newCrop.x / 100) * width,
          y: (newCrop.y / 100) * height,
          width: (newCrop.width / 100) * width,
          height: (newCrop.height / 100) * height
        });
        setIsDetecting(false);
        return;
      }

      // Fallback to Gemini AI
      const result = await analyzeImageForSmartCrop(editedPage.dataUrl);
      if (result && result.crop) {
        const { width, height } = imgRef.current;
        const newCrop: Crop = {
          unit: '%',
          x: result.crop.x / 10,
          y: result.crop.y / 10,
          width: result.crop.width / 10,
          height: result.crop.height / 10
        };
        setCrop(newCrop);
        setCompletedCrop({
          unit: 'px',
          x: (result.crop.x / 1000) * width,
          y: (result.crop.y / 1000) * height,
          width: (result.crop.width / 1000) * width,
          height: (result.crop.height / 1000) * height
        });
      }
    } catch (error) {
      console.error('Smart suggest failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-brand-900/95 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-7xl h-full sm:h-[95vh] bg-white rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <img 
              src="https://storage.googleapis.com/static-content-ais/ais-dev-guci33aws6znemhwdf727f-579661047554.asia-southeast1.run.app/user_uploads/logo.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Edit Page {page.pageNumber}</h3>
              <p className="text-xs text-gray-500 font-medium">Customize and annotate your document page</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 mr-2">
              <button 
                onClick={undo}
                disabled={currentIndex <= 0}
                className="p-2 hover:bg-gray-100 text-gray-700 disabled:text-gray-300 disabled:hover:bg-transparent rounded-md transition-colors"
                title="Undo"
              >
                <Undo2 size={18} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button 
                onClick={redo}
                disabled={currentIndex >= history.length - 1}
                className="p-2 hover:bg-gray-100 text-gray-700 disabled:text-gray-300 disabled:hover:bg-transparent rounded-md transition-colors"
                title="Redo"
              >
                <Redo2 size={18} />
              </button>
            </div>
            
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider border border-gray-200"
            >
              RESET
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors border border-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar bg-gray-50">
          {/* Left: Image Preview / Cropper */}
          <div className={clsx(
            "shrink-0 lg:flex-1 relative bg-gray-50 flex items-center justify-center group p-2 sm:p-4 min-h-[45vh] lg:min-h-0",
            isCropping ? "overflow-hidden bg-zinc-900" : "lg:overflow-auto custom-scrollbar"
          )}>
            {isCropping ? (
              <div className="relative w-full h-full flex flex-col bg-zinc-900 overflow-hidden">
                <div className="flex-1 w-full overflow-auto custom-scrollbar p-4 sm:p-12 flex items-center justify-center">
                  <div 
                    style={{ 
                      width: `${100 * zoom}%`,
                      maxWidth: 'none',
                      transition: 'width 0.2s ease-out'
                    }}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => {
                        setCompletedCrop(c);
                        if (crop) addToCropHistory(crop);
                      }}
                      aspect={aspect}
                      ruleOfThirds={showGrid}
                      className="shadow-2xl"
                    >
                      <img
                        ref={imgRef}
                        src={editedPage.dataUrl}
                        alt="Crop Preview"
                        onLoad={onImageLoad}
                        className="w-full h-auto block"
                        style={{ 
                          transform: `rotate(${editedPage.rotation}deg)`,
                          transformOrigin: 'center center',
                          filter: `brightness(${editedPage.adjustments.brightness}%) contrast(${editedPage.adjustments.contrast}%) saturate(${editedPage.adjustments.saturation}%) ${
                            editedPage.filter === 'grayscale' ? 'grayscale(100%)' : 
                            editedPage.filter === 'punch' ? 'contrast(120%) saturate(120%)' :
                            editedPage.filter === 'golden' ? 'sepia(30%) saturate(140%) brightness(110%)' :
                            editedPage.filter === 'radiate' ? 'brightness(115%) saturate(130%)' :
                            editedPage.filter === 'warm-contrast' ? 'sepia(10%) contrast(110%) saturate(110%)' :
                            editedPage.filter === 'calm' ? 'saturate(80%) brightness(105%)' :
                            editedPage.filter === 'cool-light' ? 'hue-rotate(10deg) saturate(90%) brightness(110%)' :
                            editedPage.filter === 'vivid-cool' ? 'saturate(140%) hue-rotate(10deg)' :
                            editedPage.filter === 'dramatic-cool' ? 'contrast(130%) hue-rotate(20deg) saturate(80%)' : ''
                          }`
                        }}
                      />
                    </ReactCrop>
                  </div>
                </div>
                
                {/* Crop Tool Bottom Bar - Matching Screenshot */}
                <div className="w-full bg-zinc-900/95 border-t border-zinc-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <ZoomIn size={12} />
                        ZOOM & ALIGNMENT
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                          <button 
                            onClick={() => handleZoom('out')}
                            className="p-2 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                            title="Zoom Out"
                          >
                            <ZoomOut size={18} />
                          </button>
                          <div className="w-px h-4 bg-zinc-700 mx-1" />
                          <button 
                            onClick={() => handleZoom('in')}
                            className="p-2 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                            title="Zoom In"
                          >
                            <ZoomIn size={18} />
                          </button>
                        </div>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <button 
                          onClick={() => handleRotate('left')}
                          className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-emerald-500 rounded-lg transition-colors border border-emerald-500/20"
                          title="Rotate Left"
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button 
                          onClick={() => handleRotate('right')}
                          className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-emerald-500 rounded-lg transition-colors border border-emerald-500/20"
                          title="Rotate Right"
                        >
                          <RotateCw size={18} />
                        </button>
                      </div>
                    </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSmartSuggest}
                      disabled={isDetecting}
                      className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all",
                        isDetecting ? "bg-zinc-800 text-zinc-500" : "bg-zinc-800/50 hover:bg-zinc-800 text-emerald-500 border border-emerald-500/30"
                      )}
                    >
                      <Sparkles size={16} className={isDetecting ? "animate-spin" : ""} />
                      {isDetecting ? 'Detecting...' : 'AI Auto Crop'}
                    </button>
                    <button 
                      onClick={handleApplyCrop}
                      className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Check size={18} />
                      APPLY
                    </button>
                    <button 
                      onClick={() => setIsCropping(false)}
                      className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-full transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div
                key={editedPage.id + editedPage.rotation + editedPage.dataUrl}
                className="relative w-full h-full flex items-center justify-center p-2 sm:p-8"
                ref={containerRef}
                onClick={() => setSelectedAnnotationId(null)}
              >
                  <div 
                    className="relative transition-transform duration-500 ease-out flex items-center justify-center"
                    style={{ 
                      transform: `rotate(${editedPage.rotation}deg)`,
                      width: isFitToScreen ? '100%' : 'auto',
                      height: isFitToScreen ? '100%' : 'auto',
                    }}
                  >
                    <img
                      src={editedPage.dataUrl}
                      alt="Editor Preview"
                      className={clsx(
                        "shadow-2xl object-contain transition-all",
                        isFitToScreen ? "max-w-full max-h-full" : "w-auto h-auto"
                      )}
                      style={{ 
                        filter: `brightness(${editedPage.adjustments.brightness}%) contrast(${editedPage.adjustments.contrast}%) saturate(${editedPage.adjustments.saturation}%) ${
                          editedPage.filter === 'grayscale' ? 'grayscale(100%)' : 
                          editedPage.filter === 'punch' ? 'contrast(120%) saturate(120%)' :
                          editedPage.filter === 'golden' ? 'sepia(30%) saturate(140%) brightness(110%)' :
                          editedPage.filter === 'radiate' ? 'brightness(115%) saturate(130%)' :
                          editedPage.filter === 'warm-contrast' ? 'sepia(10%) contrast(110%) saturate(110%)' :
                          editedPage.filter === 'calm' ? 'saturate(80%) brightness(105%)' :
                          editedPage.filter === 'cool-light' ? 'hue-rotate(10deg) saturate(90%) brightness(110%)' :
                          editedPage.filter === 'vivid-cool' ? 'saturate(140%) hue-rotate(10deg)' :
                          editedPage.filter === 'dramatic-cool' ? 'contrast(130%) hue-rotate(20deg) saturate(80%)' : ''
                        }`
                      }}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Annotations Layer */}
                    <div className="absolute inset-0 pointer-events-none">
                      {editedPage.annotations?.map((anno) => (
                        <div
                          key={anno.id}
                          className={clsx(
                            "absolute pointer-events-auto group",
                            editingAnnotationId !== anno.id && "cursor-move",
                            selectedAnnotationId === anno.id && "ring-2 ring-brand-600 ring-offset-2 ring-offset-brand-900"
                          )}
                          style={{
                            left: `${anno.x}%`,
                            top: `${anno.y}%`,
                            width: anno.type === 'rect' ? `${anno.width}%` : 'auto',
                            height: anno.type === 'rect' ? `${anno.height}%` : 'auto',
                            backgroundColor: anno.type === 'rect' ? anno.color : 'transparent',
                            color: anno.type === 'text' ? anno.color : 'inherit',
                            fontSize: anno.type === 'text' ? `${anno.fontSize}px` : 'inherit',
                            fontWeight: anno.type === 'text' ? 'bold' : 'normal',
                            zIndex: selectedAnnotationId === anno.id ? 30 : 20
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnnotationId(anno.id);
                          }}
                          onMouseDown={(e) => {
                            if (selectedAnnotationId !== anno.id || editingAnnotationId === anno.id) return;
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const initialX = anno.x;
                            const initialY = anno.y;
                            const rotationRad = (editedPage.rotation * Math.PI) / 180;
                            let hasMoved = false;
 
                            const onMouseMove = (moveEvent: MouseEvent) => {
                              const container = containerRef.current;
                              if (!container) return;
                              
                              // Rotate mouse movement back to local coordinates
                              const rawDx = moveEvent.clientX - startX;
                              const rawDy = moveEvent.clientY - startY;
                              
                              const dx = (rawDx * Math.cos(-rotationRad) - rawDy * Math.sin(-rotationRad)) / container.clientWidth * 100;
                              const dy = (rawDx * Math.sin(-rotationRad) + rawDy * Math.cos(-rotationRad)) / container.clientHeight * 100;
                              
                              if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                                hasMoved = true;
                                updateAnnotation(anno.id, {
                                  x: Math.max(0, Math.min(100, initialX + dx)),
                                  y: Math.max(0, Math.min(100, initialY + dy))
                                });
                              }
                            };
 
                            const onMouseUp = () => {
                              document.removeEventListener('mousemove', onMouseMove);
                              document.removeEventListener('mouseup', onMouseUp);
                              if (hasMoved) commitAnnotationChange();
                            };
 
                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                          {anno.type === 'text' && (
                            <div 
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingAnnotationId(anno.id);
                              }}
                              className="whitespace-nowrap px-2 py-1 select-none"
                            >
                              {editingAnnotationId === anno.id ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={anno.text}
                                  onChange={(e) => updateAnnotation(anno.id, { text: e.target.value })}
                                  onBlur={() => setEditingAnnotationId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingAnnotationId(null);
                                  }}
                                  className="bg-white/10 border-none outline-none text-inherit px-1 rounded"
                                  style={{ width: `${Math.max(2, anno.text.length)}ch` }}
                                />
                              ) : (
                                anno.text
                              )}
                            </div>
                          )}

                          {anno.type === 'image' && anno.image && (
                            <img 
                              src={anno.image} 
                              alt="Annotation" 
                              className="w-full h-full object-contain pointer-events-none select-none"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          {selectedAnnotationId === anno.id && (
                            <>
                              {/* Resize Handles */}
                              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
                                <div
                                  key={corner}
                                  className={clsx(
                                    "absolute w-4 h-4 bg-brand-600 border-2 border-white rounded-full z-40 shadow-lg",
                                    corner === 'top-left' && "-top-2 -left-2 cursor-nw-resize",
                                    corner === 'top-right' && "-top-2 -right-2 cursor-ne-resize",
                                    corner === 'bottom-left' && "-bottom-2 -left-2 cursor-sw-resize",
                                    corner === 'bottom-right' && "-bottom-2 -right-2 cursor-se-resize"
                                  )}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const initialX = anno.x;
                                    const initialY = anno.y;
                                    const initialW = anno.width || 10;
                                    const initialH = anno.height || 5;
                                    const rotationRad = (editedPage.rotation * Math.PI) / 180;
 
                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                      const container = containerRef.current;
                                      if (!container) return;
                                      
                                      // Rotate mouse movement back to local coordinates
                                      const rawDx = moveEvent.clientX - startX;
                                      const rawDy = moveEvent.clientY - startY;
                                      
                                      const dx = (rawDx * Math.cos(-rotationRad) - rawDy * Math.sin(-rotationRad)) / container.clientWidth * 100;
                                      const dy = (rawDx * Math.sin(-rotationRad) + rawDy * Math.cos(-rotationRad)) / container.clientHeight * 100;
 
                                      let newX = initialX;
                                      let newY = initialY;
                                      let newW = initialW;
                                      let newH = initialH;
 
                                      if (corner.includes('right')) newW = Math.max(5, initialW + dx);
                                      if (corner.includes('left')) {
                                        newW = Math.max(5, initialW - dx);
                                        newX = initialX + (initialW - newW);
                                      }
                                      if (corner.includes('bottom')) newH = Math.max(2, initialH + dy);
                                      if (corner.includes('top')) {
                                        newH = Math.max(2, initialH - dy);
                                        newY = initialY + (initialH - newH);
                                      }
 
                                      updateAnnotation(anno.id, { x: newX, y: newY, width: newW, height: newH });
                                    };
 
                                    const onMouseUp = () => {
                                      document.removeEventListener('mousemove', onMouseMove);
                                      document.removeEventListener('mouseup', onMouseUp);
                                      commitAnnotationChange();
                                    };
 
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                  }}
                                />
                              ))}
                            </>
                          )}
                          
                          {selectedAnnotationId === anno.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAnnotation(anno.id);
                              }}
                              className="absolute -top-3 -right-3 p-1 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            )}
 
            {/* Navigation Arrows */}
            {!isFirst && !isCropping && (
              <button 
                onClick={onPrev}
                className="absolute left-6 p-4 bg-gray-900/50 hover:bg-gray-900 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {!isLast && !isCropping && (
              <button 
                onClick={onNext}
                className="absolute right-6 p-4 bg-gray-900/50 hover:bg-gray-900 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight size={24} />
              </button>
            )}
            
            {!isCropping && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                <div className="px-4 py-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                  {editedPage.rotation}° rotation
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar Controls - Unified Frame */}
          <div className="shrink-0 lg:flex-none lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 bg-white flex flex-col lg:overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 space-y-8 lg:overflow-y-auto custom-scrollbar">
              {/* TRANSFORM SECTION */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transform</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleRotate('left')}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm"
                  >
                    <RotateCcw size={18} />
                    <span className="text-[10px]">Left 90°</span>
                  </button>
                  <button 
                    onClick={() => handleRotate('right')}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm"
                  >
                    <RotateCw size={18} />
                    <span className="text-[10px]">Right 90°</span>
                  </button>
                </div>
              </div>

              {/* CROP SECTION */}
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crop</label>
                
                {!isCropping ? (
                  <button 
                    onClick={() => {
                      setIsCropping(true);
                      setCropHistory([]);
                      setHistoryIndex(-1);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-sm"
                  >
                    <CropIcon size={16} />
                    Enter Crop Mode
                  </button>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 text-center">Use the handles on the image to adjust the crop area.</p>
                  </div>
                )}
              </div>

              {/* ANNOTATE SECTION */}
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Annotate</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={addTextAnnotation}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm"
                  >
                    <Type size={18} />
                    <span className="text-[10px]">Add Text</span>
                  </button>
                  <button 
                    onClick={addRectAnnotation}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm"
                  >
                    <Square size={18} />
                    <span className="text-[10px]">Add Box</span>
                  </button>
                  <button 
                    onClick={addImageAnnotation}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm"
                  >
                    <ImageIcon size={18} />
                    <span className="text-[10px]">Add Image</span>
                  </button>
                </div>

                {selectedAnnotationId && (
                  <div className="p-4 bg-white rounded-xl border border-brand-400/30 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-brand-600 uppercase">Edit Selected</span>
                      <button 
                        onClick={() => removeAnnotation(selectedAnnotationId)}
                        className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Text Content</label>
                          <textarea 
                            value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.text || ''}
                            onChange={(e) => updateAnnotation(selectedAnnotationId, { text: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-900 outline-none focus:border-brand-400 transition-colors resize-none"
                            rows={2}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Color</label>
                        <div className="flex gap-2">
                          {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(c => (
                            <button
                              key={c}
                              onClick={() => updateAnnotation(selectedAnnotationId, { color: c })}
                              className={clsx(
                                "w-5 h-5 rounded-full border border-gray-200",
                                editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.color === c && "ring-2 ring-brand-400"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Font Size</label>
                          <input 
                            type="range"
                            min={12}
                            max={72}
                            value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontSize || 24}
                            onChange={(e) => updateAnnotation(selectedAnnotationId, { fontSize: Number(e.target.value) })}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-400"
                          />
                        </div>
                      )}

                      {(editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'rect' || editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'image') && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Width</label>
                            <input 
                              type="range"
                              min={1}
                              max={100}
                              value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.width || 10}
                              onChange={(e) => updateAnnotation(selectedAnnotationId, { width: Number(e.target.value) })}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Height</label>
                            <input 
                              type="range"
                              min={1}
                              max={100}
                              value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.height || 10}
                              onChange={(e) => updateAnnotation(selectedAnnotationId, { height: Number(e.target.value) })}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ADJUST SECTION */}
              <div className="space-y-6 border-t border-gray-100 pt-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjust</label>
                
                <div className="space-y-4">
                  {[
                    { label: 'Brightness', key: 'brightness' as const },
                  ].map((adj) => (
                    <div key={adj.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-400">{adj.label}</label>
                        <span className="text-[10px] text-gray-500">{editedPage.adjustments[adj.key]}%</span>
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={editedPage.adjustments[adj.key]}
                        onChange={(e) => handleAdjustment(adj.key, Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-widest font-bold">Filters</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Original', value: 'none' },
                      { label: 'Grayscale', value: 'grayscale' },
                      { label: 'Punch', value: 'punch' },
                      { label: 'Golden', value: 'golden' },
                      { label: 'Radiate', value: 'radiate' },
                      { label: 'Warm Contrast', value: 'warm-contrast' },
                      { label: 'Calm', value: 'calm' },
                      { label: 'Cool Light', value: 'cool-light' },
                      { label: 'Vivid Cool', value: 'vivid-cool' },
                      { label: 'Dramatic Cool', value: 'dramatic-cool' },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => handleFilter(f.value as any)}
                        className={clsx(
                          "px-3 py-2 text-[10px] font-bold rounded-lg border transition-all",
                          editedPage.filter === f.value || (!editedPage.filter && f.value === 'none')
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Sidebar */}
            <div className="p-6 border-t border-gray-100 space-y-3">
              <button 
                onClick={() => onSave(editedPage)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-600/20"
              >
                <Check size={18} />
                Save & Close
              </button>
              <button 
                onClick={() => onDelete(page.id)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-100"
              >
                <Trash2 size={18} />
                Delete Page
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
