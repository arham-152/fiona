import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageItem } from '../types';
import { Maximize2, RotateCw, Trash2, GripVertical } from 'lucide-react';
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
      style={style}
      className={clsx(
        "group relative aspect-[3/4] bg-white dark:bg-saas-card-dark rounded-2xl overflow-hidden border border-slate-200 dark:border-saas-border-dark transition-all duration-300 cursor-default",
        isDragging ? "opacity-50 scale-105 shadow-2xl ring-2 ring-saas-accent-light dark:ring-saas-accent-dark" : "hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-saas-accent-dark/10"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-3 left-3 z-20 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-400 hover:text-saas-accent-light dark:hover:text-saas-accent-dark"
      >
        <GripVertical size={14} />
      </div>

      {/* Page Number Badge */}
      <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-white/10 uppercase tracking-wider shadow-lg">
        Page {page.pageNumber}
      </div>

      {/* Image Container */}
      <div className="w-full h-full p-2 bg-slate-50 dark:bg-slate-900/50">
        <div 
          className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-white dark:bg-slate-900 transition-transform duration-500"
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

      {/* Action Bar - Appears on Hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30">
        <div className="flex items-center justify-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
          <button 
            onClick={() => onEdit(page)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-saas-accent-light dark:bg-saas-accent-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all"
            title="Open Editor"
          >
            <Maximize2 size={12} />
            <span>Edit</span>
          </button>
          <button 
            onClick={() => onRotate(page.id)}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Quick Rotate"
          >
            <RotateCw size={14} />
          </button>
          <button 
            onClick={() => onDelete(page.id)}
            className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete Page"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* File Color Indicator */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: page.color }}
      />
    </div>
  );
});
