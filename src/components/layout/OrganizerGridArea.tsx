import React from 'react';
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
  <div className="aspect-[3/4] bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border animate-pulse overflow-hidden shadow-sm">
    <div className="h-full w-full bg-slate-50 dark:bg-dark-section/50" />
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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-slate-50/50 dark:bg-dark-bg/50 relative">
      <div className="max-w-[1800px] mx-auto relative z-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onReorder}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 sm:gap-8">
              {pages.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRotate={onRotate}
                />
              ))}

              {isProcessing && Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
              
              {/* Add More Box */}
              <button
                onClick={onAddMore}
                className="aspect-[3/4] border-2 border-dashed border-slate-200 dark:border-dark-border rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 transition-all group bg-white dark:bg-dark-card/30 shadow-sm hover:border-brand-500/50"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-dark-section border border-slate-100 dark:border-dark-border group-hover:border-brand-500/50 flex items-center justify-center transition-all group-hover:bg-brand-500 group-hover:text-white">
                  <Plus className="text-slate-400 dark:text-slate-600 group-hover:text-white transition-colors" size={24} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 tracking-widest uppercase transition-colors">Add More</span>
                </div>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
