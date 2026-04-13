import React from 'react';
import { motion } from 'motion/react';
import { X, Undo2, Redo2 } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

interface EditorHeaderProps {
  pageNumber: number;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  pageNumber,
  onClose,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
}) => {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <header className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-dark-border glass relative z-10 shrink-0">
      <div className="flex items-center gap-6">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 flex items-center justify-center bg-white dark:bg-dark-card rounded-2xl overflow-hidden border border-slate-100 dark:border-dark-border shadow-lg"
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
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Edit Page {pageNumber}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Professional Suite</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center glass rounded-2xl p-1.5 shadow-inner">
          <IconButton 
            icon={<Undo2 size={20} strokeWidth={2.5} />}
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          />
          <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-1.5" />
          <IconButton 
            icon={<Redo2 size={20} strokeWidth={2.5} />}
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          />
        </div>
        
        <div className="w-px h-8 bg-slate-200 dark:bg-dark-border mx-2 hidden sm:block" />

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-5 py-2.5 bg-slate-100 dark:bg-dark-section hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-200 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border"
        >
          RESET
        </motion.button>

        <IconButton 
          icon={<X size={28} strokeWidth={2.5} />}
          variant="ghost"
          onClick={onClose}
          className="rounded-2xl"
        />
      </div>
    </header>
  );
};
