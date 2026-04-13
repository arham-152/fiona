import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ChevronDown, LayoutGrid, Sun, Moon, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { ToolType } from '../types';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  onFilesAdded, 
  isDarkMode, 
  onSetTheme,
  activeTool,
  onToolChange
}) => {
  const [logoError, setLogoError] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: activeTool === 'organizer' 
      ? {
          'application/pdf': ['.pdf'],
          'image/*': ['.jpg', '.jpeg', '.png', '.webp']
        }
      : {
          'application/pdf': ['.pdf']
        }
  } as any);

  const tools = [
    { 
      id: 'organizer' as ToolType, 
      name: 'Document Organizer', 
      desc: 'Rearrange, rotate and edit PDF pages',
      icon: <LayoutGrid size={20} />
    },
    { 
      id: 'converter' as ToolType, 
      name: 'PDF to JPG Converter', 
      desc: 'Convert PDF pages into high-quality images',
      icon: <ImageIcon size={20} />
    }
  ];

  const currentTool = tools.find(t => t.id === activeTool) || tools[0];

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
      <div className="mb-20 w-full max-w-lg flex flex-col items-center gap-12">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="w-32 h-32 flex items-center justify-center bg-white dark:bg-dark-card rounded-[40px] overflow-hidden shadow-saas-2xl p-4 border border-slate-100 dark:border-dark-border relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {logoError ? (
            <div className="text-brand-600 dark:text-brand-500 font-black text-3xl tracking-tighter relative z-10">DOC</div>
          ) : (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10 filter drop-shadow-lg"
              onError={() => setLogoError(true)}
            />
          )}
        </motion.div>
        
        <div className="relative w-full">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between p-5 glass rounded-[32px] shadow-saas-xl w-full group transition-all hover:border-brand-500/50 hover:shadow-saas-2xl"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-brand-600/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                {currentTool.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-1">Active Tool</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{currentTool.name}</span>
              </div>
            </div>
            <div className={clsx("pr-4 text-slate-300 dark:text-slate-600 transition-transform duration-500", isDropdownOpen && "rotate-180")}>
              <ChevronDown size={24} strokeWidth={2.5} />
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-6 p-4 glass rounded-[40px] shadow-saas-2xl z-[60] border border-white/20 dark:border-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onToolChange(tool.id);
                        setIsDropdownOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-5 p-5 rounded-[24px] transition-all group relative overflow-hidden",
                        activeTool === tool.id 
                          ? "bg-brand-500 text-white shadow-saas-lg" 
                          : "hover:bg-slate-50 dark:hover:bg-dark-section/50 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <div className={clsx(
                        "p-3 rounded-xl transition-colors shrink-0",
                        activeTool === tool.id ? "bg-white/20" : "bg-slate-100 dark:bg-dark-border group-hover:bg-brand-500/10"
                      )}>
                        {tool.icon}
                      </div>
                      <div className="flex flex-col text-left flex-1 min-w-0">
                        <span className="text-base font-bold truncate">{tool.name}</span>
                        <span className={clsx("text-xs truncate font-medium", activeTool === tool.id ? "text-white/70" : "text-slate-400")}>
                          {tool.desc}
                        </span>
                      </div>
                      {activeTool === tool.id && <Check size={20} className="text-white shrink-0" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Dropzone Area */}
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01, y: -4 }}
        whileTap={{ scale: 0.99 }}
        className={clsx(
          "relative w-full max-w-4xl aspect-[2.2/1] border-2 border-dashed rounded-[64px] transition-all duration-700 cursor-pointer flex flex-col items-center justify-center gap-10 group overflow-hidden",
          isDragActive 
            ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 scale-[1.02] animate-border-glow shadow-saas-2xl" 
            : "border-slate-200 dark:border-dark-border hover:border-brand-500 bg-white/40 dark:bg-dark-card/20 shadow-saas-xl backdrop-blur-sm"
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
        
        <div className="text-center space-y-3 relative z-10 px-8">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {isDragActive ? "Drop files here" : activeTool === 'organizer' ? "Select your files" : "Convert PDF to JPG"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            {activeTool === 'organizer' 
              ? "Drag and drop your PDFs or Images" 
              : "Upload your PDF and convert pages into high-quality JPG images"}
          </p>
        </div>

        {/* Bottom Progress/Status Bar (Visual Only) */}
        <div className="absolute bottom-0 left-0 w-full h-0 bg-slate-100 dark:bg-dark-border overflow-hidden border-none">
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
