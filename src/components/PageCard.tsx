import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem } from '../types';
import { ArrowUpRight, RotateCw, X } from 'lucide-react';
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
      onDoubleClick={() => onEdit(page)}
      className={clsx(
        "group relative aspect-[3/4] bg-white dark:bg-brand-800 rounded-[32px] overflow-hidden border-4 transition-all cursor-pointer shadow-sm hover:shadow-xl",
        isDragging ? "opacity-50 scale-105 border-brand-600" : "hover:scale-[1.02]"
      )}
    >
      {/* Image Container */}
      <div 
        {...attributes} 
        {...listeners}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative bg-gray-50 dark:bg-brand-900"
      >
        <div 
          className="w-full h-full transition-transform duration-300"
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
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <button 
            onClick={() => onDelete(page.id)}
            className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
            title="Delete Page"
          >
            <X size={18} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => onRotate(page.id)}
              className="p-2.5 bg-white/90 hover:bg-white text-gray-900 rounded-full transition-colors shadow-lg"
              title="Quick Rotate"
            >
              <RotateCw size={16} />
            </button>
            <button 
              onClick={() => onEdit(page)}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full transition-all shadow-lg"
              title="Open Editor"
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex justify-start items-end pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
            <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
              {page.originalFileName}
            </span>
          </div>
        </div>
      </div>

      {/* Page Number Badge */}
      <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/90 dark:bg-brand-900/90 backdrop-blur-sm text-gray-900 dark:text-white text-[10px] font-black rounded-full border border-gray-100 dark:border-brand-700 uppercase tracking-tighter shadow-sm">
        P{page.pageNumber}
      </div>
    </div>
  );
});
