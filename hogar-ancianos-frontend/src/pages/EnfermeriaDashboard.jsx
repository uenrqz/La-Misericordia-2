import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDateEs, getCurrentDate } from '../utils/format';
import { getEnfermeriaDashboardData } from '../services/dashboard.service';

const EnfermeriaDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    residentes: { total: 0, activos: 0 },
    signosVitalesRecientes: [],
    evolucionesRecientes: [],
    medicamentosPendientes: 0
  });
  
  // Obtener hora del día para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };
  
  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getEnfermeriaDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Destructuring de los datos
  const { residentes, signosVitalesRecientes, evolucionesRecientes, medicamentosPendientes } = dashboardData;

  return (
    <div className="p-4">
      {/* Encabezado con saludo personalizado */}
      <h1 className="text-2xl font-bold text-gray-800">Inicio</h1>
      <h2 className="text-xl font-medium text-gray-700 mt-2">{getGreeting()}, Enfermera Jaqueline</h2>
      <p className="text-gray-500 text-sm">{getCurrentDate()}</p>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Resumen de Enfermería */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Resumen de Enfermería</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Pacientes Activos</h4>
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
                    <h4 className="text-gray-600 text-sm font-medium">Medicamentos Pendientes</h4>
                    <p className="text-3xl font-bold mt-1">{medicamentosPendientes}</p>
                    <p className="text-xs text-gray-500 mt-1">Por administrar hoy</p>
                  </div>
                  <div className="text-amber-500">
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Signos Vitales</h4>
                    <p className="text-3xl font-bold mt-1">{residentes.activos}</p>
                    <p className="text-xs text-gray-500 mt-1">Requieren registro</p>
                  </div>
                  <div className="text-green-500">
                    <i className="fas fa-heartbeat"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-gray-600 text-sm font-medium">Evoluciones</h4>
                    <p className="text-3xl font-bold mt-1">{evolucionesRecientes.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Notas recientes</p>
                  </div>
                  <div className="text-indigo-500">
                    <i className="fas fa-chart-line"></i>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Acciones de Enfermería */}
          <section className="mt-8">
            <h3 className="text-xl font-medium text-gray-700">Acciones de Enfermería</h3>
            <div className="bg-white rounded-lg border border-gray-100 p-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/app/signos-vitales/nuevo" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-heartbeat text-red-500"></i>
                    </div>
                    <h4 className="font-medium">Registrar Signos Vitales</h4>
                  </div>
                </Link>
                
                <Link to="/app/kardex" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-prescription-bottle-alt text-amber-500"></i>
                    </div>
                    <h4 className="font-medium">Administrar Medicamentos</h4>
                  </div>
                </Link>
                
                <Link to="/app/evoluciones/nueva" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-file-medical text-green-500"></i>
                    </div>
                    <h4 className="font-medium">Agregar Evolución</h4>
                  </div>
                </Link>
                
                <Link to="/app/residentes" className="flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center">
                  <div>
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-users text-blue-500"></i>
                    </div>
                    <h4 className="font-medium">Lista de Pacientes</h4>
                  </div>
                </Link>
              </div>
            </div>
          </section>
          
          {/* Sección de doble columna */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Signos Vitales Recientes */}
            <section>
              <h3 className="text-xl font-medium text-gray-700">Signos Vitales Recientes</h3>
              <div className="bg-white rounded-lg border border-gray-100 mt-4">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium">Últimos registros</h4>
                  <p className="text-sm text-gray-500">Últimos signos vitales capturados para los pacientes</p>
                </div>
                <div className="p-4">
                  {signosVitalesRecientes.length > 0 ? (
                    <div className="space-y-4">
                      {signosVitalesRecientes.slice(0, 3).map((sv, index) => (
                        <div key={`sv-${index}`}>
                          <div className="mb-1">
                            <span className="font-medium">{sv.residenteNombre || 'Paciente'}</span>
                            <span className="float-right text-xs text-gray-500">{formatDateEs(new Date(sv.fecha_registro || new Date()), true)}</span>
                          </div>
                          <div className="text-sm">
                            <span>PA: {sv.presion_arterial || '128/76'}</span>
                            <span className="mx-2">SpO2: {sv.saturacion_oxigeno || '97'}%</span>
                            <span>Temp: {sv.temperatura || '36.9'}°C</span>
                          </div>
                          {index < signosVitalesRecientes.slice(0, 3).length - 1 && <hr className="my-3" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No hay datos recientes disponibles</p>
                  )}
                </div>
              </div>
            </section>
            
            {/* Evoluciones Recientes */}
            <section>
              <h3 className="text-xl font-medium text-gray-700">Evoluciones Recientes</h3>
              <div className="bg-white rounded-lg border border-gray-100 mt-4">
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium">Últimas notas</h4>
                  <p className="text-sm text-gray-500">Notas de evolución recientes de los pacientes</p>
                </div>
                <div className="p-4">
                  {evolucionesRecientes.length > 0 ? (
                    <div className="space-y-4">
                      {evolucionesRecientes.slice(0, 2).map((ev, index) => (
                        <div key={`ev-${index}`}>
                          <div className="mb-1">
                            <span className="font-medium">{ev.residenteNombre || 'Pedro Ramírez'}</span>
                          </div>
                          <p className="text-sm">{ev.descripcion || 'Leve exacerbación durante la noche, respondió al tratamiento con nebulizador y aumento temporal de O2.'}</p>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">{ev.usuario_nombre || 'Enfermera Jaqueline'}</span>
                            <span className="text-xs text-gray-500">{formatDateEs(new Date(ev.fecha_registro || '2024-03-20'))}</span>
                          </div>
                          {index < evolucionesRecientes.slice(0, 2).length - 1 && <hr className="my-3" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1">
                        <span className="font-medium">Pedro Ramírez</span>
                      </div>
                      <p className="text-sm">Leve exacerbación durante la noche, respondió al tratamiento con nebulizador y aumento temporal de O2.</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Enfermera Jaqueline</span>
                        <span className="text-xs text-gray-500">20/3/2024</span>
                      </div>
                      <hr className="my-3" />
                      <div className="mb-1">
                        <span className="font-medium">Ricardo López</span>
                      </div>
                      <p className="text-sm">Se observó aumento del olvido. Sin cambios agudos.</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Nurse Smith</span>
                        <span className="text-xs text-gray-500">19/3/2024</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default EnfermeriaDashboard;