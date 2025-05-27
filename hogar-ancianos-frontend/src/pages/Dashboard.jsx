import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Link } from 'react-router-dom';
import { formatCurrency, getCurrentDate, formatDateEs } from '../utils/format';
import { getAdminDashboardData } from '../services/dashboard.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  // Obtener hora del día para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    residentes: { total: 0, activos: 0 },
    donaciones: [],
    totalDonaciones: 0,
    finanzas: {
      totalIngresos: 0,
      totalEgresos: 0,
      netBalance: 0
    },
    ocupacion: {
      total: 50,
      ocupados: 0,
      disponibles: 50
    },
    graficas: {
      monthlyData: {
        labels: [],
        datasets: []
      }
    }
  });
  
  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Destructuring de los datos con valores por defecto para evitar errores
  const { 
    residentes = { total: 0, activos: 0 }, 
    donaciones = [], 
    totalDonaciones = 0, 
    finanzas = { totalIngresos: 0, totalEgresos: 0, netBalance: 0 }, 
    ocupacion = { total: 50, ocupados: 0, disponibles: 50 }, 
    graficas = { monthlyData: { labels: [], datasets: [] } }
  } = dashboardData || {};
  
  // Datos para el gráfico de dona de ocupación
  const donutData = {
    labels: ['Ocupación', 'Disponible'],
    datasets: [
      {
        data: [ocupacion?.ocupados || 0, ocupacion?.disponibles || 50],
        backgroundColor: ['#1e3a8a', '#fbbf24'],
      },
    ],
  };

  // Placeholder para datos que aún no tenemos del backend
  const itemsForSale = 35;
  const pendingPayments = 5;
  const monthlyPaymentsTotal = 15000;

  return (
    <div className="p-4">
      {/* Encabezado con saludo personalizado */}
      <h1 className="text-2xl font-bold text-gray-800">Inicio</h1>
      <h2 className="text-xl font-medium text-gray-700 mt-2">{getGreeting()}, Administrador</h2>
      <p className="text-gray-500 text-sm">{getCurrentDate()}</p>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Panel Administrativo - Métricas Principales */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Panel Administrativo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Pacientes</h4>
                    <p className="text-3xl font-bold mt-1">{residentes.activos}</p>
                    <p className="text-xs text-gray-500 mt-1">De {residentes.total} registrados</p>
                  </div>
                  <div className="text-blue-500">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Donaciones</h4>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(totalDonaciones)}</p>
                    <p className="text-xs text-gray-500 mt-1">Recaudadas este período</p>
                  </div>
                  <div className="text-green-500">
                    <i className="fas fa-hand-holding-heart"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Balance</h4>
                    <p className={`text-3xl font-bold mt-1 ${finanzas.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(finanzas.netBalance))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {finanzas.netBalance >= 0 ? "Saldo positivo" : "Déficit"}
                    </p>
                  </div>
                  <div className={finanzas.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}>
                    <i className={`fas fa-arrow-${finanzas.netBalance >= 0 ? 'up' : 'down'}`}></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Artículos</h4>
                    <p className="text-3xl font-bold mt-1">{itemsForSale}</p>
                    <p className="text-xs text-gray-500 mt-1">Disponibles para venta</p>
                  </div>
                  <div className="text-amber-500">
                    <i className="fas fa-store"></i>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Acciones Administrativas */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Acciones Administrativas</h3>
            <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                <Link to="/app/residentes/nuevo" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-user-plus text-blue-500"></i>
                    </div>
                    <h4 className="font-medium">Nuevo Paciente</h4>
                  </div>
                </Link>
                
                <Link to="/app/residentes" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-users text-indigo-500"></i>
                    </div>
                    <h4 className="font-medium">Lista de Pacientes</h4>
                  </div>
                </Link>
                
                <Link to="/app/evoluciones" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-file-medical text-green-500"></i>
                    </div>
                    <h4 className="font-medium">Evoluciones</h4>
                  </div>
                </Link>
                
                <Link to="/app/ordenes-medicas" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-prescription text-purple-500"></i>
                    </div>
                    <h4 className="font-medium">Órdenes Médicas</h4>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* Resumen Financiero */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Resumen Financiero</h3>
            <div className="bg-white rounded-lg border border-gray-100 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-5">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Ingresos</h4>
                  <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(finanzas.totalIngresos)}</p>
                  <p className="text-xs text-gray-500">Donaciones y pagos</p>
                </div>
                <div className="p-5">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Egresos</h4>
                  <p className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(finanzas.totalEgresos)}</p>
                  <p className="text-xs text-gray-500">Operativos y suministros</p>
                </div>
                <div className="p-5">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Pagos Pendientes</h4>
                  <p className="text-2xl font-bold text-amber-600 mb-1">{formatCurrency(monthlyPaymentsTotal)}</p>
                  <p className="text-xs text-gray-500">{pendingPayments} pagos por cobrar</p>
                </div>
              </div>
            </div>
          </section>

          {/* Gráficos - Estadísticas */}
          <section className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="md:col-span-1 lg:col-span-2">
                <h3 className="text-xl font-medium text-gray-700">Balance Financiero</h3>
                <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Resumen Mensual</h4>
                    <Link to="/app/reportes" className="bg-yellow-500 text-white text-sm px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors flex items-center gap-1">
                      <i className="fas fa-chart-line"></i>
                      <span>Ver Reporte</span>
                    </Link>
                  </div>
                  <div className="h-64">
                    <Line data={graficas?.monthlyData || { labels: [], datasets: [] }} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-700">Ocupación del Asilo</h3>
                <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
                  <div className="mb-4">
                    <Doughnut data={donutData} options={{ responsive: true }} />
                  </div>
                  <div className="space-y-2 mt-4">
                    <p className="text-sm text-gray-600">Capacidad total: {ocupacion.total} residentes</p>
                    <p className="text-sm text-gray-600">Ocupados: {ocupacion.ocupados} espacios</p>
                    <p className="text-sm text-gray-600">Disponibles: {ocupacion.disponibles} espacios</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Accesos Rápidos */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Accesos Rápidos</h3>
            <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                <Link to="/app/donaciones" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-hand-holding-heart text-red-500"></i>
                    </div>
                    <h4 className="font-medium">Donaciones</h4>
                  </div>
                </Link>
                
                <Link to="/app/reportes" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-chart-bar text-blue-500"></i>
                    </div>
                    <h4 className="font-medium">Reportes</h4>
                  </div>
                </Link>
                
                <Link to="/app/usuarios" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-user-shield text-green-500"></i>
                    </div>
                    <h4 className="font-medium">Usuarios</h4>
                  </div>
                </Link>
                
                <Link to="/app/signos-vitales" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-heartbeat text-purple-500"></i>
                    </div>
                    <h4 className="font-medium">Signos Vitales</h4>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* Donaciones recientes */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Donaciones Recientes</h3>
            <div className="bg-white rounded-lg border border-gray-100 mt-4 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-medium">Historial de donaciones</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donante</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto/Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {donaciones.length > 0 ? (
                      donaciones.map((donacion, index) => (
                        <tr key={donacion.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {donacion.donante_nombre || 'Anónimo'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {donacion.tipo_donacion === 'monetaria' ? 'Monetaria' : 
                            donacion.tipo_donacion === 'especie' ? 'Especie' : 'Servicios'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {donacion.monto ? formatCurrency(donacion.monto) : 
                            donacion.valor_estimado ? formatCurrency(donacion.valor_estimado) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDateEs(new Date(donacion.fecha_donacion))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                          No hay donaciones recientes registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 text-center">
                <Link to="/app/donaciones" className="text-blue-500 hover:underline text-sm">
                  Ver todas las donaciones
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;