import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Image as ImageIcon, Check, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { PageItem } from '../types';
import { clsx } from 'clsx';
import JSZip from 'jszip';

interface ConverterGridProps {
  pages: PageItem[];
  isProcessing: boolean;
  onClearAll: () => void;
  onDownloadAll: () => void;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
}

export const ConverterGrid: React.FC<ConverterGridProps> = ({
  pages,
  isProcessing,
  onClearAll,
  onDownloadAll,
  isDarkMode,
  onSetTheme,
}) => {
  return (
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="h-24 flex items-center justify-between px-8 border-b border-slate-100 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 flex items-center justify-center bg-brand-600 text-white rounded-2xl shadow-lg glow-accent">
            <ImageIcon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Conversion Complete</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-2">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Processed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearAll}
            className="px-6 py-3 bg-slate-100 dark:bg-dark-section hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border"
          >
            Start New
          </motion.button>
        </div>
      </header>

      {/* Success View Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 dark:bg-dark-bg/50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl p-16 bg-white dark:bg-dark-card rounded-[64px] shadow-saas-2xl border border-slate-100 dark:border-dark-border flex flex-col items-center text-center gap-12 relative z-10 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 via-cyan-400 to-brand-500" />
          
          <div className="relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-[48px] flex items-center justify-center shadow-inner"
            >
              <Check size={80} strokeWidth={3.5} />
            </motion.div>
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-4 -right-4 w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-saas-xl border-4 border-white dark:border-dark-card"
            >
              <ImageIcon size={28} strokeWidth={2.5} />
            </motion.div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Ready for <span className="text-brand-600">Download</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xl max-w-md mx-auto leading-relaxed">
              We've successfully processed <span className="font-bold text-slate-900 dark:text-white">{pages.length} pages</span>. Your high-quality JPG images are ready.
            </p>
          </div>

          <div className="w-full space-y-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -6 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownloadAll}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-5 py-8 bg-brand-600 hover:bg-brand-500 text-white rounded-[32px] font-black text-xl uppercase tracking-[0.25em] transition-all shadow-saas-2xl shadow-brand-600/40 glow-accent disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <>
                  <Download size={32} strokeWidth={3} />
                  Download ZIP
                </>
              )}
            </motion.button>
            
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure • Client-Side • No Data Stored
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
