import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { 
  X, RotateCcw, RotateCw, 
  Check, Trash2, Sparkles, ChevronLeft, ChevronRight,
  Crop as CropIcon, Undo2, Redo2, Type, Square, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut, Maximize2, Sliders, Palette, Layers
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
      const last = next[next.length - 1];
      if (last && last.x === newCrop.x && last.y === newCrop.y && last.width === newCrop.width && last.height === newCrop.height) {
        return prev;
      }
      const updated = [...next, newCrop];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

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
      return updated;
    });
  };

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
            rotation: 0,
            adjustments: { brightness: 100, contrast: 100, saturation: 100 }
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
      const subject = await detectSubject(imgRef.current);
      if (subject) {
        const { width, height } = imgRef.current;
        const newCrop = getSmartCropFromSubject(subject.bbox, width, height);
        setCrop(newCrop);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/95 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-7xl h-full sm:h-[90vh] bg-white dark:bg-saas-bg-dark rounded-none sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-saas-border-dark"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-saas-border-dark bg-white dark:bg-saas-card-dark">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={onPrev}
                disabled={isFirst}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 disabled:opacity-30 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Page {page.pageNumber}
              </div>
              <button 
                onClick={onNext}
                disabled={isLast}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 disabled:opacity-30 rounded-xl transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button 
                onClick={undo}
                disabled={currentIndex <= 0}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded-lg transition-all shadow-sm"
              >
                <Undo2 size={18} />
              </button>
              <button 
                onClick={redo}
                disabled={currentIndex >= history.length - 1}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded-lg transition-all shadow-sm"
              >
                <Redo2 size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Reset
            </button>
            <button 
              onClick={() => onSave(editedPage)}
              className="flex items-center gap-2 px-6 py-2.5 bg-saas-accent-light dark:bg-saas-accent-dark text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-saas-accent-light/20 dark:shadow-saas-accent-dark/20 hover:brightness-110 transition-all"
            >
              <Check size={18} />
              Save Changes
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-saas-bg-dark">
          {/* Main Canvas */}
          <div className="flex-1 relative flex items-center justify-center p-8 overflow-auto custom-scrollbar">
            <div 
              ref={containerRef}
              className="relative shadow-2xl bg-white dark:bg-slate-900 transition-transform duration-500"
              style={{ transform: `rotate(${editedPage.rotation}deg)` }}
            >
              <img
                ref={imgRef}
                src={editedPage.dataUrl}
                alt="Editor Preview"
                className="max-w-full max-h-[70vh] object-contain"
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
              
              {/* Annotations */}
              <div className="absolute inset-0 pointer-events-none">
                {editedPage.annotations?.map((anno) => (
                  <div
                    key={anno.id}
                    className={clsx(
                      "absolute pointer-events-auto group",
                      selectedAnnotationId === anno.id && "ring-2 ring-saas-accent-light dark:ring-saas-accent-dark ring-offset-2 dark:ring-offset-slate-900"
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
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(anno.id);
                    }}
                  >
                    {anno.type === 'text' && (
                      <div className="whitespace-nowrap px-2 py-1">{anno.text}</div>
                    )}
                    {anno.type === 'image' && anno.image && (
                      <img src={anno.image} alt="Annotation" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Tools */}
          <aside className="w-80 border-l border-slate-100 dark:border-saas-border-dark bg-white dark:bg-saas-card-dark p-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-10">
              {/* Transform Tools */}
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Maximize2 size={12} />
                  Transform
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleRotate('left')}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-saas-accent-light/10 dark:hover:bg-saas-accent-dark/10 text-slate-600 dark:text-slate-300 hover:text-saas-accent-light dark:hover:text-saas-accent-dark transition-all border border-transparent hover:border-saas-accent-light/20 dark:hover:border-saas-accent-dark/20"
                  >
                    <RotateCcw size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rotate L</span>
                  </button>
                  <button 
                    onClick={() => handleRotate('right')}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-saas-accent-light/10 dark:hover:bg-saas-accent-dark/10 text-slate-600 dark:text-slate-300 hover:text-saas-accent-light dark:hover:text-saas-accent-dark transition-all border border-transparent hover:border-saas-accent-light/20 dark:hover:border-saas-accent-dark/20"
                  >
                    <RotateCw size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rotate R</span>
                  </button>
                  <button 
                    onClick={() => setIsCropping(true)}
                    className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900 dark:bg-saas-accent-dark text-white hover:brightness-110 transition-all shadow-lg shadow-slate-900/10 dark:shadow-saas-accent-dark/20"
                  >
                    <CropIcon size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">Crop & Resize</span>
                  </button>
                </div>
              </section>

              {/* Adjustments */}
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Sliders size={12} />
                  Adjustments
                </h4>
                <div className="space-y-6">
                  {[
                    { label: 'Brightness', key: 'brightness' as const },
                    { label: 'Contrast', key: 'contrast' as const },
                    { label: 'Saturation', key: 'saturation' as const }
                  ].map((adj) => (
                    <div key={adj.key} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{adj.label}</span>
                        <span className="text-[10px] font-bold text-saas-accent-light dark:text-saas-accent-dark">{editedPage.adjustments[adj.key]}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={editedPage.adjustments[adj.key]}
                        onChange={(e) => handleAdjustment(adj.key, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-saas-accent-light dark:accent-saas-accent-dark"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Filters */}
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Palette size={12} />
                  Filters
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {['none', 'grayscale', 'punch', 'golden', 'radiate', 'warm-contrast', 'calm', 'cool-light', 'vivid-cool'].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFilter(f as any)}
                      className={clsx(
                        "px-2 py-3 rounded-xl text-[9px] font-bold uppercase tracking-tighter transition-all border",
                        editedPage.filter === f 
                          ? "bg-saas-accent-light dark:bg-saas-accent-dark text-white border-saas-accent-light dark:border-saas-accent-dark shadow-lg shadow-saas-accent-light/20" 
                          : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {f.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </section>

              {/* Annotations */}
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Layers size={12} />
                  Annotations
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={addTextAnnotation} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-saas-accent-light transition-all border border-transparent hover:border-saas-accent-light/20">
                    <Type size={18} />
                    <span className="text-[8px] font-bold uppercase">Text</span>
                  </button>
                  <button onClick={addRectAnnotation} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-saas-accent-light transition-all border border-transparent hover:border-saas-accent-light/20">
                    <Square size={18} />
                    <span className="text-[8px] font-bold uppercase">Shape</span>
                  </button>
                  <button onClick={addImageAnnotation} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-saas-accent-light transition-all border border-transparent hover:border-saas-accent-light/20">
                    <ImageIcon size={18} />
                    <span className="text-[8px] font-bold uppercase">Image</span>
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </motion.div>

      {/* Crop Overlay */}
      <AnimatePresence>
        {isCropping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-zinc-950 flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto custom-scrollbar">
              <div style={{ width: `${100 * zoom}%`, transition: 'width 0.2s ease-out' }}>
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspect}
                  ruleOfThirds={showGrid}
                >
                  <img
                    ref={imgRef}
                    src={editedPage.dataUrl}
                    alt="Crop Preview"
                    onLoad={onImageLoad}
                    className="w-full h-auto"
                    style={{ 
                      transform: `rotate(${editedPage.rotation}deg)`,
                      filter: `brightness(${editedPage.adjustments.brightness}%) contrast(${editedPage.adjustments.contrast}%) saturate(${editedPage.adjustments.saturation}%)`
                    }}
                  />
                </ReactCrop>
              </div>
            </div>
            
            <div className="bg-zinc-900 border-t border-zinc-800 p-8 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 bg-zinc-800 rounded-xl p-1">
                  <button onClick={() => handleZoom('out')} className="p-3 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-all"><ZoomOut size={20} /></button>
                  <button onClick={() => handleZoom('in')} className="p-3 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-all"><ZoomIn size={20} /></button>
                </div>
                <button 
                  onClick={handleSmartSuggest}
                  disabled={isDetecting}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-emerald-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-emerald-500/20"
                >
                  <Sparkles size={18} className={isDetecting ? "animate-spin" : ""} />
                  AI Auto Crop
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCropping(false)} className="px-6 py-3 text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button>
                <button onClick={handleApplyCrop} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all">
                  <Check size={18} />
                  Apply Crop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
