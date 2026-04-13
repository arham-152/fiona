import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageItem, Annotation } from '../types';
import { EditorHeader } from './editor/EditorHeader';
import { EditorSidebar } from './editor/EditorSidebar';
import { EditorCanvas } from './editor/EditorCanvas';
import { useEditorState } from '../hooks/useEditorState';
import { useCropState } from '../hooks/useCropState';

interface EditorModalProps {
  page: PageItem;
  onClose: () => void;
  onSave: (page: PageItem) => void;
  onDelete: (pageId: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  page,
  onClose,
  onSave,
  onDelete,
  onNext,
  onPrev,
  isFirst,
  isLast,
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'filter' | 'annotate'>('adjust');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  const {
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
    canUndo,
    canRedo,
    addToHistory
  } = useEditorState(page, onSave);

  const {
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    isCropping,
    setIsCropping,
    zoom,
    isApplying,
    isDetecting,
    imgRef,
    handleZoom,
    onImageLoad,
    handleApplyCrop,
    handleSmartSuggest
  } = useCropState(editedPage, setEditedPage, addToHistory);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleAddText = useCallback(() => {
    const newAnno: Annotation = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: 40,
      y: 40,
      text: 'New Text',
      color: '#6366F1',
      fontSize: 24,
    };
    addAnnotation(newAnno);
    setSelectedAnnotationId(newAnno.id);
    setActiveTab('annotate');
  }, [addAnnotation]);

  const handleAddRect = useCallback(() => {
    const newAnno: Annotation = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'rect',
      x: 40,
      y: 40,
      width: 20,
      height: 10,
      color: 'rgba(99, 102, 241, 0.3)',
    };
    addAnnotation(newAnno);
    setSelectedAnnotationId(newAnno.id);
    setActiveTab('annotate');
  }, [addAnnotation]);

  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = 20;
            const height = width / aspectRatio;
            
            const newAnno: Annotation = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'image',
              x: 40,
              y: 40,
              width: width,
              height: height,
              image: re.target?.result as string,
              color: 'transparent',
            };
            addAnnotation(newAnno);
            setSelectedAnnotationId(newAnno.id);
            setActiveTab('annotate');
          };
          img.src = re.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [addAnnotation]);

  if (!page) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full h-full max-w-[1600px] bg-white dark:bg-dark-bg sm:rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-y-auto lg:overflow-hidden flex flex-col border border-white/20 dark:border-dark-border"
        >
          <EditorHeader 
            pageNumber={editedPage.pageNumber}
            onClose={onClose}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden relative">
            <EditorCanvas 
              editedPage={editedPage}
              imgRef={imgRef}
              containerRef={containerRef}
              isCropping={isCropping}
              setIsCropping={setIsCropping}
              crop={crop}
              setCrop={setCrop}
              completedCrop={completedCrop}
              setCompletedCrop={setCompletedCrop}
              zoom={zoom}
              handleZoom={handleZoom}
              handleRotate={handleRotate}
              handleSmartSuggest={handleSmartSuggest}
              handleApplyCrop={handleApplyCrop}
              isDetecting={isDetecting}
              isApplying={isApplying}
              showGrid={true}
              onImageLoad={onImageLoad}
              filterStyle={filterStyle}
              selectedAnnotationId={selectedAnnotationId}
              setSelectedAnnotationId={setSelectedAnnotationId}
              editingAnnotationId={editingAnnotationId}
              updateAnnotation={updateAnnotation}
              commitAnnotationChange={() => addToHistory(editedPage)}
              removeAnnotation={removeAnnotation}
            />

            <EditorSidebar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              editedPage={editedPage}
              onRotate={handleRotate}
              onIsCropping={setIsCropping}
              onAddText={handleAddText}
              onAddRect={handleAddRect}
              onAddImage={handleAddImage}
              onAdjustment={handleAdjustment}
              onFilter={handleFilter}
              onDelete={() => onDelete(editedPage.id)}
              onSave={() => onSave(editedPage)}
              onPrev={onPrev}
              onNext={onNext}
              isFirst={isFirst}
              isLast={isLast}
              selectedAnnotationId={selectedAnnotationId}
              updateAnnotation={updateAnnotation}
              commitAnnotationChange={() => addToHistory(editedPage)}
            />
          </div>
        </motion.div>
      </div>
  );
};
