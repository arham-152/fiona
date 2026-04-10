import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FileText } from 'lucide-react';

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
        flex items-center gap-3 px-3 py-3 bg-white dark:bg-saas-card-dark rounded-xl border transition-all cursor-default group
        ${isDragging 
          ? 'border-saas-accent-light dark:border-saas-accent-dark opacity-50 scale-[1.02] shadow-2xl z-50' 
          : 'border-slate-100 dark:border-slate-800 hover:border-saas-accent-light/30 dark:hover:border-saas-accent-dark/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm'}
      `}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-saas-accent-light dark:group-hover:text-saas-accent-dark transition-colors"
      >
        <GripVertical size={14} />
      </div>
      
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <FileText size={16} />
        </div>
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-saas-card-dark shadow-sm" 
          style={{ backgroundColor: color }} 
        />
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate tracking-tight">
          {name}
        </span>
        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {count} {count === 1 ? 'Page' : 'Pages'}
        </span>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(fileId);
        }}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="Delete all pages from this file"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
});
