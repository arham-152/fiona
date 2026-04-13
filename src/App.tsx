import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageItem } from './types';
import { extractPagesFromPdf, processImageFile, generatePdfFromPages, FILE_COLORS } from './lib/pdf-utils';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';

import { Dropzone } from './components/Dropzone';

const OrganizerGrid = lazy(() => import('./components/OrganizerGrid').then(m => ({ default: m.OrganizerGrid })));
const EditorModal = lazy(() => import('./components/EditorModal').then(m => ({ default: m.EditorModal })));

export default function App() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const newPages: PageItem[] = [];
      
      for (const file of files) {
        try {
          const color = FILE_COLORS[Math.floor(Math.random() * FILE_COLORS.length)];
          if (file.type === 'application/pdf') {
            const extracted = await extractPagesFromPdf(file, color);
            newPages.push(...extracted);
          } else if (file.type.startsWith('image/')) {
            const processed = await processImageFile(file, color);
            newPages.push(processed);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue with other files but maybe show a warning later
        }
      }
      
      if (newPages.length > 0) {
        setPages(prev => [...prev, ...newPages]);
      } else {
        setError('No valid pages could be extracted from the selected files.');
      }
    } catch (error) {
      console.error('Error in handleFilesAdded:', error);
      setError('An unexpected error occurred while processing files.');
    } finally {
      setIsProcessing(false);
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
    if (pages.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    
    // Use a small timeout to allow UI to update before heavy processing
    setTimeout(async () => {
      try {
        const pdfBytes = await generatePdfFromPages(pages);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organized-document-${new Date().getTime()}.pdf`;
        a.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (error) {
        console.error('Error generating PDF:', error);
        setError('Failed to generate PDF. The document might be too large or contain complex elements.');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
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
      className="min-h-screen bg-white dark:bg-brand-900 text-gray-900 dark:text-gray-100 selection:bg-brand-400/30 outline-none transition-colors duration-300"
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
        
        {/* Global Drag Overlay - Only show when grid is active */}
        <AnimatePresence>
          {isDragActive && pages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-emerald-600/20 backdrop-blur-sm border-4 border-dashed border-emerald-500 m-4 rounded-3xl pointer-events-none"
            >
              <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Loader2 className="animate-bounce" size={32} />
                </div>
                <p className="text-xl font-black text-white uppercase tracking-widest">Drop to add files</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-brand-600/5 blur-[120px] pointer-events-none -z-10" />

        <main className="min-h-screen flex flex-col">
          {pages.length === 0 ? (
            <div className="max-w-[1800px] mx-auto w-full px-4 py-12">
              <Dropzone 
                onFilesAdded={handleFilesAdded} 
                isDarkMode={isDarkMode}
                onSetTheme={(dark) => setIsDarkMode(dark)}
              />
            </div>
          ) : (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={48} /></div>}>
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
          {isProcessing && pages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-brand-950/80 backdrop-blur-md"
            >
              <Loader2 className="animate-spin text-brand-600" size={48} />
              <p className="mt-4 text-xs font-black text-brand-600 uppercase tracking-[0.3em]">Initializing...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
