import React, { useState, useCallback, useRef } from 'react';
import { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { PageItem } from '../types';
import { getCroppedImg, rotateSize, getAutoTrimCrop } from '../lib/crop-utils';
import { analyzeImageForSmartCrop } from '../lib/gemini-ai';
import { detectSubject, getSmartCropFromSubject } from '../lib/ai-detection';

export const useCropState = (editedPage: PageItem, setEditedPage: React.Dispatch<React.SetStateAction<PageItem>>, addToHistory: (page: PageItem) => void) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isApplying, setIsApplying] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleZoom = useCallback((dir: 'in' | 'out') => {
    setZoom(prev => {
      const next = dir === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.max(0.1, Math.min(3, next));
    });
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 100 }, undefined, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }, []);

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current || isApplying) return;
    setIsApplying(true);
    
    try {
      const image = imgRef.current;
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.naturalWidth,
        image.naturalHeight,
        editedPage.rotation
      );

      const scaleX = bBoxWidth / image.width;
      const scaleY = bBoxHeight / image.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImage = await getCroppedImg(
        editedPage.dataUrl,
        pixelCrop,
        editedPage.rotation,
        { horizontal: false, vertical: false },
        editedPage.adjustments
      );
      
      if (croppedImage) {
        const updated = {
          ...editedPage,
          dataUrl: croppedImage,
          rotation: 0,
          adjustments: { brightness: 100, contrast: 100, saturation: 100 },
          isEdited: true
        };
        setEditedPage(updated);
        addToHistory(updated);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSmartSuggest = async () => {
    if (!imgRef.current) return;
    setIsDetecting(true);
    try {
      const trimCrop = await getAutoTrimCrop(editedPage.dataUrl);
      if (trimCrop) {
        const { width, height } = imgRef.current;
        const scaleX = width / imgRef.current.naturalWidth;
        const scaleY = height / imgRef.current.naturalHeight;

        const newCrop: Crop = {
          unit: '%',
          x: (trimCrop.x / imgRef.current.naturalWidth) * 100,
          y: (trimCrop.y / imgRef.current.naturalHeight) * 100,
          width: (trimCrop.width / imgRef.current.naturalWidth) * 100,
          height: (trimCrop.height / imgRef.current.naturalHeight) * 100
        };
        
        setCrop(newCrop);
        setCompletedCrop({
          unit: 'px',
          x: trimCrop.x * scaleX,
          y: trimCrop.y * scaleY,
          width: trimCrop.width * scaleX,
          height: trimCrop.height * scaleY
        });
        return;
      }

      const subject = await detectSubject(imgRef.current);
      if (subject) {
        const { width, height } = imgRef.current;
        const newCrop = getSmartCropFromSubject(subject.bbox, width, height);
        setCrop(newCrop);
        setCompletedCrop({
          unit: 'px',
          x: (newCrop.x / 100) * width,
          y: (newCrop.y / 100) * height,
          width: (newCrop.width / 100) * width,
          height: (newCrop.height / 100) * height
        });
        return;
      }

      const result = await analyzeImageForSmartCrop(editedPage.dataUrl);
      if (result && result.crop) {
        const { width, height } = imgRef.current;
        const newCrop: Crop = {
          unit: '%',
          x: result.crop.x / 10,
          y: result.crop.y / 10,
          width: result.crop.width / 10,
          height: result.crop.height / 10
        };
        setCrop(newCrop);
        setCompletedCrop({
          unit: 'px',
          x: (result.crop.x / 1000) * width,
          y: (result.crop.y / 1000) * height,
          width: (result.crop.width / 1000) * width,
          height: (result.crop.height / 1000) * height
        });
      }
    } catch (error) {
      console.error('Smart suggest failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return {
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    isCropping,
    setIsCropping,
    zoom,
    setZoom,
    isApplying,
    isDetecting,
    imgRef,
    handleZoom,
    onImageLoad,
    handleApplyCrop,
    handleSmartSuggest
  };
};
