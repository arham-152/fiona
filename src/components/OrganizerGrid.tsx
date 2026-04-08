import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PageItem } from '../types';
import { PageCard } from './PageCard';
import { FileItem } from './FileItem';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Plus, X, Sun, Moon, FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

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

const SkeletonCard = () => (
  <div className="aspect-[3/4] bg-white dark:bg-brand-900/50 rounded-[32px] border border-gray-100 dark:border-brand-800 animate-pulse overflow-hidden">
    <div className="h-full w-full bg-gray-100 dark:bg-brand-800/50" />
  </div>
);

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
    <div className="flex flex-col h-screen bg-brand-200 dark:bg-brand-950 transition-colors duration-300 overflow-hidden">
      {/* Global Header - Fixed at the top */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-brand-800 bg-white dark:bg-brand-950 z-50 w-full shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-brand-50 dark:bg-brand-900 rounded-lg overflow-hidden border border-brand-100 dark:border-brand-800">
            <img 
              src="/—Pngtree—doc file document icon_4175858.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-brand-600 dark:text-brand-400 font-black text-xs">DOC</div>';
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Document Organizer</h1>
            <span className="text-[9px] font-bold text-brand-600 dark:text-brand-500 tracking-[0.3em] uppercase mt-1">PDF EDITOR PRO</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-brand-50 dark:bg-brand-900/50 rounded-full text-[9px] font-black text-gray-500 dark:text-brand-500 border border-gray-200 dark:border-brand-800 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
            <span>{pages.length} page(s) loaded</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onClearAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/5 hover:bg-red-600/10 text-red-600 rounded-lg font-black text-[10px] transition-all border border-red-600/10 uppercase tracking-widest"
          >
            <X size={14} />
            <span className="hidden sm:inline">CLEAR ALL</span>
            <span className="sm:hidden">CLEAR</span>
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-brand-800" />
          
          <div className="flex items-center gap-1 p-1 bg-brand-50 dark:bg-brand-900 rounded-xl border border-gray-200 dark:border-brand-800 shadow-inner">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetTheme(false);
              }}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                !isDarkMode ? "bg-white dark:bg-brand-800 text-brand-600 shadow-sm" : "text-gray-400 dark:text-brand-600 hover:bg-gray-200 dark:hover:bg-brand-800"
              )}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetTheme(true);
              }}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                isDarkMode ? "bg-brand-600 text-white shadow-md" : "text-gray-400 dark:text-brand-600 hover:bg-gray-200 dark:hover:bg-brand-800"
              )}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Content - Separate Scrollbar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-brand-50/50 dark:bg-brand-950/50">
          <div className="max-w-[1800px] mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 sm:gap-8">
                  <AnimatePresence mode="popLayout">
                    {pages.map((page) => (
                      <motion.div
                        key={page.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PageCard
                          page={page}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onRotate={onRotate}
                        />
                      </motion.div>
                    ))}

                    {isProcessing && Array.from({ length: 4 }).map((_, i) => (
                      <motion.div
                        key={`skeleton-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <SkeletonCard />
                      </motion.div>
                    ))}
                    
                    {/* Add More Box */}
                    <motion.button
                      layout
                      whileHover={{ scale: 1.02, borderColor: '#4f46e5' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onAddMore}
                      className="aspect-[3/4] border-2 border-dashed border-gray-200 dark:border-brand-800 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:bg-brand-600/5 transition-all group bg-white dark:bg-brand-900/50 shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 border border-gray-100 dark:border-brand-800 group-hover:border-brand-600/50 flex items-center justify-center transition-all shadow-sm">
                        <Plus className="text-gray-400 dark:text-brand-600 group-hover:text-brand-600 transition-colors" size={32} strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black text-gray-400 dark:text-brand-500 group-hover:text-brand-600 tracking-[0.2em] uppercase transition-colors">Add More</span>
                        <span className="block text-[9px] text-gray-500 dark:text-brand-600 group-hover:text-brand-400 mt-1">PDF or Images</span>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right Sidebar - Separate Scrollbar & Fixed Bottom */}
        <aside className="hidden lg:flex w-80 border-l border-gray-200 dark:border-brand-800 bg-white dark:bg-brand-950 flex-col shadow-2xl z-40">
          {/* Scrollable File List */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-brand-600 uppercase tracking-[0.2em]">Source Files</h3>
                <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-900 rounded-full text-[9px] text-brand-600 dark:text-brand-400 font-black border border-gray-100 dark:border-brand-800 shadow-sm">{fileIds.length}</span>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFileDragEnd}
              >
                <SortableContext items={fileIds} strategy={horizontalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
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
                          onDelete={handleDeleteFile}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
              
              <div className="p-4 bg-brand-50 dark:bg-brand-900/30 rounded-2xl border border-brand-100 dark:border-brand-800/50">
                <p className="text-[9px] text-gray-400 dark:text-brand-600 font-bold leading-relaxed uppercase tracking-wider">
                  Tip: Drag files above to reorder all associated pages instantly.
                </p>
              </div>
            </div>
          </div>
          
          {/* Fixed Bottom Section of Sidebar - Always Visible */}
          <div className="p-6 border-t border-gray-200 dark:border-brand-800 bg-white dark:bg-brand-950 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 dark:text-brand-600 uppercase tracking-[0.2em]">Total Output</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 tracking-tight">{pages.length} Pages</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-600/5 dark:bg-brand-600/10 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-600/10">
                <FileText size={20} />
              </div>
            </div>
            
            <button 
              onClick={onDownload}
              disabled={isProcessing || pages.length === 0}
              className={clsx(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs transition-all shadow-xl active:scale-[0.98] uppercase tracking-[0.2em] border",
                isProcessing || pages.length === 0
                  ? "bg-gray-50 dark:bg-brand-900 text-gray-300 border-gray-100 dark:border-brand-800 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 border-brand-500"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <Download size={18} strokeWidth={3} />
                  <span>DOWNLOAD PDF</span>
                </>
              )}
            </button>
          </div>
        </aside>
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleFileDragEnd}
                  >
                    <SortableContext items={fileIds} strategy={horizontalListSortingStrategy}>
                      <div className="flex flex-col gap-2">
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
                              onDelete={handleDeleteFile}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
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
