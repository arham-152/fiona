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
      className="flex flex-col items-center justify-center min-h-[80vh] p-8 relative"
    >
      {/* Theme Toggle for Landing */}
      <div className="absolute top-0 right-0">
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-brand-800 rounded-full border border-gray-100 dark:border-brand-700 shadow-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetTheme(false);
            }}
            className={clsx(
              "p-2.5 rounded-full transition-all",
              !isDarkMode ? "bg-brand-600 text-white shadow-lg" : "text-gray-400 dark:text-brand-500 hover:bg-gray-100 dark:hover:bg-brand-700"
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
              "p-2.5 rounded-full transition-all",
              isDarkMode ? "bg-brand-600 text-white shadow-lg" : "text-gray-400 dark:text-brand-500 hover:bg-gray-100 dark:hover:bg-brand-700"
            )}
            title="Dark Mode"
          >
            <Moon size={18} />
          </button>
        </div>
      </div>

      {/* Tool Selector Bar */}
      <div className="mb-12 w-full max-w-md">
        <div className="flex items-center justify-between p-3 bg-white dark:bg-brand-800 border border-gray-100 dark:border-brand-700 rounded-full shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-600/10 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 rounded-full">
              <LayoutGrid size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 dark:text-brand-500 uppercase tracking-[0.2em]">Select Tool</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Document Organizer</span>
            </div>
          </div>
          <div className="pr-4 text-gray-400 dark:text-brand-600">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Main Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
          relative w-full max-w-3xl aspect-[2/1] border-2 border-dashed rounded-[48px] transition-all cursor-pointer
          flex flex-col items-center justify-center gap-6
          ${isDragActive ? 'border-brand-600 bg-brand-600/5' : 'border-gray-200 dark:border-brand-700 hover:border-brand-600 bg-white dark:bg-brand-800/50 shadow-sm'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-inner">
          <Upload size={40} strokeWidth={2.5} />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Select your files</h2>
          <p className="text-gray-500 dark:text-brand-400 font-medium">Supports Images and PDFs</p>
        </div>
      </div>
    </motion.div>
  );
};
