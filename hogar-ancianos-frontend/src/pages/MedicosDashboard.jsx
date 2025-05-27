import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getMedicosDashboardData } from '../services/dashboard.service';
import { formatDateEs, getCurrentDate } from '../utils/format';
import { useSystem } from '../contexts/SystemContext'; // Importar hook de SystemContext

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MedicosDashboard = () => {
  // Obtener contexto del sistema para manejo de errores
  const { handleError500, systemStatus } = useSystem();
  
  // Obtener hora del día para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    residentesActivos: 0,
    pacientesPorCategoria: {
      diabetes: 0,
      hipertension: 0,
      cardiacos: 0,
      demencia: 0,
      otros: 0
    },
    evolucionesPendientes: [],
    ordenesMedicasPendientes: [],
    ordenesRecientes: [],
    signos: {
      labels: [],
      datasets: []
    }
  });

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMedicosDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard médico:', error);
        setError('No fue posible cargar la información del dashboard');
        
        // Si es un error 500, manejarlo con el sistema de notificaciones
        if (error.response?.status === 500 || error.message?.includes('500')) {
          handleError500();
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Solo cargar datos si el sistema está online
    if (systemStatus.bff === 'online' || systemStatus.bff === 'unknown') {
      loadDashboardData();
    }
  }, [systemStatus.bff, handleError500]);

  // Datos para el gráfico de barras de condiciones médicas
  const condicionesMedicasData = {
    labels: ['Diabetes', 'Hipertensión', 'Cardíacos', 'Demencia', 'Otros'],
    datasets: [
      {
        label: 'Cantidad de Pacientes',
        data: [
          dashboardData.pacientesPorCategoria.diabetes,
          dashboardData.pacientesPorCategoria.hipertension,
          dashboardData.pacientesPorCategoria.cardiacos,
          dashboardData.pacientesPorCategoria.demencia,
          dashboardData.pacientesPorCategoria.otros
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }
    ]
  };

  return (
    <div className="p-4">
      {/* Encabezado con saludo personalizado */}
      <h1 className="text-2xl font-bold text-gray-800">Panel Médico</h1>
      <h2 className="text-xl font-medium text-gray-700 mt-2">{getGreeting()}, Doctor</h2>
      <p className="text-gray-500 text-sm">{getCurrentDate()}</p>
      
      {/* Indicador de estado del sistema */}
      {!loading && systemStatus.bff !== 'online' && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-center">
            <div className="mr-3">
              <i className="fas fa-exclamation-triangle text-yellow-600"></i>
            </div>
            <div>
              <p className="font-medium text-yellow-700">Estado del sistema: {systemStatus.bff}</p>
              <p className="text-sm text-yellow-600">Algunas funcionalidades podrían estar limitadas</p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="mt-4 p-5 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="mr-3 text-red-500">
              <i className="fas fa-exclamation-circle text-xl"></i>
            </div>
            <div>
              <p className="font-medium text-red-700">Error al cargar datos</p>
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 rounded"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Métricas Principales - Resumen Médico */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Resumen Médico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Pacientes Activos</h4>
                    <p className="text-3xl font-bold mt-1">{dashboardData.residentesActivos}</p>
                    <p className="text-xs text-gray-500 mt-1">En atención médica</p>
                  </div>
                  <div className="text-blue-500">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Evoluciones Pendientes</h4>
                    <p className="text-3xl font-bold mt-1">{dashboardData.evolucionesPendientes.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Por completar hoy</p>
                  </div>
                  <div className="text-amber-500">
                    <i className="fas fa-file-medical-alt"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Órdenes Médicas</h4>
                    <p className="text-3xl font-bold mt-1">{dashboardData.ordenesMedicasPendientes.length}</p>
                    <p className="text-xs text-gray-500 mt-1">En seguimiento</p>
                  </div>
                  <div className="text-purple-500">
                    <i className="fas fa-prescription"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Pacientes en Alerta</h4>
                    <p className="text-3xl font-bold mt-1">3</p>
                    <p className="text-xs text-gray-500 mt-1">Signos vitales anormales</p>
                  </div>
                  <div className="text-red-500">
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Acciones Rápidas para Médicos */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Acciones Rápidas</h3>
            <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/app/evoluciones/nueva" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-clipboard-list text-blue-500"></i>
                    </div>
                    <h4 className="font-medium">Registrar Evolución</h4>
                  </div>
                </Link>
                
                <Link to="/app/ordenes-medicas/nueva" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-prescription text-purple-500"></i>
                    </div>
                    <h4 className="font-medium">Nueva Orden Médica</h4>
                  </div>
                </Link>
                
                <Link to="/app/residentes" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-user-injured text-indigo-500"></i>
                    </div>
                    <h4 className="font-medium">Ver Pacientes</h4>
                  </div>
                </Link>
                
                <Link to="/app/signos-vitales" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-heartbeat text-red-500"></i>
                    </div>
                    <h4 className="font-medium">Signos Vitales</h4>
                  </div>
                </Link>
              </div>
            </div>
          </section>
          
          {/* Gráficos y Estadísticas */}
          <section className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-medium text-gray-700">Condiciones Médicas</h3>
                <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Distribución de Pacientes</h4>
                    <Link to="/app/reportes" className="bg-yellow-500 text-white text-sm px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors flex items-center gap-1">
                      <i className="fas fa-chart-line"></i>
                      <span>Ver Reporte</span>
                    </Link>
                  </div>
                  <div className="h-64">
                    <Bar data={condicionesMedicasData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-700">Seguimiento de Signos Vitales</h3>
                <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Últimas 72 horas</h4>
                    <Link to="/app/signos-vitales" className="text-blue-500 hover:text-blue-700">
                      Ver detalle
                    </Link>
                  </div>
                  <div className="h-64">
                    <Line data={dashboardData.signos} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pendientes Médicos */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Pendientes de Atención</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Evoluciones Pendientes */}
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium">Evoluciones Pendientes</h4>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.evolucionesPendientes.length > 0 ? (
                        dashboardData.evolucionesPendientes.map((evolucion, index) => (
                          <tr key={evolucion.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                              {evolucion.residente_nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${evolucion.prioridad === 'alta' ? 'bg-red-100 text-red-800' : 
                                evolucion.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}>
                                {evolucion.prioridad === 'alta' ? 'Alta' : 
                                evolucion.prioridad === 'media' ? 'Media' : 'Baja'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Link to={`/app/evoluciones/nueva?residente=${evolucion.residente_id}`} 
                                className="text-blue-500 hover:underline">
                                Registrar
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-center text-sm text-gray-500">
                            No hay evoluciones pendientes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 text-center">
                  <Link to="/app/evoluciones" className="text-blue-500 hover:underline text-sm">
                    Ver todas las evoluciones
                  </Link>
                </div>
              </div>

              {/* Órdenes Médicas Recientes */}
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium">Órdenes Médicas Recientes</h4>
                </div>
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.ordenesRecientes.length > 0 ? (
                        dashboardData.ordenesRecientes.map((orden, index) => (
                          <tr key={orden.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                              {orden.residente_nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {orden.tipo_orden || 'Medicación'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDateEs(new Date(orden.fecha_orden))}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${orden.estado === 'completada' ? 'bg-green-100 text-green-800' : 
                                orden.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'}`}>
                                {orden.estado === 'completada' ? 'Completada' : 
                                orden.estado === 'en_proceso' ? 'En proceso' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                            No hay órdenes médicas recientes
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 text-center">
                  <Link to="/app/ordenes-medicas" className="text-blue-500 hover:underline text-sm">
                    Ver todas las órdenes
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default MedicosDashboard;