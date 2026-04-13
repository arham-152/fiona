import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface FileItemProps {
  fileId: string;
  color: string;
  name: string;
  count: number;
  onDelete?: (fileId: string) => void;
}

export const FileItem: React.FC<FileItemProps> = React.memo(({ fileId, color, name, count, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: fileId });

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
        "flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-300 cursor-default group relative overflow-hidden",
        isDragging 
          ? "border-brand-500 bg-brand-500/10 scale-[1.05] shadow-2xl z-50 glow-accent" 
          : "border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card/50 hover:border-brand-500/30 hover:bg-slate-50 dark:hover:bg-dark-section/50 hover:shadow-lg"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors"
      >
        <GripVertical size={14} strokeWidth={2.5} />
      </div>
      
      <div className="w-2.5 h-2.5 rounded-full shadow-lg shrink-0 relative" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 rounded-full animate-pulse opacity-50" style={{ backgroundColor: color }} />
      </div>
      
      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate flex-1 tracking-tight uppercase">
        {name}
      </span>
      
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 px-2.5 py-1 rounded-xl border border-brand-500/20 min-w-[24px] text-center shadow-inner">
          {count}
        </span>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(fileId);
          }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          title="Delete all pages from this file"
        >
          <Trash2 size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
});
