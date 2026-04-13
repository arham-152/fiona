import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem } from '../types';
import { ArrowUpRight, RotateCw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface PageCardProps {
  page: PageItem;
  onEdit: (page: PageItem) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
}

export const PageCard: React.FC<PageCardProps> = React.memo(({ page, onEdit, onDelete, onRotate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: page.color }}
      onDoubleClick={() => onEdit(page)}
      className={clsx(
        "group relative aspect-[3/4] bg-white dark:bg-dark-card rounded-[40px] overflow-hidden border-[6px] transition-all duration-300 cursor-pointer shadow-sm",
        isDragging 
          ? "opacity-50 scale-105 border-brand-500 glow-accent" 
          : "hover:scale-[1.03] hover:-translate-y-1 hover:border-brand-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      )}
    >
      {/* Image Container */}
      <div 
        {...attributes} 
        {...listeners}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative bg-slate-50 dark:bg-dark-section"
      >
        <div 
          className="w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        >
          <img
            src={page.dataUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-cover"
            loading="lazy"
            style={{ 
              filter: `brightness(${page.adjustments.brightness}%) contrast(${page.adjustments.contrast}%) saturate(${page.adjustments.saturation}%) ${
                page.filter === 'grayscale' ? 'grayscale(100%)' : 
                page.filter === 'punch' ? 'contrast(120%) saturate(120%)' :
                page.filter === 'golden' ? 'sepia(30%) saturate(140%) brightness(110%)' :
                page.filter === 'radiate' ? 'brightness(115%) saturate(130%)' :
                page.filter === 'warm-contrast' ? 'sepia(10%) contrast(110%) saturate(110%)' :
                page.filter === 'calm' ? 'saturate(80%) brightness(105%)' :
                page.filter === 'cool-light' ? 'hue-rotate(10deg) saturate(90%) brightness(110%)' :
                page.filter === 'vivid-cool' ? 'saturate(140%) hue-rotate(10deg)' :
                page.filter === 'dramatic-cool' ? 'contrast(130%) hue-rotate(20deg) saturate(80%)' : ''
              }`
            }}
            referrerPolicy="no-referrer"
          />
          
          {/* Annotations Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {page.annotations?.map((anno) => (
              <div
                key={anno.id}
                className="absolute"
                style={{
                  left: `${anno.x}%`,
                  top: `${anno.y}%`,
                  width: anno.type === 'rect' ? `${anno.width}%` : 'auto',
                  height: anno.type === 'rect' ? `${anno.height}%` : 'auto',
                  backgroundColor: anno.type === 'rect' ? anno.color : 'transparent',
                  color: anno.type === 'text' ? anno.color : 'inherit',
                  fontSize: anno.type === 'text' ? `${Math.max(4, anno.fontSize! / 4)}px` : 'inherit',
                  fontWeight: anno.type === 'text' ? 'bold' : 'normal',
                }}
              >
                {anno.type === 'text' && (
                  <div className="whitespace-nowrap px-1 select-none leading-tight">
                    {anno.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 pointer-events-none backdrop-blur-[4px]">
        <div className="flex justify-end items-start gap-2 pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onRotate(page.id)}
            className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-black/70 text-slate-900 dark:text-white rounded-full transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10"
            title="Quick Rotate"
          >
            <RotateCw size={18} strokeWidth={2.5} />
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onEdit(page)}
            className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-black/70 text-slate-900 dark:text-white rounded-full transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10"
            title="Open Editor"
          >
            <ArrowUpRight size={20} strokeWidth={3} />
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onDelete(page.id)}
            className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
            title="Delete Page"
          >
            <X size={20} strokeWidth={3} />
          </motion.button>
        </div>
        
        <div className="flex justify-start items-end pointer-events-auto">
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-white truncate max-w-[140px] tracking-tight uppercase">
              {page.originalFileName}
            </span>
          </div>
        </div>
      </div>

      {/* Page Number Badge */}
      <div className="absolute bottom-5 right-5 px-3 py-1.5 glass text-slate-900 dark:text-white text-[11px] font-black rounded-2xl border border-white/20 dark:border-white/10 uppercase tracking-tighter shadow-2xl">
        P{page.pageNumber}
      </div>
    </div>
  );
});
