import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, X } from 'lucide-react';
import { clsx } from 'clsx';

interface OrganizerHeaderProps {
  pageCount: number;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
  onClearAll: () => void;
}

export const OrganizerHeader: React.FC<OrganizerHeaderProps> = ({
  pageCount,
  isDarkMode,
  onSetTheme,
  onClearAll,
}) => {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <header className="flex items-center justify-between px-8 py-4 glass z-50 w-full shadow-2xl shrink-0">
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
          <span>{pageCount} page(s) loaded</span>
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
  );
};
