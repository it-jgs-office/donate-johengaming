import React from 'react';
import Card from './Card';

/**
 * Generic modal atom shared by user and admin interfaces.
 */
const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl', showCloseButton = true }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <Card 
        className={`p-6 sm:p-7 w-full ${maxWidth} max-h-[90vh] overflow-hidden !shadow-[0_24px_70px_rgba(15,42,95,0.24)] relative bg-[#ffffff]`} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="pb-4 mb-4 border-b border-[#e1e7ef] flex items-center justify-between pr-10">
            <h3 className="text-xl sm:text-2xl font-black text-[#0F2A5F] tracking-tight">{title}</h3>
          </div>
        )}
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute top-5 right-5 min-w-11 min-h-11 flex items-center justify-center rounded-xl border border-[#e1e7ef] bg-white text-[#0F2A5F] font-bold text-lg hover:bg-[#F0F7FF] shadow-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        )}
        <div className="max-h-[calc(90vh-10rem)] overflow-y-auto pr-1">
          {children}
        </div>
        {footer && (
          <div className="pt-4 mt-4 border-t border-[#e1e7ef]">
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Modal;
