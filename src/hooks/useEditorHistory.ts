import { useState, useCallback } from 'react';
import { PageItem } from '../types';

export const useEditorHistory = (initialPage: PageItem) => {
  const [history, setHistory] = useState<PageItem[]>([{ ...initialPage, annotations: initialPage.annotations || [] }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback((newPage: PageItem) => {
    setHistory(prev => {
      const last = prev[currentIndex];
      
      const hasChanged = !last || 
        last.dataUrl !== newPage.dataUrl || 
        last.rotation !== newPage.rotation || 
        last.filter !== newPage.filter ||
        JSON.stringify(last.adjustments) !== JSON.stringify(newPage.adjustments) ||
        last.annotations?.length !== newPage.annotations?.length ||
        (last.annotations && newPage.annotations && JSON.stringify(last.annotations) !== JSON.stringify(newPage.annotations));

      if (!hasChanged) return prev;

      const next = prev.slice(0, currentIndex + 1);
      const updated = [...next, newPage];
      
      const limited = updated.length > 20 ? updated.slice(updated.length - 20) : updated;
      setCurrentIndex(limited.length - 1);
      return limited;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const resetHistory = useCallback((page: PageItem) => {
    const initialState = { ...page, annotations: page.annotations || [] };
    setHistory([initialState]);
    setCurrentIndex(0);
  }, []);

  return {
    currentIndex,
    history,
    addToHistory,
    undo,
    redo,
    resetHistory,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  };
};
