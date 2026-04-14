import React from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { DndContext, closestCenter, useSensor, PointerSensor, KeyboardSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FileItem } from '../FileItem';
import { PageItem } from '../../types';

interface OrganizerSidebarProps {
  pages: PageItem[];
  fileIds: string[];
  isProcessing: boolean;
  onDeleteFile: (fileId: string) => void;
  onDownload: () => void;
  onFileReorder: (event: DragEndEvent) => void;
  className?: string;
  hideFooter?: boolean;
  hideProTip?: boolean;
}

export const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({
  pages,
  fileIds,
  isProcessing,
  onDeleteFile,
  onDownload,
  onFileReorder,
  className,
  hideFooter = false,
  hideProTip = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <aside className={clsx("flex flex-col shadow-saas-2xl z-40 relative", className)}>
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-brand-500/20 to-transparent pointer-events-none" />
      
      {/* Scrollable File List */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Source Files</h3>
            <span className="px-4 py-1.5 bg-slate-100/50 dark:bg-dark-section/50 rounded-full text-[10px] text-slate-600 dark:text-slate-400 font-black border border-slate-200/50 dark:border-dark-border/50 shadow-inner backdrop-blur-sm">{fileIds.length}</span>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onFileReorder}
          >
            <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {fileIds.map((fileId) => {
                  const firstPage = pages.find(p => p.fileId === fileId);
                  const filePages = pages.filter(p => p.fileId === fileId);
                  return (
                    <FileItem 
                      key={fileId}
                      fileId={fileId}
                      color={firstPage?.color || '#4f46e5'}
                      name={firstPage?.originalFileName || 'Unknown'}
                      count={filePages.length}
                      onDelete={onDeleteFile}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
          
          {!hideProTip && (
            <div className="p-6 bg-brand-500/5 dark:bg-brand-500/10 rounded-[32px] border border-brand-500/10 dark:border-brand-500/20 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[11px] text-brand-600/70 dark:text-brand-400/70 font-bold leading-relaxed uppercase tracking-widest relative z-10">
                Pro Tip: Drag files above to reorder all associated pages instantly.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed Bottom Section of Sidebar - Always Visible */}
      {!hideFooter && (
        <div className="p-10 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-saas-xl relative z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownload}
            disabled={isProcessing || pages.length === 0}
            className={clsx(
              "w-full flex items-center justify-center gap-5 px-8 py-6 rounded-[32px] font-black text-sm transition-all shadow-saas-2xl active:scale-[0.98] uppercase tracking-[0.3em] border-2",
              isProcessing || pages.length === 0
                ? "bg-slate-50 dark:bg-dark-section text-slate-300 border-slate-100 dark:border-dark-border cursor-not-allowed"
                : "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-brand-600/40 border-brand-400/50 glow-accent"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download size={24} strokeWidth={3} />
                <span>Download PDF</span>
              </>
            )}
          </motion.button>
        </div>
      )}
    </aside>
  );
};
