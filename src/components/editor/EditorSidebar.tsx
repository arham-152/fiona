import React from 'react';
import { motion } from 'motion/react';
import { 
  RotateCcw, RotateCw, 
  Crop as CropIcon, Type, Square, ImageIcon,
  RefreshCcw, Trash2, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { PageItem, Annotation } from '../../types';

interface EditorSidebarProps {
  activeTab: 'adjust' | 'filter' | 'annotate';
  setActiveTab: (tab: 'adjust' | 'filter' | 'annotate') => void;
  editedPage: PageItem;
  onRotate: (dir: 'left' | 'right') => void;
  onIsCropping: (cropping: boolean) => void;
  onAddText: () => void;
  onAddRect: () => void;
  onAddImage: () => void;
  onAdjustment: (key: keyof PageItem['adjustments'], value: number) => void;
  onFilter: (filter: PageItem['filter']) => void;
  onDelete: () => void;
  onSave: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  selectedAnnotationId: string | null;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  commitAnnotationChange: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab,
  setActiveTab,
  editedPage,
  onRotate,
  onIsCropping,
  onAddText,
  onAddRect,
  onAddImage,
  onAdjustment,
  onFilter,
  onDelete,
  onSave,
  onPrev,
  onNext,
  isFirst,
  isLast,
  selectedAnnotationId,
  updateAnnotation,
  commitAnnotationChange,
}) => {
  const filters: { name: string; value: PageItem['filter'] }[] = [
    { name: 'None', value: 'none' },
    { name: 'Grayscale', value: 'grayscale' },
    { name: 'Punch', value: 'punch' },
    { name: 'Golden', value: 'golden' },
    { name: 'Radiate', value: 'radiate' },
    { name: 'Warm', value: 'warm-contrast' },
    { name: 'Calm', value: 'calm' },
    { name: 'Cool', value: 'cool-light' },
    { name: 'Vivid', value: 'vivid-cool' },
    { name: 'Dramatic', value: 'dramatic-cool' },
  ];

  return (
    <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.05)] z-20 shrink-0">
      {/* Tabs */}
      <div className="flex p-6 gap-2 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-section/30">
        {(['adjust', 'filter', 'annotate'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
              activeTab === tab 
                ? "bg-brand-600 text-white border-brand-400 shadow-lg glow-accent" 
                : "bg-white dark:bg-dark-card text-slate-400 dark:text-slate-500 border-slate-100 dark:border-dark-border hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {activeTab === 'adjust' && (
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2.5">
                <RefreshCcw size={14} strokeWidth={3} />
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onRotate('left')}
                  className="flex items-center justify-center gap-3 p-4 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-200 dark:border-dark-border group"
                >
                  <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Left</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onRotate('right')}
                  className="flex items-center justify-center gap-3 p-4 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-200 dark:border-dark-border group"
                >
                  <RotateCw size={18} className="group-hover:rotate-45 transition-transform" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Right</span>
                </motion.button>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2.5">
                <CropIcon size={14} strokeWidth={3} />
                Geometry
              </label>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onIsCropping(true)}
                className="w-full flex items-center justify-center gap-4 p-5 bg-brand-500/5 dark:bg-brand-500/10 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl transition-all border border-brand-500/20 group"
              >
                <CropIcon size={20} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Open Crop Tool</span>
              </motion.button>
            </div>

            <div className="space-y-10">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2.5">
                <RefreshCcw size={14} strokeWidth={3} />
                Adjustments
              </label>
              {(['brightness', 'contrast', 'saturation'] as const).map((adj) => (
                <div key={adj} className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{adj}</span>
                    <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">{editedPage.adjustments[adj]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={editedPage.adjustments[adj]}
                    onChange={(e) => onAdjustment(adj, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div className="grid grid-cols-2 gap-4">
            {filters.map((f) => (
              <motion.button
                key={f.value}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onFilter(f.value)}
                className={clsx(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all group",
                  editedPage.filter === f.value
                    ? "bg-brand-600 text-white border-brand-400 shadow-lg glow-accent"
                    : "bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 border-slate-100 dark:border-dark-border hover:border-brand-500/30"
                )}
              >
                <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-dark-section overflow-hidden border border-slate-200 dark:border-dark-border group-hover:border-white/20">
                  <img 
                    src={editedPage.dataUrl} 
                    alt={f.name}
                    className="w-full h-full object-cover"
                    style={{ 
                      filter: f.value === 'grayscale' ? 'grayscale(100%)' : 
                              f.value === 'punch' ? 'contrast(120%) saturate(120%)' :
                              f.value === 'golden' ? 'sepia(30%) saturate(140%) brightness(110%)' :
                              f.value === 'radiate' ? 'brightness(115%) saturate(130%)' :
                              f.value === 'warm-contrast' ? 'sepia(10%) contrast(110%) saturate(110%)' :
                              f.value === 'calm' ? 'saturate(80%) brightness(105%)' :
                              f.value === 'cool-light' ? 'hue-rotate(10deg) saturate(90%) brightness(110%)' :
                              f.value === 'vivid-cool' ? 'saturate(140%) hue-rotate(10deg)' :
                              f.value === 'dramatic-cool' ? 'contrast(130%) hue-rotate(20deg) saturate(80%)' : ''
                    }}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{f.name}</span>
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'annotate' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddText}
                className="flex items-center gap-4 p-5 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-200 dark:border-dark-border group"
              >
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Type size={20} className="text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Add Text</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddRect}
                className="flex items-center gap-4 p-5 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-200 dark:border-dark-border group"
              >
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Square size={20} className="text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Add Rectangle</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddImage}
                className="flex items-center gap-4 p-5 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-2xl transition-all border border-slate-200 dark:border-dark-border group"
              >
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} className="text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Add Image</span>
              </motion.button>
            </div>

            {selectedAnnotationId && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-slate-100 dark:bg-dark-section rounded-3xl border border-slate-200 dark:border-dark-border space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Edit Annotation</h4>
                  <div className="px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[9px] font-black rounded-md uppercase tracking-widest">
                    {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type}
                  </div>
                </div>

                {editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Text Content</label>
                      <textarea
                        value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.text || ''}
                        onChange={(e) => updateAnnotation(selectedAnnotationId, { text: e.target.value })}
                        onBlur={commitAnnotationChange}
                        className="w-full p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Font Size</label>
                        <span className="text-[10px] font-black text-brand-600 dark:text-brand-400">{editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="120"
                        value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontSize || 24}
                        onChange={(e) => updateAnnotation(selectedAnnotationId, { fontSize: parseInt(e.target.value) })}
                        onMouseUp={commitAnnotationChange}
                        className="w-full h-1.5 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weight</label>
                        <select
                          value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontWeight || 'bold'}
                          onChange={(e) => {
                            updateAnnotation(selectedAnnotationId, { fontWeight: e.target.value });
                            commitAnnotationChange();
                          }}
                          className="w-full p-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="bold">Bold</option>
                          <option value="black">Black</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Font</label>
                        <select
                          value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.fontFamily || 'sans-serif'}
                          onChange={(e) => {
                            updateAnnotation(selectedAnnotationId, { fontFamily: e.target.value });
                            commitAnnotationChange();
                          }}
                          className="w-full p-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="sans-serif">Sans Serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                          <option value="cursive">Cursive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'text' || 
                  editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.type === 'rect') && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {['#000000', '#FFFFFF', '#6366F1', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'].map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            updateAnnotation(selectedAnnotationId, { color: c });
                            commitAnnotationChange();
                          }}
                          className={clsx(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.color === c 
                              ? "border-brand-500 scale-110 shadow-lg" 
                              : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={editedPage.annotations?.find(a => a.id === selectedAnnotationId)?.color || '#000000'}
                        onChange={(e) => updateAnnotation(selectedAnnotationId, { color: e.target.value })}
                        onBlur={commitAnnotationChange}
                        className="w-8 h-8 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            <div className="p-6 bg-brand-500/5 dark:bg-brand-500/10 rounded-3xl border border-brand-500/20">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
                Tip: Click an annotation on the canvas to move, resize, or style it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-8 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-section/30 space-y-6">
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPrev}
            disabled={isFirst}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-dark-border disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronLeft size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">Prev</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNext}
            disabled={isLast}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-dark-border disabled:opacity-30 transition-all shadow-sm"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Next</span>
            <ChevronRight size={18} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all"
            title="Delete Page"
          >
            <Trash2 size={20} strokeWidth={2.5} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            className="flex-1 flex items-center justify-center gap-3 p-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-brand-600/20 glow-accent"
          >
            <Check size={20} strokeWidth={3} />
            SAVE CHANGES
          </motion.button>
        </div>
      </div>
    </aside>
  );
};
