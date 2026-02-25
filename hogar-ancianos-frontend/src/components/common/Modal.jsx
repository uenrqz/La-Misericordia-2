import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Evitar scroll del documento cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FaTimes />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
