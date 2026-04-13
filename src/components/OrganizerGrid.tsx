import React from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { PageItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { OrganizerHeader } from './layout/OrganizerHeader';
import { OrganizerSidebar } from './layout/OrganizerSidebar';
import { OrganizerGridArea } from './layout/OrganizerGridArea';
import { FileItem } from './FileItem';

interface OrganizerGridProps {
  pages: PageItem[];
  onReorder: (newPages: PageItem[]) => void;
  onEdit: (page: PageItem) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onAddMore: () => void;
  onClearAll: () => void;
  onDownload: () => void;
  isProcessing: boolean;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
}

export const OrganizerGrid: React.FC<OrganizerGridProps> = ({
  pages,
  onReorder,
  onEdit,
  onDelete,
  onRotate,
  onAddMore,
  onClearAll,
  onDownload,
  isProcessing,
  isDarkMode,
  onSetTheme,
}) => {
  const [showMobileFiles, setShowMobileFiles] = React.useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      onReorder(arrayMove(pages, oldIndex, newIndex));
    }
  };

  const handleFileDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeFileId = active.id as string;
      const overFileId = over.id as string;

      const fileOrder = Array.from(new Set(pages.map(p => p.fileId)));
      const oldFileIndex = fileOrder.indexOf(activeFileId);
      const newFileIndex = fileOrder.indexOf(overFileId);
      const newFileOrder = arrayMove(fileOrder, oldFileIndex, newFileIndex);

      // Reorder pages based on new file order
      const newPages: PageItem[] = [];
      newFileOrder.forEach(fileId => {
        const filePages = pages.filter(p => p.fileId === fileId);
        newPages.push(...filePages);
      });
      onReorder(newPages);
    }
  };

  const fileIds = Array.from(new Set(pages.map(p => p.fileId))) as string[];

  const handleDeleteFile = (fileId: string) => {
    onReorder(pages.filter(p => p.fileId !== fileId));
  };

  return (
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300 overflow-hidden">
      <OrganizerHeader 
        pageCount={pages.length}
        isDarkMode={isDarkMode}
        onSetTheme={onSetTheme}
        onClearAll={onClearAll}
      />

      <div className="flex-1 flex overflow-hidden">
        <OrganizerGridArea 
          pages={pages}
          isProcessing={isProcessing}
          onReorder={handleDragEnd}
          onEdit={onEdit}
          onDelete={onDelete}
          onRotate={onRotate}
          onAddMore={onAddMore}
        />

        <OrganizerSidebar 
          pages={pages}
          fileIds={fileIds}
          isProcessing={isProcessing}
          onDeleteFile={handleDeleteFile}
          onDownload={onDownload}
          onFileReorder={handleFileDragEnd}
        />
      </div>

      {/* Mobile Bottom Bar - lg and below */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-brand-950/90 backdrop-blur-xl border border-gray-200 dark:border-brand-800 rounded-full shadow-2xl w-[90%] max-w-md">
        <button 
          onClick={() => setShowMobileFiles(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-400 rounded-full font-black text-[10px] transition-all border border-brand-100 dark:border-brand-800 uppercase tracking-widest shadow-sm"
        >
          <FileText size={16} />
          <span>FILES</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-brand-800" />

        <button 
          onClick={onDownload}
          disabled={isProcessing || pages.length === 0}
          className={clsx(
            "flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black text-[10px] transition-all border uppercase tracking-widest shadow-lg",
            isProcessing || pages.length === 0
              ? "bg-gray-50 dark:bg-brand-900 text-gray-300 border-gray-100 dark:border-brand-800"
              : "bg-brand-600 text-white border-brand-500 shadow-brand-600/20"
          )}
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>DOWNLOAD PDF</span>
        </button>
      </div>

      {/* Mobile File List Overlay */}
      <AnimatePresence>
        {showMobileFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMobileFiles(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-brand-950 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-brand-800 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-brand-600 uppercase tracking-[0.2em]">Source Files</h3>
                <button 
                  onClick={() => setShowMobileFiles(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-brand-900 text-gray-500 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="space-y-6">
                  <OrganizerSidebar 
                    pages={pages}
                    fileIds={fileIds}
                    isProcessing={isProcessing}
                    onDeleteFile={handleDeleteFile}
                    onDownload={onDownload}
                    onFileReorder={handleFileDragEnd}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-brand-800">
                <button 
                  onClick={() => {
                    onDownload();
                    setShowMobileFiles(false);
                  }}
                  disabled={isProcessing || pages.length === 0}
                  className={clsx(
                    "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs transition-all shadow-xl active:scale-[0.98] uppercase tracking-[0.2em] border",
                    isProcessing || pages.length === 0
                      ? "bg-gray-50 dark:bg-brand-900 text-gray-300 border-gray-100 dark:border-brand-800 cursor-not-allowed"
                      : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 border-brand-500"
                  )}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={18} />}
                  <span>DOWNLOAD PDF</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
