import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem } from '../types';
import { ArrowUpRight, RotateCw, X, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

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
      {...attributes}
      {...listeners}
      className={clsx(
        "group relative aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing shadow-xl",
        isDragging 
          ? "opacity-50 scale-105 border-brand-500" 
          : "hover:border-brand-500 border-zinc-800"
      )}
    >
      {/* Image Container */}
      <div 
        className="w-full h-full overflow-hidden relative bg-zinc-950 p-2"
      >
        <div 
          className="w-full h-full relative rounded-lg overflow-hidden"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        >
          <img
            src={page.dataUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain"
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
                  width: (anno.type === 'rect' || anno.type === 'image') ? `${anno.width}%` : 'auto',
                  height: (anno.type === 'rect' || anno.type === 'image') ? `${anno.height}%` : 'auto',
                  backgroundColor: anno.type === 'rect' ? anno.color : 'transparent',
                  color: anno.type === 'text' ? anno.color : 'inherit',
                  fontSize: anno.type === 'text' ? `${Math.max(4, anno.fontSize! / 4)}px` : 'inherit',
                  fontWeight: anno.type === 'text' ? (anno.fontWeight || 'bold') : 'normal',
                  fontFamily: anno.type === 'text' ? (anno.fontFamily || 'sans-serif') : 'inherit',
                }}
              >
                {anno.type === 'text' && (
                  <div className="whitespace-nowrap px-1 select-none leading-tight">
                    {anno.text}
                  </div>
                )}
                {anno.type === 'image' && anno.image && (
                  <img src={anno.image} alt="Annotation" className="w-full h-full object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hover Overlay with Prominent Edit Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(page);
            }}
            className="absolute top-4 right-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300 flex items-center gap-2 pointer-events-auto border border-white/20"
          >
            <ArrowUpRight size={14} strokeWidth={3} />
            Edit Page
          </button>
        </div>

        {/* Rotate Button (Bottom Left of Image Area) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRotate(page.id);
          }}
          className="absolute bottom-4 left-4 w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
          title="Rotate"
        >
          <RotateCw size={16} />
        </button>

        {/* Delete Button (Moved to Bottom Right of Image Area) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/80 hover:bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 z-20 transition-all"
          title="Delete Page"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Info (Bottom) */}
      <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-widest max-w-[120px]">
            {page.originalFileName}
          </span>
          <span className="text-[10px] font-black text-zinc-600">
            P{page.pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
});
