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
  verticalListSortingStrategy,
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
  const [logoError, setLogoError] = React.useState(false);
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
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300 overflow-hidden">
      {/* Global Header - Fixed at the top */}
      <header className="flex items-center justify-between px-8 py-4 glass z-50 w-full shadow-2xl">
        <div className="flex items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 flex items-center justify-center bg-white dark:bg-dark-card rounded-xl overflow-hidden border border-slate-100 dark:border-dark-border shadow-lg"
          >
            {logoError ? (
              <div className="text-brand-600 dark:text-brand-500 font-black text-xs tracking-tighter">DOC</div>
            ) : (
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            )}
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Document Organizer</h1>
            <span className="text-[10px] font-black text-brand-600 dark:text-brand-500 tracking-[0.4em] uppercase mt-1.5">PDF EDITOR PRO</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 bg-slate-100 dark:bg-dark-section rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-border uppercase tracking-widest shadow-inner">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse glow-accent" />
            <span>{pages.length} page(s) loaded</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl font-black text-[10px] transition-all border border-red-500/20 uppercase tracking-widest"
          >
            <X size={14} strokeWidth={3} />
            <span className="hidden sm:inline">CLEAR ALL</span>
          </motion.button>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-dark-border" />
          
          <div className="flex items-center gap-1.5 p-1.5 glass rounded-2xl shadow-inner">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetTheme(false);
              }}
              className={clsx(
                "p-2 rounded-xl transition-all duration-300",
                !isDarkMode ? "bg-white dark:bg-dark-card text-brand-600 shadow-lg scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
              title="Light Mode"
            >
              <Sun size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetTheme(true);
              }}
              className={clsx(
                "p-2 rounded-xl transition-all duration-300",
                isDarkMode ? "bg-brand-500 text-white shadow-lg glow-accent scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
              title="Dark Mode"
            >
              <Moon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Content - Separate Scrollbar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 bg-slate-50/50 dark:bg-dark-bg/50">
          <div className="max-w-[1800px] mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8 sm:gap-10">
                  <AnimatePresence mode="popLayout">
                    {pages.map((page) => (
                      <motion.div
                        key={page.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
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
                      whileHover={{ scale: 1.03, y: -5 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onAddMore}
                      className="aspect-[3/4] border-2 border-dashed border-slate-200 dark:border-dark-border rounded-[40px] flex flex-col items-center justify-center gap-5 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 transition-all group bg-white dark:bg-dark-card/30 shadow-sm hover:shadow-2xl hover:border-brand-500/50"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-dark-section border border-slate-100 dark:border-dark-border group-hover:border-brand-500/50 flex items-center justify-center transition-all shadow-inner group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white group-hover:glow-accent">
                        <Plus className="text-slate-400 dark:text-slate-600 group-hover:text-white transition-colors" size={36} strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <span className="block text-[11px] font-black text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 tracking-[0.25em] uppercase transition-colors">Add More</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-600 group-hover:text-slate-400 mt-1.5 font-medium">PDF or Images</span>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right Sidebar - Separate Scrollbar & Fixed Bottom */}
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
                onDragEnd={handleFileDragEnd}
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
                          onDelete={handleDeleteFile}
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
                    <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
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
