import React, { useState } from 'react';
import StatsCard from '../components/ui/StatsCard';
import ActionButton from '../components/ui/ActionButton';
import FinanceCard from '../components/ui/FinanceCard';
import ShortcutButton from '../components/ui/ShortcutButton';
import SesionSAT from '../components/donaciones/SesionSAT';
import * as satService from '../services/sat.service';
import { formatCurrency } from '../utils/format';

const Donaciones = () => {
  const [donaciones] = useState([
    { id: 1, donante: 'Juan Pérez', tipo: 'Monetaria', monto: 1500, fecha: '2025-05-10' },
    { id: 2, donante: 'María García', tipo: 'Especie', monto: 0, descripcion: 'Ropa y alimentos', fecha: '2025-05-08' },
    { id: 3, donante: 'Luis Rodríguez', tipo: 'Monetaria', monto: 3000, fecha: '2025-05-05' },
    { id: 4, donante: 'Ana Castillo', tipo: 'Monetaria', monto: 2500, fecha: '2025-05-01' },
    { id: 5, donante: 'Empresa XYZ', tipo: 'Especie', monto: 0, descripcion: 'Medicamentos', fecha: '2025-04-28' }
  ]);

  // Estado para controlar si la sesión de SAT está activa
  const [sesionSATActiva, setSesionSATActiva] = useState(false);
  
  // Estado para manejar los recibos y mensajes
  const [loadingRecibo, setLoadingRecibo] = useState(false);
  const [mensajeRecibo, setMensajeRecibo] = useState(null);

  // Manejar cambio en el estado de la sesión
  const handleSesionChange = (isActive) => {
    setSesionSATActiva(isActive);
  };

  // Función para generar un recibo SAT
  const handleGenerarRecibo = async (donacionId) => {
    if (!sesionSATActiva) {
      setMensajeRecibo({
        tipo: 'error',
        texto: 'Debe iniciar sesión con SAT para generar recibos electrónicos'
      });
      return;
    }
    
    setLoadingRecibo(true);
    setMensajeRecibo(null);
    
    try {
      const resultado = await satService.generarReciboDonacion(donacionId);
      
      if (resultado.success) {
        setMensajeRecibo({
          tipo: 'exito',
          texto: 'Recibo electrónico generado correctamente',
          recibo: resultado.recibo
        });
        
        // Aquí podríamos abrir una nueva ventana para ver el PDF del recibo
        if (resultado.recibo && resultado.recibo.xml_url) {
          window.open(resultado.recibo.xml_url, '_blank');
        }
      } else {
        setMensajeRecibo({
          tipo: 'error',
          texto: resultado.mensaje || 'Error al generar el recibo electrónico'
        });
      }
    } catch (error) {
      setMensajeRecibo({
        tipo: 'error',
        texto: 'Error al comunicarse con el servicio de facturación electrónica'
      });
      console.error('Error al generar recibo:', error);
    } finally {
      setLoadingRecibo(false);
    }
  };

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
          Administre las donaciones recibidas y emita recibos electrónicos
        </p>
      </div>

      {/* Panel de Sesión SAT (visible solo para usuarios con rol admin/contabilidad) */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Facturación Electrónica SAT</h3>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${sesionSATActiva ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium">
              {sesionSATActiva ? 'Sesión activa' : 'No conectado'}
            </span>
          </div>
        </div>
        <SesionSAT onSesionChange={handleSesionChange} />
      </div>

      {/* Mensaje de resultado para recibos SAT */}
      {mensajeRecibo && (
        <div className={`mb-6 p-4 rounded-md ${mensajeRecibo.tipo === 'exito' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <i className={`fas ${mensajeRecibo.tipo === 'exito' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${mensajeRecibo.tipo === 'exito' ? 'text-green-800' : 'text-red-800'}`}>
                {mensajeRecibo.texto}
              </p>
              {mensajeRecibo.recibo && (
                <div className="mt-2 text-sm text-gray-700">
                  <p>No. de Serie: {mensajeRecibo.recibo.serie}-{mensajeRecibo.recibo.numero}</p>
                  <p>UUID: {mensajeRecibo.recibo.uuid}</p>
                  <p>Fecha: {new Date(mensajeRecibo.recibo.fecha).toLocaleDateString('es-GT')}</p>
                </div>
              )}
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setMensajeRecibo(null)}
                  className={`inline-flex rounded-md p-1.5 ${mensajeRecibo.tipo === 'exito' ? 'text-green-500 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de donaciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          to="#"
          icon={<i className="fas fa-money-bill-wave h-4 w-4"></i>}
          title="Monetarias"
          value={formatCurrency(totalMonetario)}
          description="Total recibido"
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
            description="Artículos y servicios" 
            trend="neutral"
          />
          <FinanceCard 
            title="Promedio por Donación" 
            value={formatCurrency(donacionesMonetarias > 0 ? totalMonetario / donacionesMonetarias : 0)} 
            description="En donaciones monetarias" 
            trend="up"
          />
        </div>
      </div>

      {/* Tabla de donaciones recientes */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Donaciones Recientes</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donante
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto/Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donaciones.map((donacion) => (
                <tr key={donacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{donacion.donante}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${donacion.tipo === 'Monetaria' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {donacion.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {donacion.tipo === 'Monetaria' 
                        ? formatCurrency(donacion.monto)
                        : donacion.descripcion
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(donacion.fecha).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {/* Ver detalles */}}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Ver
                    </button>
                    <button 
                      onClick={() => {/* Editar */}}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleGenerarRecibo(donacion.id)}
                      className={`${sesionSATActiva ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}`}
                      disabled={!sesionSATActiva || loadingRecibo}
                      title={sesionSATActiva ? 'Generar recibo SAT' : 'Inicie sesión con SAT para generar recibos'}
                    >
                      {loadingRecibo ? 'Generando...' : 'Recibo SAT'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-center">
          <button className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800">
            Ver todas las donaciones
          </button>
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
