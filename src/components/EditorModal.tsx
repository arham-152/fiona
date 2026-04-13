import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { 
  X, RotateCcw, RotateCw, 
  Check, Trash2, Sparkles, ChevronLeft, ChevronRight,
  RefreshCcw, Crop as CropIcon, Undo2, Redo2, Type, Square, FileText, Image as ImageIcon,
  ZoomIn, ZoomOut, Loader2
} from 'lucide-react';
import { PageItem, Annotation } from '../types';
import { clsx } from 'clsx';
import { getCroppedImg, rotateSize, getAutoTrimCrop } from '../lib/crop-utils';
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
  const [logoError, setLogoError] = useState(false);
  const [editedPage, setEditedPage] = useState<PageItem>({ 
    ...page,
    annotations: page.annotations || []
  });
  
  // General History for Undo/Redo
  const [history, setHistory] = useState<PageItem[]>([{ ...page, annotations: page.annotations || [] }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback((newPage: PageItem) => {
    setHistory(prev => {
      const last = prev[currentIndex];
      
      // Efficiently check if anything meaningful changed
      // We compare specific fields instead of the whole object with JSON.stringify
      const hasChanged = !last || 
        last.dataUrl !== newPage.dataUrl || 
        last.rotation !== newPage.rotation || 
        last.filter !== newPage.filter ||
        JSON.stringify(last.adjustments) !== JSON.stringify(newPage.adjustments) ||
        last.annotations?.length !== newPage.annotations?.length ||
        (last.annotations && newPage.annotations && JSON.stringify(last.annotations) !== JSON.stringify(newPage.annotations));

      if (!hasChanged) return prev;

      const next = prev.slice(0, currentIndex + 1);
      const updated = [...next, newPage];
      
      // Limit history to 20 steps to save memory
      const limited = updated.length > 20 ? updated.slice(updated.length - 20) : updated;
      setCurrentIndex(limited.length - 1);
      return limited;
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
  const [isApplying, setIsApplying] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  // Memoize the filter string to avoid re-calculating it on every render
  const filterStyle = React.useMemo(() => ({
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
    }`,
    transform: `rotate(${editedPage.rotation}deg)`,
    transformOrigin: 'center center',
  }), [editedPage.adjustments, editedPage.filter, editedPage.rotation]);

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
    if (currentIndex === -1) return; // Skip initial
    const timer = setTimeout(() => {
      addToHistory(editedPage);
    }, 800); // Increased debounce for better performance
    return () => clearTimeout(timer);
  }, [editedPage.adjustments, editedPage.filter, editedPage.rotation]);

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
    if (!completedCrop || !imgRef.current || isApplying) return;
    setIsApplying(true);
    
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
            adjustments: { brightness: 100, contrast: 100, saturation: 100 }, // Reset adjustments as they are baked in
            isEdited: true
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
    } finally {
      setIsApplying(false);
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
      // 1. Try Instant Local Trim (Fastest, handles white borders perfectly)
      const trimCrop = await getAutoTrimCrop(editedPage.dataUrl);
      if (trimCrop) {
        const { width, height } = imgRef.current;
        const scaleX = width / imgRef.current.naturalWidth;
        const scaleY = height / imgRef.current.naturalHeight;

        const newCrop: Crop = {
          unit: '%',
          x: (trimCrop.x / imgRef.current.naturalWidth) * 100,
          y: (trimCrop.y / imgRef.current.naturalHeight) * 100,
          width: (trimCrop.width / imgRef.current.naturalWidth) * 100,
          height: (trimCrop.height / imgRef.current.naturalHeight) * 100
        };
        
        setCrop(newCrop);
        setCompletedCrop({
          unit: 'px',
          x: trimCrop.x * scaleX,
          y: trimCrop.y * scaleY,
          width: trimCrop.width * scaleX,
          height: trimCrop.height * scaleY
        });
        setIsDetecting(false);
        return;
      }

      // 2. Try Local Object Detection (TensorFlow.js)
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-7xl h-full sm:h-[95vh] bg-white dark:bg-dark-card rounded-none sm:rounded-[48px] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-dark-border"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-dark-border glass relative z-10">
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-dark-card rounded-2xl overflow-hidden border border-slate-100 dark:border-dark-border shadow-lg"
            >
              {logoError ? (
                <div className="text-brand-600 dark:text-brand-500 font-black text-xs tracking-tighter">DOC</div>
              ) : (
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </motion.div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Edit Page {page.pageNumber}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Professional Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center glass rounded-2xl p-1.5 shadow-inner">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={undo}
                disabled={currentIndex <= 0}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-section text-slate-700 dark:text-slate-200 disabled:text-slate-300 dark:disabled:text-slate-700 disabled:hover:bg-transparent rounded-xl transition-all"
                title="Undo"
              >
                <Undo2 size={20} strokeWidth={2.5} />
              </motion.button>
              <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-1.5" />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={redo}
                disabled={currentIndex >= history.length - 1}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-section text-slate-700 dark:text-slate-200 disabled:text-slate-300 dark:disabled:text-slate-700 disabled:hover:bg-transparent rounded-xl transition-all"
                title="Redo"
              >
                <Redo2 size={20} strokeWidth={2.5} />
              </motion.button>
            </div>
            
            <div className="w-px h-8 bg-slate-200 dark:bg-dark-border mx-2 hidden sm:block" />

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border"
            >
              RESET
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3 hover:bg-slate-100 dark:hover:bg-dark-section text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-2xl transition-all"
            >
              <X size={28} strokeWidth={2.5} />
            </motion.button>
          </div>
        </header>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar bg-slate-50 dark:bg-dark-bg">
          {/* Left: Image Preview / Cropper */}
          <div className={clsx(
            "shrink-0 lg:flex-1 relative bg-slate-50 dark:bg-dark-bg flex items-center justify-center group p-4 sm:p-8 min-h-[45vh] lg:min-h-0",
            isCropping ? "overflow-hidden bg-zinc-950" : "lg:overflow-auto custom-scrollbar"
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
                      className="shadow-2xl rounded-lg overflow-hidden"
                    >
                      <img
                        ref={imgRef}
                        src={editedPage.dataUrl}
                        alt="Crop Preview"
                        onLoad={onImageLoad}
                        className="w-full h-auto block"
                        style={filterStyle}
                      />
                    </ReactCrop>
                  </div>
                </div>
                
                {/* Crop Tool Bottom Bar */}
                <div className="w-full bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2.5">
                        <ZoomIn size={14} strokeWidth={3} />
                        ZOOM & ALIGNMENT
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-zinc-800/50 rounded-2xl p-1.5 border border-zinc-700/50">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleZoom('out')}
                            className="p-2.5 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                            title="Zoom Out"
                          >
                            <ZoomOut size={20} strokeWidth={2.5} />
                          </motion.button>
                          <div className="w-px h-6 bg-zinc-700 mx-1.5" />
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleZoom('in')}
                            className="p-2.5 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                            title="Zoom In"
                          >
                            <ZoomIn size={20} strokeWidth={2.5} />
                          </motion.button>
                        </div>
                        <div className="w-px h-8 bg-zinc-800 mx-1" />
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: -45 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRotate('left')}
                          className="p-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-brand-400 rounded-xl transition-all border border-brand-500/20"
                          title="Rotate Left"
                        >
                          <RotateCcw size={20} strokeWidth={2.5} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: 45 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRotate('right')}
                          className="p-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-brand-400 rounded-xl transition-all border border-brand-500/20"
                          title="Rotate Right"
                        >
                          <RotateCw size={20} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </div>

                  <div className="flex items-center gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSmartSuggest}
                      disabled={isDetecting}
                      className={clsx(
                        "flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border shadow-2xl",
                        isDetecting 
                          ? "bg-zinc-800 text-zinc-500 border-zinc-700" 
                          : "bg-gradient-to-r from-brand-600 to-cyan-500 text-white border-white/20 glow-accent"
                      )}
                    >
                      <Sparkles size={18} className={isDetecting ? "animate-spin" : ""} strokeWidth={2.5} />
                      {isDetecting ? 'Detecting...' : 'AI Auto Crop'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleApplyCrop}
                      disabled={isApplying}
                      className={clsx(
                        "flex items-center gap-3 px-10 py-3.5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all border",
                        isApplying 
                          ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                          : "bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50 shadow-emerald-600/30"
                      )}
                    >
                      {isApplying ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Check size={20} strokeWidth={3} />
                      )}
                      {isApplying ? 'APPLYING...' : 'APPLY'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsCropping(false)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl transition-all border border-zinc-700"
                    >
                      <X size={24} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div
                key={editedPage.id + editedPage.rotation + editedPage.dataUrl}
                className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
                ref={containerRef}
                onClick={() => setSelectedAnnotationId(null)}
              >
                  <div 
                    className="relative transition-transform duration-500 ease-out flex items-center justify-center group"
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
                        "shadow-2xl object-contain transition-all rounded-lg",
                        isFitToScreen ? "max-w-full max-h-full" : "w-auto h-auto"
                      )}
                      style={{ filter: filterStyle.filter }}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Annotations Layer */}
                    <div className="absolute inset-0 pointer-events-none">
                      {editedPage.annotations?.map((anno) => (
                        <div
                          key={anno.id}
                          className={clsx(
                            "absolute pointer-events-auto group/anno",
                            editingAnnotationId !== anno.id && "cursor-move",
                            selectedAnnotationId === anno.id && "ring-2 ring-brand-500 ring-offset-4 ring-offset-white dark:ring-offset-dark-card"
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
                            zIndex: selectedAnnotationId === anno.id ? 30 : 20,
                            borderRadius: anno.type === 'rect' ? '4px' : '0'
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
              <motion.button 
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPrev}
                className="absolute left-8 p-5 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl text-slate-700 dark:text-slate-200 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 shadow-2xl border border-white/20 dark:border-dark-border"
              >
                <ChevronLeft size={28} strokeWidth={2.5} />
              </motion.button>
            )}
            {!isLast && !isCropping && (
              <motion.button 
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onNext}
                className="absolute right-8 p-5 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl text-slate-700 dark:text-slate-200 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 shadow-2xl border border-white/20 dark:border-dark-border"
              >
                <ChevronRight size={28} strokeWidth={2.5} />
              </motion.button>
            )}
            
            {!isCropping && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                <div className="px-6 py-2.5 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-full border border-slate-200 dark:border-dark-border text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 shadow-2xl">
                  {editedPage.rotation}° rotation
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar Controls - Unified Frame */}
          <aside className="shrink-0 lg:flex-none lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col lg:overflow-hidden shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.05)]">
            <div className="flex-1 p-8 sm:p-10 space-y-10 lg:overflow-y-auto custom-scrollbar">
              {/* TRANSFORM SECTION */}
              <div className="space-y-5">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transform</label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRotate('left')}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-dark-section/50 hover:bg-white dark:hover:bg-dark-card text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <RotateCcw size={20} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Left 90°</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRotate('right')}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-dark-section/50 hover:bg-white dark:hover:bg-dark-card text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <RotateCw size={20} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Right 90°</span>
                  </motion.button>
                </div>
              </div>

              {/* CROP SECTION */}
              <div className="space-y-5 border-t border-slate-100 dark:border-dark-border pt-8">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Crop</label>
                
                {!isCropping ? (
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsCropping(true);
                      setCropHistory([]);
                      setHistoryIndex(-1);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-section text-slate-700 dark:text-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <CropIcon size={18} strokeWidth={2.5} />
                    Enter Crop Mode
                  </motion.button>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-dark-section/50 rounded-2xl border border-slate-100 dark:border-dark-border">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium leading-relaxed">Use the handles on the image to adjust the crop area.</p>
                  </div>
                )}
              </div>

              {/* ANNOTATE SECTION */}
              <div className="space-y-5 border-t border-slate-100 dark:border-dark-border pt-8">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Annotate</label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addTextAnnotation}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-dark-section/50 hover:bg-white dark:hover:bg-dark-card text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <Type size={20} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Text</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addRectAnnotation}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-dark-section/50 hover:bg-white dark:hover:bg-dark-card text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <Square size={20} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Box</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addImageAnnotation}
                    className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-dark-section/50 hover:bg-white dark:hover:bg-dark-card text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-xl"
                  >
                    <ImageIcon size={20} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Image</span>
                  </motion.button>
                </div>

                {selectedAnnotationId && (
                  <div className="p-6 bg-white dark:bg-dark-section/50 rounded-2xl border border-brand-400/30 dark:border-brand-500/20 space-y-6 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Edit Selected</span>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeAnnotation(selectedAnnotationId)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </motion.button>
                    </div>

                    <div className="space-y-5">
                      {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Text Content</label>
                          <textarea 
                            value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.text || ''}
                            onChange={(e) => updateAnnotation(selectedAnnotationId, { text: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-brand-400 transition-all resize-none shadow-inner"
                            rows={2}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Color</label>
                        <div className="flex flex-wrap gap-2.5">
                          {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#6366F1', '#22D3EE'].map(c => (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              key={c}
                              onClick={() => updateAnnotation(selectedAnnotationId, { color: c })}
                              className={clsx(
                                "w-6 h-6 rounded-full border-2 border-white dark:border-dark-card shadow-lg transition-all",
                                editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.color === c ? "ring-2 ring-brand-500 scale-110" : "hover:scale-110"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Font Size</label>
                            <span className="text-[10px] font-black text-brand-500">{editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontSize || 24}px</span>
                          </div>
                          <input 
                            type="range"
                            min={12}
                            max={72}
                            value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontSize || 24}
                            onChange={(e) => updateAnnotation(selectedAnnotationId, { fontSize: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-100 dark:bg-dark-section rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                        </div>
                      )}

                      {(editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'rect' || editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'image') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Width</label>
                            <input 
                              type="range"
                              min={1}
                              max={100}
                              value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.width || 10}
                              onChange={(e) => updateAnnotation(selectedAnnotationId, { width: Number(e.target.value) })}
                              className="w-full h-1.5 bg-slate-100 dark:bg-dark-section rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Height</label>
                            <input 
                              type="range"
                              min={1}
                              max={100}
                              value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.height || 10}
                              onChange={(e) => updateAnnotation(selectedAnnotationId, { height: Number(e.target.value) })}
                              className="w-full h-1.5 bg-slate-100 dark:bg-dark-section rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ADJUST SECTION */}
              <div className="space-y-8 border-t border-slate-100 dark:border-dark-border pt-8">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Adjust</label>
                
                <div className="space-y-6">
                  {[
                    { label: 'Brightness', key: 'brightness' as const },
                  ].map((adj) => (
                    <div key={adj.key} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{adj.label}</label>
                        <span className="text-[10px] font-black text-brand-500">{editedPage.adjustments[adj.key]}%</span>
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={editedPage.adjustments[adj.key]}
                        onChange={(e) => handleAdjustment(adj.key, Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-dark-section rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Filters</label>
                  <div className="grid grid-cols-2 gap-3">
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
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        key={f.value}
                        onClick={() => handleFilter(f.value as any)}
                        className={clsx(
                          "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                          editedPage.filter === f.value || (!editedPage.filter && f.value === 'none')
                            ? "bg-brand-600 text-white border-brand-400 shadow-lg shadow-brand-600/20" 
                            : "bg-slate-50 dark:bg-dark-section/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card"
                        )}
                      >
                        {f.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Sidebar */}
            <div className="p-8 border-t border-slate-100 dark:border-dark-border space-y-4 bg-slate-50/50 dark:bg-dark-section/30">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSave(editedPage)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-600/20"
              >
                <Check size={20} strokeWidth={2.5} />
                Save & Close
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDelete(page.id)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-dark-card hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-dark-border"
              >
                <Trash2 size={20} strokeWidth={2.5} />
                Delete Page
              </motion.button>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};
