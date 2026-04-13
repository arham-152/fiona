import React from 'react';
import { motion } from 'motion/react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Trash2, ZoomIn, ZoomOut, RotateCcw, RotateCw, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PageItem, Annotation } from '../../types';
import { IconButton } from '../ui/IconButton';

interface EditorCanvasProps {
  editedPage: PageItem;
  imgRef: React.RefObject<HTMLImageElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isCropping: boolean;
  setIsCropping: (cropping: boolean) => void;
  crop?: Crop;
  setCrop: (crop?: Crop) => void;
  completedCrop?: PixelCrop;
  setCompletedCrop: (crop?: PixelCrop) => void;
  zoom: number;
  handleZoom: (dir: 'in' | 'out') => void;
  handleRotate: (dir: 'left' | 'right') => void;
  handleSmartSuggest: () => void;
  handleApplyCrop: () => void;
  isDetecting: boolean;
  isApplying: boolean;
  aspect?: number;
  showGrid: boolean;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  filterStyle: React.CSSProperties;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  editingAnnotationId: string | null;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  commitAnnotationChange: () => void;
  removeAnnotation: (id: string) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  editedPage,
  imgRef,
  containerRef,
  isCropping,
  setIsCropping,
  crop,
  setCrop,
  completedCrop,
  setCompletedCrop,
  zoom,
  handleZoom,
  handleRotate,
  handleSmartSuggest,
  handleApplyCrop,
  isDetecting,
  isApplying,
  aspect,
  showGrid,
  onImageLoad,
  filterStyle,
  selectedAnnotationId,
  setSelectedAnnotationId,
  editingAnnotationId,
  updateAnnotation,
  commitAnnotationChange,
  removeAnnotation,
}) => {
  return (
    <div className={clsx(
      "shrink-0 lg:flex-1 relative bg-slate-50 dark:bg-dark-bg flex items-center justify-center group p-4 sm:p-8 min-h-[45vh] lg:min-h-0",
      isCropping ? "overflow-hidden bg-zinc-950" : "lg:overflow-auto custom-scrollbar"
    )}>
      {isCropping ? (
        <div className="relative w-full h-full flex flex-col bg-zinc-900 overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl">
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
                onComplete={c => setCompletedCrop(c)}
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
          
          <div className="w-full bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <ZoomIn size={14} strokeWidth={3} />
                  ZOOM & ALIGNMENT
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-zinc-800/50 rounded-2xl p-1.5 border border-zinc-700/50">
                    <IconButton 
                      icon={<ZoomOut size={20} strokeWidth={2.5} />}
                      variant="ghost"
                      onClick={() => handleZoom('out')}
                      className="text-zinc-300 hover:bg-zinc-700"
                    />
                    <div className="w-px h-6 bg-zinc-700 mx-1.5" />
                    <IconButton 
                      icon={<ZoomIn size={20} strokeWidth={2.5} />}
                      variant="ghost"
                      onClick={() => handleZoom('in')}
                      className="text-zinc-300 hover:bg-zinc-700"
                    />
                  </div>
                  <div className="w-px h-8 bg-zinc-800 mx-1" />
                  <IconButton 
                    icon={<RotateCcw size={20} strokeWidth={2.5} />}
                    variant="secondary"
                    onClick={() => handleRotate('left')}
                    className="bg-zinc-800/50 hover:bg-zinc-800 text-brand-400 border-brand-500/20"
                  />
                  <IconButton 
                    icon={<RotateCw size={20} strokeWidth={2.5} />}
                    variant="secondary"
                    onClick={() => handleRotate('right')}
                    className="bg-zinc-800/50 hover:bg-zinc-800 text-brand-400 border-brand-500/20"
                  />
                </div>
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
                {isApplying ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                {isApplying ? 'APPLYING...' : 'APPLY'}
              </motion.button>
              <IconButton 
                icon={<X size={24} strokeWidth={2.5} />}
                variant="secondary"
                onClick={() => setIsCropping(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700"
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
          ref={containerRef}
          onClick={() => setSelectedAnnotationId(null)}
        >
          <div 
            className="relative transition-transform duration-500 ease-out flex items-center justify-center group"
            style={{ 
              transform: `rotate(${editedPage.rotation}deg)`,
              width: '100%',
              height: '100%',
            }}
          >
            <img
              src={editedPage.dataUrl}
              alt="Editor Preview"
              className="shadow-2xl object-contain transition-all rounded-lg max-w-full max-h-full"
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
                      className="whitespace-nowrap px-2 py-1 select-none leading-tight"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const newText = prompt('Enter text:', anno.text);
                        if (newText !== null) {
                          updateAnnotation(anno.id, { text: newText });
                          commitAnnotationChange();
                        }
                      }}
                    >
                      {anno.text}
                    </div>
                  )}
                  {anno.type === 'image' && (
                    <img src={anno.image} alt="Annotation" className="w-full h-full object-contain pointer-events-none" />
                  )}
                  
                  {selectedAnnotationId === anno.id && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 glass rounded-xl shadow-xl z-50">
                      <IconButton 
                        icon={<Trash2 size={14} />}
                        variant="danger"
                        size="sm"
                        onClick={() => removeAnnotation(anno.id)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

