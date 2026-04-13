import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, useSensor, PointerSensor, KeyboardSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PageCard } from '../PageCard';
import { PageItem } from '../../types';

interface OrganizerGridAreaProps {
  pages: PageItem[];
  isProcessing: boolean;
  onReorder: (event: DragEndEvent) => void;
  onEdit: (page: PageItem) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onAddMore: () => void;
}

const SkeletonCard = () => (
  <div className="aspect-[3/4] bg-white dark:bg-brand-900/50 rounded-[32px] border border-gray-100 dark:border-brand-800 animate-pulse overflow-hidden">
    <div className="h-full w-full bg-gray-100 dark:bg-brand-800/50" />
  </div>
);

export const OrganizerGridArea: React.FC<OrganizerGridAreaProps> = ({
  pages,
  isProcessing,
  onReorder,
  onEdit,
  onDelete,
  onRotate,
  onAddMore,
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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 bg-slate-50/50 dark:bg-dark-bg/50">
      <div className="max-w-[1800px] mx-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onReorder}
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
  );
};
