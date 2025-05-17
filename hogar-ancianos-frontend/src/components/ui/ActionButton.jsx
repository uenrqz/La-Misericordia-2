import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente para botones de acción
 * @param {Object} props - Propiedades del componente
 * @param {string} props.to - Ruta de navegación
 * @param {ReactNode} props.icon - Icono para mostrar
 * @param {string} props.title - Título del botón
 * @param {string} props.description - Descripción corta
 * @returns {JSX.Element} Componente ActionButton
 */
const ActionButton = ({ to, icon, title, description }) => (
  <Link to={to} className="block">
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-full text-blue-700">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-base truncate">{title}</h3>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

export default ActionButton;