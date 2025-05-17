import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente para botones de acceso rápido
 * @param {Object} props - Propiedades del componente
 * @param {string} props.to - Ruta de navegación
 * @param {ReactNode} props.icon - Icono para mostrar
 * @param {string} props.label - Etiqueta del botón
 * @returns {JSX.Element} Componente ShortcutButton
 */
const ShortcutButton = ({ to, icon, label }) => (
  <Link to={to} className="block" title={label}>
    <button className="w-full h-[70px] flex flex-col items-center justify-center gap-1 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      {icon}
      <span className="truncate max-w-full">{label}</span>
    </button>
  </Link>
);

export default ShortcutButton;