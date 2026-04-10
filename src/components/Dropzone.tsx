import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  isDarkMode: boolean;
  onSetTheme: (dark: boolean) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded }) => {
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saas-accent-light/10 dark:bg-saas-accent-dark/10 text-saas-accent-light dark:text-saas-accent-dark text-xs font-bold uppercase tracking-wider mb-6 border border-saas-accent-light/20 dark:border-saas-accent-dark/20"
        >
          <Sparkles size={14} />
          <span>Professional PDF Tools</span>
        </motion.div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Organize your documents <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-saas-accent-light to-indigo-600 dark:from-saas-accent-dark dark:to-saas-glow-dark">
            with precision.
          </span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The most advanced PDF editor for modern teams. Merge, reorder, and edit your documents with 100% quality preservation.
        </p>
      </div>

      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`
          relative group cursor-pointer
          p-12 sm:p-20 border-2 border-dashed rounded-[32px] transition-all duration-300
          flex flex-col items-center justify-center gap-8
          ${isDragActive 
            ? 'border-saas-accent-light dark:border-saas-accent-dark bg-saas-accent-light/5 dark:bg-saas-accent-dark/5' 
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-saas-card-dark hover:border-saas-accent-light dark:hover:border-saas-accent-dark hover:shadow-2xl hover:shadow-saas-accent-light/10 dark:hover:shadow-saas-accent-dark/10 shadow-xl shadow-slate-200/50 dark:shadow-none'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-saas-accent-light to-indigo-600 dark:from-saas-accent-dark dark:to-indigo-500 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300 glow-accent">
            <Upload size={40} strokeWidth={2.5} />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-saas-accent-light/20 dark:bg-saas-accent-dark/20 blur-2xl rounded-full -z-10"
          />
        </div>
        
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isDragActive ? 'Drop your files here' : 'Select or drop your files'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Drag and drop your PDFs or images to start organizing
          </p>
        </div>

        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <FileText size={16} />
            <span>PDF Support</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <ImageIcon size={16} />
            <span>Image Support</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 rounded-tl-2xl group-hover:border-saas-accent-light dark:group-hover:border-saas-accent-dark transition-colors" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-slate-200 dark:border-slate-800 rounded-tr-2xl group-hover:border-saas-accent-light dark:group-hover:border-saas-accent-dark transition-colors" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-slate-200 dark:border-slate-800 rounded-bl-2xl group-hover:border-saas-accent-light dark:group-hover:border-saas-accent-dark transition-colors" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 rounded-br-2xl group-hover:border-saas-accent-light dark:group-hover:border-saas-accent-dark transition-colors" />
      </motion.div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { title: '100% Quality', desc: 'We preserve original vector data for perfect results.', icon: Sparkles },
          { title: 'Secure & Private', desc: 'Your files are processed locally in your browser.', icon: ShieldCheck },
          { title: 'Smart Editing', desc: 'Crop, rotate, and annotate with professional tools.', icon: LayoutGrid }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-saas-card-dark/50 backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-saas-accent-light/10 dark:bg-saas-accent-dark/10 flex items-center justify-center text-saas-accent-light dark:text-saas-accent-dark mb-4">
              <feature.icon size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{feature.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

import { ShieldCheck, LayoutGrid } from 'lucide-react';
