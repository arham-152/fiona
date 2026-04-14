import React, { Suspense, lazy } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { useAppOrchestrator } from './hooks/useAppOrchestrator';
import { Dropzone } from './components/Dropzone';

const OrganizerGrid = lazy(() => import('./components/OrganizerGrid').then(m => ({ default: m.OrganizerGrid })));
const ConverterGrid = lazy(() => import('./components/ConverterGrid').then(m => ({ default: m.ConverterGrid })));
const EditorModal = lazy(() => import('./components/EditorModal').then(m => ({ default: m.EditorModal })));

export default function App() {
  const {
    pages,
    activeTool,
    isProcessing,
    error,
    setError,
    activeEditorPage,
    setActiveEditorPage,
    isDarkMode,
    setIsDarkMode,
    handleFilesAdded,
    handleReorder,
    handleDelete,
    handleRotate,
    handleSavePage,
    handleDownload,
    handleDownloadAllJpgs,
    handleClearAll,
    handleToolChange
  } = useAppOrchestrator();

  const activeIndex = activeEditorPage ? pages.findIndex(p => p.id === activeEditorPage.id) : -1;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesAdded,
    noClick: true,
    noKeyboard: true,
    disabled: pages.length === 0,
    accept: activeTool === 'organizer' 
      ? { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }
      : { 'application/pdf': ['.pdf'] }
  } as any);

  return (
    <div 
      {...getRootProps()}
      className="min-h-screen bg-white dark:bg-dark-bg text-slate-900 dark:text-slate-100 selection:bg-brand-500/30 outline-none transition-colors duration-500"
    >
      <input {...getInputProps()} />
      <input 
        type="file" 
        id="add-more-input"
        multiple 
        accept={activeTool === 'organizer' ? "application/pdf,image/*" : "application/pdf"}
        className="hidden" 
        onChange={(e) => {
          const files = e.target.files;
          if (files) handleFilesAdded(Array.from(files));
          e.target.value = '';
        }}
      />
      
      <AnimatePresence>
        {isDragActive && pages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-500/10 backdrop-blur-md border-4 border-dashed border-brand-500 m-6 rounded-[48px] pointer-events-none"
          >
            <div className="bg-white dark:bg-dark-card p-10 rounded-[32px] shadow-saas-2xl flex flex-col items-center gap-6 border border-slate-100 dark:border-dark-border">
              <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                <Loader2 className="animate-spin" size={40} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Drop to add files</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[800px] bg-brand-500/5 blur-[160px] pointer-events-none -z-10" />

      <main className="min-h-screen flex flex-col">
        {pages.length === 0 && !isProcessing ? (
          <div className="max-w-[1800px] mx-auto w-full px-4 py-12">
            <Dropzone 
              onFilesAdded={handleFilesAdded} 
              isDarkMode={isDarkMode}
              onSetTheme={setIsDarkMode}
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </div>
        ) : (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={48} /></div>}>
            {activeTool === 'organizer' ? (
              <OrganizerGrid
                pages={pages}
                onReorder={handleReorder}
                onEdit={setActiveEditorPage}
                onDelete={handleDelete}
                onRotate={handleRotate}
                isProcessing={isProcessing}
                isDarkMode={isDarkMode}
                onSetTheme={setIsDarkMode}
                onAddMore={() => document.getElementById('add-more-input')?.click()}
                onClearAll={handleClearAll}
                onDownload={handleDownload}
              />
            ) : (
              <ConverterGrid 
                pages={pages}
                isProcessing={isProcessing}
                onClearAll={handleClearAll}
                onDownloadAll={handleDownloadAllJpgs}
                isDarkMode={isDarkMode}
                onSetTheme={setIsDarkMode}
              />
            )}
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
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4"
          >
            <div className="bg-red-600 text-white px-8 py-5 rounded-[24px] shadow-saas-2xl flex items-center justify-between gap-6 border border-red-500/50 backdrop-blur-xl">
              <p className="text-sm font-bold tracking-tight">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && pages.length === 0 && false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
              <Loader2 className="animate-spin text-brand-600 relative z-10" size={64} />
            </div>
            <p className="mt-8 text-sm font-black text-brand-600 uppercase tracking-[0.4em] animate-pulse">Processing...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
