import React from 'react';

/**
 * Componente Button con diferentes variantes
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Contenido del botón
 * @param {string} props.variant - Variante del botón ('default', 'outline', 'ghost')
 * @param {string} props.size - Tamaño del botón ('default', 'sm', 'lg')
 * @param {string} props.className - Clases CSS adicionales
 * @param {function} props.onClick - Función a ejecutar al hacer clic
 * @returns {JSX.Element} Componente Button
 */
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '',
  onClick,
  ...props 
}) => {
  // Estilos para diferentes variantes
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-amber-500 text-white hover:bg-amber-600'
  };

  // Estilos para diferentes tamaños
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    default: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  return (
    <button 
      className={`
        ${variantStyles[variant] || variantStyles.default} 
        ${sizeStyles[size] || sizeStyles.default} 
        rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;