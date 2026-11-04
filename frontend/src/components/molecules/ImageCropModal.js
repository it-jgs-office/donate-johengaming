'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Modal from '../atoms/Modal';
import Button from '../atoms/Button';

const ImageCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  title = 'Sesuaikan Foto Profil',
  aspect = 1,
  cropShape = 'round',
  outputWidth = 512,
  outputHeight = 512,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Crop error:', error);
      alert('Gagal crop gambar');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Crop Area */}
        <div className="relative w-full h-80 bg-[#1a1a1a] rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.5}
          />
        </div>

        {/* Instructions */}
        <div className="bg-[#1a1a1a] border border-[#2563EB]/20 rounded-lg p-3">
          <p className="text-xs text-[#2563EB]/80 font-mono text-center">
            💡 <strong>Tips:</strong> Geser foto untuk mengatur posisi, scroll mouse untuk zoom in/out
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="flex-1"
          >
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper function to crop image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, outputWidth, outputHeight) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
    }, 'image/jpeg', 0.9);
  });
}

export default ImageCropModal;
