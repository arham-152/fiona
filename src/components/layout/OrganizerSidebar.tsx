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
}

export const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({
  pages,
  fileIds,
  isProcessing,
  onDeleteFile,
  onDownload,
  onFileReorder,
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
    <aside className="hidden lg:flex w-85 border-l border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex-col shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.05)] z-40">
      {/* Scrollable File List */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Source Files</h3>
            <span className="px-3 py-1 bg-slate-100 dark:bg-dark-section rounded-full text-[10px] text-slate-600 dark:text-slate-400 font-black border border-slate-200 dark:border-dark-border shadow-inner">{fileIds.length}</span>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onFileReorder}
          >
            <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
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
          
          <div className="p-5 bg-slate-50 dark:bg-dark-section/50 rounded-3xl border border-slate-100 dark:border-dark-border/50 shadow-inner">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
              Tip: Drag files above to reorder all associated pages instantly.
            </p>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Section of Sidebar - Always Visible */}
      <div className="p-8 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Total Output</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{pages.length} Pages</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-inner">
            <FileText size={24} strokeWidth={2.5} />
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownload}
          disabled={isProcessing || pages.length === 0}
          className={clsx(
            "w-full flex items-center justify-center gap-4 px-8 py-5 rounded-[24px] font-black text-sm transition-all shadow-2xl active:scale-[0.98] uppercase tracking-[0.25em] border-2",
            isProcessing || pages.length === 0
              ? "bg-slate-50 dark:bg-dark-section text-slate-300 border-slate-100 dark:border-dark-border cursor-not-allowed"
              : "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-brand-600/30 border-brand-400/50 glow-accent"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>PROCESSING...</span>
            </>
          ) : (
            <>
              <Download size={20} strokeWidth={3} />
              <span>DOWNLOAD PDF</span>
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
};
