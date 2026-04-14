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
              className="flex items-center justify-center"
              style={{ 
                width: `${100 * zoom}%`,
                maxWidth: '100%',
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
                  className="max-w-full max-h-[70vh] lg:max-h-[80vh] w-auto h-auto block object-contain"
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
            }}
          >
            <img
              src={editedPage.dataUrl}
              alt="Editor Preview"
              className="shadow-2xl transition-all rounded-lg max-w-full max-h-[70vh] lg:max-h-[80vh] object-contain block"
              style={{ filter: filterStyle.filter }}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                // Trigger a re-render to ensure annotation layer matches image bounds
                const img = e.currentTarget;
                if (imgRef.current !== img) {
                  // @ts-ignore
                  imgRef.current = img;
                }
              }}
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
                    width: (anno.type === 'rect' || anno.type === 'image' || anno.type === 'text') ? `${anno.width}%` : 'auto',
                    height: (anno.type === 'rect' || anno.type === 'image' || anno.type === 'text') ? `${anno.height}%` : 'auto',
                    backgroundColor: anno.type === 'rect' ? anno.color : 'transparent',
                    color: anno.type === 'text' ? anno.color : 'inherit',
                    fontSize: anno.type === 'text' ? `${anno.fontSize}px` : 'inherit',
                    fontWeight: anno.type === 'text' ? (anno.fontWeight || 'bold') : 'normal',
                    fontFamily: anno.type === 'text' ? (anno.fontFamily || 'sans-serif') : 'inherit',
                    zIndex: selectedAnnotationId === anno.id ? 30 : 20,
                    borderRadius: anno.type === 'rect' ? '4px' : '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(anno.id);
                  }}
                  onMouseDown={(e) => {
                    if (selectedAnnotationId !== anno.id || editingAnnotationId === anno.id) return;
                    
                    // Check if clicking a resize handle
                    const target = e.target as HTMLElement;
                    const isHandle = target.dataset.handle;
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialX = anno.x;
                    const initialY = anno.y;
                    const initialWidth = anno.width || 0;
                    const initialHeight = anno.height || 0;
                    
                    const rotationRad = (editedPage.rotation * Math.PI) / 180;
                    let hasMoved = false;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      // Use imgRef to get the actual displayed dimensions of the page
                      const img = imgRef.current;
                      if (!img) return;
                      
                      const rawDx = moveEvent.clientX - startX;
                      const rawDy = moveEvent.clientY - startY;
                      
                      // Rotate delta back to match image rotation
                      const dx = (rawDx * Math.cos(-rotationRad) - rawDy * Math.sin(-rotationRad)) / img.clientWidth * 100;
                      const dy = (rawDx * Math.sin(-rotationRad) + rawDy * Math.cos(-rotationRad)) / img.clientHeight * 100;
                      
                      if (isHandle) {
                        const updates: Partial<Annotation> = {};
                        let newWidth = initialWidth;
                        let newHeight = initialHeight;
                        let newX = initialX;
                        let newY = initialY;

                        if (isHandle.includes('right')) newWidth = initialWidth + dx;
                        if (isHandle.includes('bottom')) newHeight = initialHeight + dy;
                        if (isHandle.includes('left')) {
                          newWidth = initialWidth - dx;
                          newX = initialX + (initialWidth - newWidth);
                        }
                        if (isHandle.includes('top')) {
                          newHeight = initialHeight - dy;
                          newY = initialY + (initialHeight - newHeight);
                        }

                        updates.width = Math.max(2, newWidth);
                        updates.height = Math.max(2, newHeight);
                        updates.x = Math.max(0, Math.min(100, newX));
                        updates.y = Math.max(0, Math.min(100, newY));
                        
                        // Scale font size for text if height changes significantly
                        if (anno.type === 'text' && anno.fontSize) {
                          const scale = newHeight / initialHeight;
                          if (Math.abs(1 - scale) > 0.01) {
                            updates.fontSize = Math.max(8, Math.round(anno.fontSize * scale));
                          }
                        }
                        
                        updateAnnotation(anno.id, updates);
                      } else {
                        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                          hasMoved = true;
                          updateAnnotation(anno.id, {
                            x: Math.max(0, Math.min(100, initialX + dx)),
                            y: Math.max(0, Math.min(100, initialY + dy))
                          });
                        }
                      }
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      commitAnnotationChange();
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                >
                  {anno.type === 'text' && (
                    <div 
                      className="w-full h-full flex items-center justify-center select-none leading-none text-center overflow-hidden"
                    >
                      {anno.text}
                    </div>
                  )}
                  {anno.type === 'image' && (
                    <img src={anno.image} alt="Annotation" className="w-full h-full block pointer-events-none" />
                  )}
                  
                  {selectedAnnotationId === anno.id && (
                    <>
                      {/* Resize Handles */}
                      {(anno.type === 'rect' || anno.type === 'image' || anno.type === 'text') && (
                        <>
                          <div data-handle="top-left" className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nwse-resize z-50" />
                          <div data-handle="top-right" className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nesw-resize z-50" />
                          <div data-handle="bottom-left" className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nesw-resize z-50" />
                          <div data-handle="bottom-right" className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-brand-500 rounded-full cursor-nwse-resize z-50" />
                          
                          <div data-handle="top" className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-brand-500 rounded-full cursor-ns-resize z-50" />
                          <div data-handle="left" className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1.5 h-6 bg-brand-500 rounded-full cursor-ew-resize z-50" />
                          <div data-handle="right" className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-1.5 h-6 bg-brand-500 rounded-full cursor-ew-resize z-50" />
                          <div data-handle="bottom" className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-6 h-1.5 bg-brand-500 rounded-full cursor-ns-resize z-50" />
                        </>
                      )}

                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 glass rounded-xl shadow-xl z-50 pointer-events-auto">
                        <IconButton 
                          icon={<Trash2 size={14} />}
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAnnotation(anno.id);
                          }}
                        />
                      </div>
                    </>
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

