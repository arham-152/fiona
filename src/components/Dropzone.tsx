import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ChevronDown, LayoutGrid, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, isDarkMode, onSetTheme }) => {
  const [logoError, setLogoError] = React.useState(false);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    }
  } as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[85vh] p-8 relative"
    >
      {/* Theme Toggle for Landing */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex items-center gap-1 p-1.5 glass rounded-full shadow-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetTheme(false);
            }}
            className={clsx(
              "p-2 rounded-full transition-all duration-300",
              !isDarkMode ? "bg-brand-600 text-white shadow-lg glow-accent scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Light Mode"
          >
            <Sun size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetTheme(true);
            }}
            className={clsx(
              "p-2 rounded-full transition-all duration-300",
              isDarkMode ? "bg-brand-500 text-white shadow-lg glow-accent scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
            title="Dark Mode"
          >
            <Moon size={18} />
          </button>
        </div>
      </div>

      {/* Tool Selector Bar */}
      <div className="mb-16 w-full max-w-md flex flex-col items-center gap-10">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-28 h-28 flex items-center justify-center bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-2xl p-3 border border-slate-100 dark:border-dark-border"
        >
          {logoError ? (
            <div className="text-brand-600 dark:text-brand-500 font-black text-2xl tracking-tighter">DOC</div>
          ) : (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
            />
          )}
        </motion.div>
        
        <div className="flex items-center justify-between p-4 glass rounded-3xl shadow-2xl w-full group cursor-default">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-brand-600/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <LayoutGrid size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Select Tool</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">Document Organizer</span>
            </div>
          </div>
          <div className="pr-4 text-slate-300 dark:text-slate-600">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Main Dropzone Area */}
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={clsx(
          "relative w-full max-w-3xl aspect-[2/1] border-2 border-dashed rounded-[56px] transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-8 group overflow-hidden",
          isDragActive 
            ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 scale-[1.02] animate-border-glow" 
            : "border-slate-200 dark:border-dark-border hover:border-brand-500 bg-white/50 dark:bg-dark-card/30 shadow-2xl backdrop-blur-sm"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-colors duration-700" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-700" />

        <div className={clsx(
          "w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl",
          isDragActive 
            ? "bg-brand-500 text-white glow-accent rotate-12" 
            : "bg-brand-50 dark:bg-dark-section text-brand-600 dark:text-brand-400 group-hover:rotate-6 group-hover:scale-110"
        )}>
          <Upload size={44} strokeWidth={2} />
        </div>
        
        <div className="text-center space-y-3 relative z-10">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {isDragActive ? "Drop files here" : "Select your files"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Drag and drop your PDFs or Images
          </p>
        </div>

        {/* Bottom Progress/Status Bar (Visual Only) */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-dark-border overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={isDragActive ? { x: "0%" } : { x: "-100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-full h-full bg-gradient-to-r from-brand-500 to-cyan-400"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
