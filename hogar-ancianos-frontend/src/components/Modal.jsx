import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children,
  footerContent = null
}) => {
  const modalRef = useRef(null);
  
  // Determinar el ancho del modal según el tamaño especificado
  const getModalWidth = () => {
    switch (size) {
      case 'sm': return 'max-w-md'; // 448px
      case 'lg': return 'max-w-4xl'; // 896px
      case 'xl': return 'max-w-6xl'; // 1152px
      case 'full': return 'max-w-full mx-4'; // Full width minus margin
      case 'md':
      default: return 'max-w-2xl'; // 672px
    }
  };
  
  useEffect(() => {
    // Capturar referencia al elemento modal para gestionar clics fuera del panel
    const modalElement = modalRef.current;
    
    // Prevenir scroll en el body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    // Handler para cerrar el modal al hacer clic fuera
    const handleOutsideClick = (e) => {
      if (modalElement && !modalElement.contains(e.target)) {
        onClose();
      }
    };
    
    // Handler para cerrar el modal con la tecla ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Agregar event listeners solo si el modal está abierto
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    // Limpieza al desmontar o cerrar
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;
  
  // Usar createPortal para renderizar el modal fuera del árbol de componentes principal
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div 
        ref={modalRef} 
        className={`${getModalWidth()} w-full bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Encabezado del modal */}
        <div className="p-4 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Contenido del modal con scroll si es necesario */}
        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
          {children}
        </div>
        
        {/* Footer opcional */}
        {footerContent && (
          <div className="p-4 sm:px-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footerContent}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;