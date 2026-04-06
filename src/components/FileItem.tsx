import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

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
      className={`
        flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-brand-900/50 rounded-xl border transition-all cursor-default group
        ${isDragging ? 'border-brand-600 opacity-50 scale-[1.02] shadow-2xl z-50' : 'border-gray-100 dark:border-brand-800 hover:border-brand-600/30 hover:bg-brand-50/50 dark:hover:bg-brand-800/30'}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-brand-800 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
      >
        <GripVertical size={12} />
      </div>
      
      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] shrink-0" style={{ backgroundColor: color }} />
      
      <span className="text-[10px] font-bold text-gray-600 dark:text-brand-200 truncate flex-1 tracking-tight">
        {name}
      </span>
      
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/50 px-2 py-0.5 rounded-lg border border-brand-100 dark:border-brand-800 min-w-[20px] text-center">
          {count}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(fileId);
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
          title="Delete all pages from this file"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
});
