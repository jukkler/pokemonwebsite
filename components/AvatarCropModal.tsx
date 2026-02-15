'use client';

/**
 * AvatarCropModal - Interaktives Crop-Modal für Avatar-Uploads
 * Verwendet react-easy-crop für Drag, Zoom & Pinch-Funktion
 */

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { CropArea } from '@/lib/image-processing';

interface AvatarCropModalProps {
  imageSrc: string;
  onComplete: (cropArea: CropArea) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({
  imageSrc,
  onComplete,
  onCancel,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Callback wenn Crop-Bereich sich ändert
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Callback wenn Bild geladen wurde
  const onMediaLoaded = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Upload mit Crop-Koordinaten starten
  const handleUpload = () => {
    if (croppedAreaPixels) {
      const cropArea: CropArea = {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      };
      onComplete(cropArea);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Avatar zuschneiden
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Ziehe & zoome, um den gewünschten Bildausschnitt auszuwählen
          </p>
        </div>

        {/* Crop-Bereich */}
        <div className="relative h-96 bg-gray-900">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-sm">Bild wird geladen...</div>
            </div>
          )}
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Zoom-Slider */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--background-tertiary)]">
          <label className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-[var(--background-secondary)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background-tertiary)] transition-all duration-300 font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] font-medium"
          >
            Hochladen
          </button>
        </div>
      </div>
    </div>
  );
}
