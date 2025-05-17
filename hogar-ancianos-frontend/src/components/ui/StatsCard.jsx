import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente para mostrar tarjetas de estadísticas
 * @param {Object} props - Propiedades del componente
 * @param {string} props.to - Ruta de navegación
 * @param {ReactNode} props.icon - Icono para mostrar
 * @param {string} props.title - Título de la tarjeta
 * @param {string} props.value - Valor principal a mostrar
 * @param {string} props.description - Descripción adicional
 * @param {string} props.color - Color de la tarjeta ('blue', 'green', 'red', 'amber', 'purple', 'indigo')
 * @returns {JSX.Element} Componente StatsCard
 */
const StatsCard = ({ to, icon, title, value, description, color = 'blue' }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    red: "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-500",
    purple: "bg-purple-50 text-purple-500",
    indigo: "bg-indigo-50 text-indigo-500"
  };

  const textColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600"
  };

  return (
    <Link to={to} className="block">
      <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium truncate mr-2">{title}</h3>
          <div className={`p-1.5 rounded-full ${colors[color]}`}>
            {icon}
          </div>
        </div>
        <div className={`text-2xl font-bold ${textColors[color]} truncate`} title={value}>
          {value}
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate" title={description}>
          {description}
        </p>
      </div>
    </Link>
  );
};

export default StatsCard;