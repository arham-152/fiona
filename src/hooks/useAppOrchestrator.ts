import { useState, useCallback, useEffect } from 'react';
import { PageItem, ToolType } from '../types';
import { extractPagesFromPdf, processImageFile, generatePdfFromPages, applyAdjustmentsToImage, FILE_COLORS } from '../lib/pdf-utils';
import JSZip from 'jszip';

export function useAppOrchestrator() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [firstFileName, setFirstFileName] = useState<string>('');
  const [activeTool, setActiveTool] = useState<ToolType>('organizer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEditorPage, setActiveEditorPage] = useState<PageItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
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
    root.style.display = 'none';
    root.offsetHeight; 
    root.style.display = '';
  }, [isDarkMode]);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const newPages: PageItem[] = [];
      
      if (files.length > 0 && !firstFileName) {
        const nameWithoutExt = files[0].name.split('.').slice(0, -1).join('.') || files[0].name;
        setFirstFileName(nameWithoutExt);
      }
      
      for (const file of files) {
        try {
          const color = FILE_COLORS[Math.floor(Math.random() * FILE_COLORS.length)];
          if (file.type === 'application/pdf') {
            const extracted = await extractPagesFromPdf(file, color);
            setPages(prev => [...prev, ...extracted]);
          } else if (file.type.startsWith('image/') && activeTool === 'organizer') {
            const processed = await processImageFile(file, color);
            setPages(prev => [...prev, processed]);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
        }
      }
      
      if (pages.length === 0 && files.length > 0) {
        // Check if we actually added anything after the loop
        // (Note: pages here is the stale value from closure, but that's okay for a fallback check)
      }
    } catch (error) {
      console.error('Error in handleFilesAdded:', error);
      setError('An unexpected error occurred while processing files.');
    } finally {
      setIsProcessing(false);
    }
  }, [activeTool, firstFileName]);

  const handleReorder = useCallback((newPages: PageItem[]) => {
    setPages(newPages);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setActiveEditorPage(prev => prev?.id === id ? null : prev);
  }, []);

  const handleRotate = useCallback((id: string) => {
    setPages(prev => prev.map(p => 
      p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  }, []);

  const handleSavePage = useCallback((updatedPage: PageItem) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    setActiveEditorPage(null);
  }, []);

  const handleDownload = useCallback(async () => {
    if (pages.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const pdfBytes = await generatePdfFromPages(pages);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = firstFileName || 'document';
      a.download = `${fileName} V1-ORGANIZER.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // Automatically clear workspace after download
      handleClearAll();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF.');
    } finally {
      setIsProcessing(false);
    }
  }, [pages, isProcessing, firstFileName]);

  const handleDownloadAllJpgs = useCallback(async () => {
    if (pages.length === 0 || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      for (const page of pages) {
        // Bake adjustments and annotations for the download
        const finalDataUrl = await applyAdjustmentsToImage(page);
        const response = await fetch(finalDataUrl);
        const blob = await response.blob();
        zip.file(`page-${page.pageNumber}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const fileName = firstFileName || 'images';
      a.download = `${fileName} V1-CONVERTER.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      setError('Failed to generate ZIP file.');
    } finally {
      setIsProcessing(false);
    }
  }, [pages, isProcessing, firstFileName]);

  const handleClearAll = useCallback(() => {
    setPages([]);
    setFirstFileName('');
  }, []);

  const handleToolChange = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    setPages([]);
    setFirstFileName('');
  }, []);

  return {
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
  };
}
