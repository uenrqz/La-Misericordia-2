import React from 'react';

/**
 * Componente para tarjetas financieras
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la tarjeta
 * @param {string} props.value - Valor monetario para mostrar
 * @param {string} props.description - Descripción adicional
 * @param {string} props.trend - Tendencia ('up', 'down', 'neutral', 'pending')
 * @returns {JSX.Element} Componente FinanceCard
 */
const FinanceCard = ({ title, value, description, trend = 'neutral' }) => {
  const trendColors = {
    up: "text-green-600",
    down: "text-amber-600",
    neutral: "text-blue-600",
    pending: "text-red-600"
  };

  const trendIcons = {
    up: <i className="fas fa-arrow-up h-4 w-4"></i>,
    down: <i className="fas fa-arrow-down h-4 w-4"></i>,
    neutral: null,
    pending: <i className="fas fa-credit-card h-4 w-4"></i>
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {trend !== "neutral" && (
          <div className={`${trendColors[trend]}`}>
            {trendIcons[trend]}
          </div>
        )}
      </div>
      <div className={`text-xl font-bold mt-2 ${trendColors[trend]} truncate`} title={value}>
        {value}
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate" title={description}>
        {description}
      </p>
    </div>
  );
};

export default FinanceCard;