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
    <header className="flex items-center justify-between px-8 py-5 glass z-50 w-full shadow-saas-xl shrink-0 border-b border-white/20 dark:border-white/5">
      <div className="flex items-center gap-8">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="w-14 h-14 flex items-center justify-center relative group cursor-pointer"
        >
          {logoError ? (
            <div className="text-brand-600 dark:text-brand-500 font-black text-xl tracking-tighter relative z-10">DOC</div>
          ) : (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10 filter drop-shadow-lg"
              onError={() => setLogoError(true)}
            />
          )}
        </motion.div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Organizer</h1>
          <span className="text-[9px] font-black text-brand-600 dark:text-brand-500 tracking-[0.5em] uppercase mt-2">SaaS Edition</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-3 px-5 py-2 bg-slate-100/50 dark:bg-dark-section/50 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-dark-border/50 uppercase tracking-[0.2em] shadow-inner backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{pageCount} page(s) loaded</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-8">
        <motion.button 
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClearAll}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] transition-all border border-red-500/20 uppercase tracking-[0.2em] group"
        >
          <X size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="hidden sm:inline">Clear Workspace</span>
        </motion.button>
        
        <div className="w-px h-10 bg-slate-200 dark:bg-dark-border" />
        
        <div className="flex items-center gap-2 p-2 glass rounded-[24px] shadow-inner border border-white/20 dark:border-white/5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetTheme(false);
            }}
            className={clsx(
              "p-2.5 rounded-xl transition-all duration-500",
              !isDarkMode ? "bg-white dark:bg-dark-card text-brand-600 shadow-saas-md scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Light Mode"
          >
            <Sun size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetTheme(true);
            }}
            className={clsx(
              "p-2.5 rounded-xl transition-all duration-500",
              isDarkMode ? "bg-brand-500 text-white shadow-saas-md glow-accent scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Dark Mode"
          >
            <Moon size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
