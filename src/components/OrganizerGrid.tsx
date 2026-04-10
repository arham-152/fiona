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
import { Plus, X, FileText, Trash2, Settings2, Sparkles } from 'lucide-react';
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
  <div className="aspect-[3/4] bg-white dark:bg-saas-card-dark rounded-2xl border border-slate-100 dark:border-saas-border-dark animate-pulse overflow-hidden shadow-sm">
    <div className="h-full w-full bg-slate-50 dark:bg-slate-800/50" />
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
  isProcessing,
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
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Sidebar - Source Files */}
      <aside className="w-full lg:w-72 flex flex-col gap-6">
        <div className="bg-white dark:bg-saas-card-dark rounded-2xl border border-slate-200 dark:border-saas-border-dark p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} />
              Source Files
            </h3>
            <span className="px-2 py-0.5 bg-saas-accent-light/10 dark:bg-saas-accent-dark/10 text-saas-accent-light dark:text-saas-accent-dark rounded-lg text-[10px] font-bold">
              {fileIds.length}
            </span>
          </div>

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

          <button
            onClick={onAddMore}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:border-saas-accent-light dark:hover:border-saas-accent-dark hover:text-saas-accent-light dark:hover:text-saas-accent-dark transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Plus size={16} />
            Add Files
          </button>
        </div>

        <div className="bg-gradient-to-br from-saas-accent-light to-indigo-600 dark:from-saas-accent-dark dark:to-indigo-900 rounded-2xl p-6 text-white shadow-lg glow-accent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h4 className="font-bold text-sm">Smart Organizer</h4>
          </div>
          <p className="text-xs text-white/80 leading-relaxed mb-4">
            Drag and drop pages to reorder. Your changes are saved instantly with 100% quality.
          </p>
          <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-2/3" />
          </div>
        </div>

        <button
          onClick={onClearAll}
          className="flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
        >
          <Trash2 size={16} />
          Clear Workspace
        </button>
      </aside>

      {/* Main Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Document Pages</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage and reorder your document structure</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <Settings2 size={20} />
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
              <AnimatePresence mode="popLayout">
                {pages.map((page) => (
                  <motion.div
                    key={page.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PageCard
                      page={page}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRotate={onRotate}
                    />
                  </motion.div>
                ))}

                {isProcessing && Array.from({ length: 2 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SkeletonCard />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>

        {pages.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No pages loaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
