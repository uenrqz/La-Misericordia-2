import React, { useState } from 'react';
import StatsCard from '../components/ui/StatsCard';
import ActionButton from '../components/ui/ActionButton';
import FinanceCard from '../components/ui/FinanceCard';
import ShortcutButton from '../components/ui/ShortcutButton';
import { formatCurrency } from '../utils/format';

const Donaciones = () => {
  const [donaciones] = useState([
    { id: 1, donante: 'Juan Pérez', tipo: 'Monetaria', monto: 1500, fecha: '2025-05-10' },
    { id: 2, donante: 'María García', tipo: 'Especie', monto: 0, descripcion: 'Ropa y alimentos', fecha: '2025-05-08' },
    { id: 3, donante: 'Luis Rodríguez', tipo: 'Monetaria', monto: 3000, fecha: '2025-05-05' },
    { id: 4, donante: 'Ana Castillo', tipo: 'Monetaria', monto: 2500, fecha: '2025-05-01' },
    { id: 5, donante: 'Empresa XYZ', tipo: 'Especie', monto: 0, descripcion: 'Medicamentos', fecha: '2025-04-28' }
  ]);

  // Calcular estadísticas de donaciones
  const totalMonetario = donaciones
    .filter(d => d.tipo === 'Monetaria')
    .reduce((sum, d) => sum + d.monto, 0);
  
  const donacionesEspecie = donaciones.filter(d => d.tipo === 'Especie').length;
  const donacionesMonetarias = donaciones.filter(d => d.tipo === 'Monetaria').length;
  const totalDonantes = [...new Set(donaciones.map(d => d.donante))].length;
  
  return (
    <div className="p-0 md:p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Gestión de Donaciones</h2>
        <p className="text-gray-500 text-sm">
          Administración de donaciones monetarias y en especie del hogar "La Misericordia"
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatsCard 
          to="#"
          icon={<i className="fas fa-dollar-sign h-4 w-4"></i>}
          title="Total Monetario"
          value={formatCurrency(totalMonetario)}
          description="En donaciones del mes"
          color="green"
        />
        
        <StatsCard 
          to="#"
          icon={<i className="fas fa-hand-holding-heart h-4 w-4"></i>}
          title="Donaciones"
          value={donaciones.length.toString()}
          description="Recibidas en total"
          color="blue"
        />
        
        <StatsCard 
          to="#"
          icon={<i className="fas fa-box-open h-4 w-4"></i>}
          title="En Especie"
          value={donacionesEspecie.toString()}
          description="Artículos y suministros"
          color="amber"
        />
        
        <StatsCard 
          to="#"
          icon={<i className="fas fa-users h-4 w-4"></i>}
          title="Donantes"
          value={totalDonantes.toString()}
          description="Personas y empresas"
          color="purple"
        />
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ActionButton 
          to="/app/donaciones/nueva"
          icon={<i className="fas fa-plus-circle h-5 w-5"></i>}
          title="Nueva Donación"
          description="Registrar ingreso monetario o en especie"
        />
        <ActionButton 
          to="/app/donaciones/recibos"
          icon={<i className="fas fa-receipt h-5 w-5"></i>}
          title="Generar Recibo"
          description="Emitir constancia de donación"
        />
        <ActionButton 
          to="/app/donaciones/reporte"
          icon={<i className="fas fa-chart-pie h-5 w-5"></i>}
          title="Ver Reportes"
          description="Estadísticas y gráficos"
        />
      </div>

      {/* Resumen financiero */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Resumen de Donaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FinanceCard 
            title="Donaciones Monetarias" 
            value={formatCurrency(totalMonetario)} 
            description={`${donacionesMonetarias} donaciones registradas`} 
            trend="up" 
          />
          <FinanceCard 
            title="Donaciones en Especie" 
            value={donacionesEspecie.toString()} 
            description="Artículos recibidos" 
            trend="neutral" 
          />
          <FinanceCard 
            title="Promedio por Donación" 
            value={formatCurrency(totalMonetario / (donacionesMonetarias || 1))} 
            description="Monto promedio" 
            trend="neutral" 
          />
        </div>
      </div>

      {/* Listado de donaciones recientes */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Donaciones Recientes</h3>
          <button className="text-white text-sm bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1">
            <i className="fas fa-list"></i>
            <span>Ver Todas</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donante</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto/Descripción</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donaciones.map((donacion) => (
                <tr key={donacion.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(donacion.fecha).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{donacion.donante}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      donacion.tipo === 'Monetaria' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donacion.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donacion.tipo === 'Monetaria' ? formatCurrency(donacion.monto) : donacion.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      <i className="fas fa-file-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ShortcutButton to="/app/donaciones/estadisticas" icon={<i className="fas fa-chart-bar h-5 w-5"></i>} label="Estadísticas" />
          <ShortcutButton to="/app/donaciones/donantes" icon={<i className="fas fa-address-book h-5 w-5"></i>} label="Donantes" />
          <ShortcutButton to="/app/donaciones/campanas" icon={<i className="fas fa-bullhorn h-5 w-5"></i>} label="Campañas" />
          <ShortcutButton to="/app/donaciones/exportar" icon={<i className="fas fa-file-export h-5 w-5"></i>} label="Exportar" />
        </div>
      </div>
    </div>
  );
};

export default Donaciones;