import { useState, useCallback, useEffect, useMemo } from 'react';
import { PageItem, Annotation } from '../types';
import { useEditorHistory } from './useEditorHistory';

export const useEditorState = (initialPage: PageItem, onSave: (page: PageItem) => void) => {
  const [editedPage, setEditedPage] = useState<PageItem>({ 
    ...initialPage,
    annotations: initialPage.annotations || []
  });
  
  const history = useEditorHistory(initialPage);

  useEffect(() => {
    const pageWithAnnotations = {
      ...initialPage,
      annotations: initialPage.annotations || []
    };
    setEditedPage(pageWithAnnotations);
    history.resetHistory(pageWithAnnotations);
  }, [initialPage]);

  const handleRotate = useCallback((dir: 'left' | 'right') => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        rotation: (prev.rotation + (dir === 'left' ? -90 : 90)) % 360
      };
      history.addToHistory(updated);
      return updated;
    });
  }, [history]);

  const handleAdjustment = useCallback((key: keyof PageItem['adjustments'], value: number) => {
    setEditedPage(prev => ({
      ...prev,
      adjustments: { ...prev.adjustments, [key]: value }
    }));
  }, []);

  // Debounced history for adjustments
  useEffect(() => {
    const timer = setTimeout(() => {
      history.addToHistory(editedPage);
    }, 800);
    return () => clearTimeout(timer);
  }, [editedPage.adjustments, editedPage.filter, editedPage.rotation]);

  const handleFilter = useCallback((filter: PageItem['filter']) => {
    setEditedPage(prev => {
      const updated = { ...prev, filter };
      history.addToHistory(updated);
      return updated;
    });
  }, [history]);

  const handleReset = useCallback(() => {
    const resetState = { 
      ...initialPage,
      annotations: initialPage.annotations || [],
      filter: 'none'
    };
    setEditedPage(resetState);
    history.resetHistory(resetState);
  }, [initialPage, history]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setEditedPage(prev => ({
      ...prev,
      annotations: (prev.annotations || []).map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: [...(prev.annotations || []), annotation]
      };
      history.addToHistory(updated);
      return updated;
    });
  }, [history]);

  const removeAnnotation = useCallback((id: string) => {
    setEditedPage(prev => {
      const updated = {
        ...prev,
        annotations: (prev.annotations || []).filter(a => a.id !== id)
      };
      history.addToHistory(updated);
      return updated;
    });
  }, [history]);

  const filterStyle = useMemo(() => ({
    filter: `brightness(${editedPage.adjustments.brightness}%) contrast(${editedPage.adjustments.contrast}%) saturate(${editedPage.adjustments.saturation}%) ${
      editedPage.filter === 'grayscale' ? 'grayscale(100%)' : 
      editedPage.filter === 'punch' ? 'contrast(120%) saturate(120%)' :
      editedPage.filter === 'golden' ? 'sepia(30%) saturate(140%) brightness(110%)' :
      editedPage.filter === 'radiate' ? 'brightness(115%) saturate(130%)' :
      editedPage.filter === 'warm-contrast' ? 'sepia(10%) contrast(110%) saturate(110%)' :
      editedPage.filter === 'calm' ? 'saturate(80%) brightness(105%)' :
      editedPage.filter === 'cool-light' ? 'hue-rotate(10deg) saturate(90%) brightness(110%)' :
      editedPage.filter === 'vivid-cool' ? 'saturate(140%) hue-rotate(10deg)' :
      editedPage.filter === 'dramatic-cool' ? 'contrast(130%) hue-rotate(20deg) saturate(80%)' : ''
    }`,
  }), [editedPage.adjustments, editedPage.filter]);

  const handleUndo = useCallback(() => {
    const prev = history.undo();
    if (prev) setEditedPage(prev);
  }, [history]);

  const handleRedo = useCallback(() => {
    const next = history.redo();
    if (next) setEditedPage(next);
  }, [history]);

  return {
    editedPage,
    setEditedPage,
    handleRotate,
    handleAdjustment,
    handleFilter,
    handleReset,
    updateAnnotation,
    addAnnotation,
    removeAnnotation,
    filterStyle,
    handleUndo,
    handleRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    addToHistory: history.addToHistory
  };
};
