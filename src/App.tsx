import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageItem } from './types';
import { extractPagesFromPdf, processImageFile, generatePdfFromPages, FILE_COLORS } from './lib/pdf-utils';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X, Sun, Moon, ShieldCheck } from 'lucide-react';

import { Dropzone } from './components/Dropzone';

const OrganizerGrid = lazy(() => import('./components/OrganizerGrid').then(m => ({ default: m.OrganizerGrid })));
const EditorModal = lazy(() => import('./components/EditorModal').then(m => ({ default: m.EditorModal })));

export default function App() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [activeEditorPage, setActiveEditorPage] = useState<PageItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Default to light mode
    return saved === 'dark'; 
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    // Force a repaint for some browsers
    root.style.display = 'none';
    root.offsetHeight; // trigger reflow
    root.style.display = '';
  }, [isDarkMode]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setProcessProgress(0);
    try {
      const newPages: PageItem[] = [];
      const totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const color = FILE_COLORS[Math.floor(Math.random() * FILE_COLORS.length)];
        
        if (file.type === 'application/pdf') {
          const extracted = await extractPagesFromPdf(file, color);
          newPages.push(...extracted);
        } else {
          const processed = await processImageFile(file, color);
          newPages.push(processed);
        }
        
        setProcessProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      setPages(prev => [...prev, ...newPages]);
    } catch (error) {
      console.error('Error processing files:', error);
      setError('Failed to process one or more files. Please ensure they are valid PDFs or images.');
    } finally {
      setIsProcessing(false);
      setProcessProgress(0);
    }
  }, []);

  const handleReorder = (newPages: PageItem[]) => {
    setPages(newPages);
  };

  const handleDelete = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    if (activeEditorPage?.id === id) setActiveEditorPage(null);
  };

  const handleRotate = (id: string) => {
    setPages(prev => prev.map(p => 
      p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const handleSavePage = (updatedPage: PageItem) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    setActiveEditorPage(null);
  };

  const handleDownload = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await generatePdfFromPages(pages);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'organized-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeIndex = activeEditorPage ? pages.findIndex(p => p.id === activeEditorPage.id) : -1;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => handleFilesAdded(acceptedFiles),
    noClick: true,
    noKeyboard: true,
    disabled: pages.length === 0, // Disable global dropzone when landing page dropzone is active
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    }
  } as any);

  return (
    <div 
      {...getRootProps()}
      className="min-h-screen bg-saas-bg-light dark:bg-saas-bg-dark text-slate-900 dark:text-slate-100 selection:bg-saas-accent-light/30 outline-none transition-colors duration-300"
    >
        <input {...getInputProps()} />
        <input 
          type="file" 
          id="add-more-input"
          multiple 
          accept="application/pdf,image/*" 
          className="hidden" 
          onChange={(e) => {
            const files = e.target.files;
            if (files) handleFilesAdded(Array.from(files));
            e.target.value = ''; // Reset for same file re-upload
          }}
        />

        {/* Premium Sticky Navbar */}
        <nav className="sticky top-0 z-[150] w-full border-b border-saas-border-light dark:border-saas-border-dark bg-saas-bg-light/80 dark:bg-saas-bg-dark/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-saas-accent-light dark:bg-saas-accent-dark rounded-lg shadow-lg glow-accent">
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain invert brightness-0" />
                </div>
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  DocFlow
                </span>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} />
                  <span>Secure</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-xl border border-saas-border-light dark:border-saas-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
                </button>
                {pages.length > 0 && (
                  <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-saas-accent-light to-indigo-600 dark:from-saas-accent-dark dark:to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>Export PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Global Drag Overlay - Only show when grid is active */}
        <AnimatePresence>
          {isDragActive && pages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-saas-accent-dark/10 backdrop-blur-sm border-4 border-dashed border-saas-accent-dark m-4 rounded-3xl pointer-events-none"
            >
              <div className="bg-saas-card-dark p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-saas-border-dark">
                <div className="w-16 h-16 rounded-full bg-saas-accent-dark/20 flex items-center justify-center text-saas-accent-dark glow-accent">
                  <Loader2 className="animate-bounce" size={32} />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">Drop to add files</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-saas-accent-dark/5 blur-[120px] pointer-events-none -z-10" />

        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {pages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Dropzone 
                onFilesAdded={handleFilesAdded} 
                isDarkMode={isDarkMode}
                onSetTheme={(dark) => setIsDarkMode(dark)}
              />
            </div>
          ) : (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-saas-accent-light dark:text-saas-accent-dark" size={48} /></div>}>
              <OrganizerGrid
                pages={pages}
                onReorder={handleReorder}
                onEdit={setActiveEditorPage}
                onDelete={handleDelete}
                onRotate={handleRotate}
                isProcessing={isProcessing}
                isDarkMode={isDarkMode}
                onSetTheme={(dark) => setIsDarkMode(dark)}
                onAddMore={() => {
                  document.getElementById('add-more-input')?.click();
                }}
                onClearAll={() => {
                  setPages([]);
                }}
                onDownload={handleDownload}
              />
            </Suspense>
          )}
        </main>

        <AnimatePresence>
          {activeEditorPage && (
            <Suspense fallback={null}>
              <EditorModal
                page={activeEditorPage}
                onSave={handleSavePage}
                onClose={() => setActiveEditorPage(null)}
                onDelete={handleDelete}
                onNext={() => setActiveEditorPage(pages[activeIndex + 1])}
                onPrev={() => setActiveEditorPage(pages[activeIndex - 1])}
                isFirst={activeIndex === 0}
                isLast={activeIndex === pages.length - 1}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4"
            >
              <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-red-500">
                <p className="text-sm font-bold">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md"
            >
              <div className="p-8 rounded-3xl bg-saas-card-dark border border-saas-border-dark shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-saas-accent-dark/20 border-t-saas-accent-dark animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-saas-accent-dark rounded-full glow-accent" />
                  </div>
                </div>
                <div className="text-center w-full">
                  <p className="text-xl font-bold text-white tracking-tight">Processing Document</p>
                  <div className="mt-6 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-saas-accent-dark to-saas-glow-dark"
                      initial={{ width: 0 }}
                      animate={{ width: `${processProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{processProgress}% Complete</p>
                    <p className="text-[10px] text-saas-accent-dark font-bold uppercase tracking-widest">Optimizing</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
