import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaUser, FaCalendarAlt, FaEdit } from 'react-icons/fa';

const Evoluciones = () => {
  const [evoluciones, setEvoluciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroResidente, setFiltroResidente] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');

  useEffect(() => {
    const fetchEvoluciones = async () => {
      setIsLoading(true);
      try {
        // En un entorno real, esto sería una llamada al API
        // const response = await axios.get('/api/evoluciones');
        
        // Simulación con timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos simulados para desarrollo
        const evolucionesSimuladas = [
          {
            id: 1,
            fecha: '13/05/2025',
            hora: '10:30',
            residente: {
              id: 1,
              nombre: 'María González',
              habitacion: '101'
            },
            responsable: 'Dr. Rodríguez',
            descripcion: 'Paciente presenta mejora en control de presión arterial tras ajuste de medicación. Presión actual 130/85 mmHg. Continuar con la dosis ajustada de Enalapril 20mg cada 12 horas por 5 días más, luego volver a 10mg. Monitoreo diario de presión arterial.',
            tipoEvolucion: 'Seguimiento médico'
          },
          {
            id: 2,
            fecha: '12/05/2025',
            hora: '15:45',
            residente: {
              id: 2,
              nombre: 'Juan Pérez',
              habitacion: '102'
            },
            responsable: 'Dra. Mendoza',
            descripcion: 'Paciente refiere dolor en rodilla derecha. Se observa inflamación leve. Se aplica terapia con compresas frías y se administra Paracetamol 500mg. Se recomienda reposo relativo de la articulación por 48 horas.',
            tipoEvolucion: 'Evaluación de síntoma'
          },
          {
            id: 3,
            fecha: '12/05/2025',
            hora: '09:15',
            residente: {
              id: 3,
              nombre: 'Teresa Ramírez',
              habitacion: '103'
            },
            responsable: 'Enf. Pedro Castillo',
            descripcion: 'Se realiza curación de úlcera por presión en región sacra. Lesión de 2x3 cm, profundidad 0.5 cm. Presenta tejido de granulación en bordes. Se realiza limpieza con solución salina y aplicación de apósito hidrocoloide. Próxima curación en 48 horas.',
            tipoEvolucion: 'Procedimiento'
          },
          {
            id: 4,
            fecha: '11/05/2025',
            hora: '16:30',
            residente: {
              id: 4,
              nombre: 'Roberto Gómez',
              habitacion: '104'
            },
            responsable: 'Dr. Rodríguez',
            descripcion: 'Control de glucemia. Valores estabilizados: ayuno 110 mg/dl, postprandial 145 mg/dl. Responde adecuadamente al ajuste de dosis de hipoglucemiantes orales. Se continuará con la misma pauta terapéutica. Próximo control en 15 días.',
            tipoEvolucion: 'Control periódico'
          },
          {
            id: 5,
            fecha: '10/05/2025',
            hora: '11:00',
            residente: {
              id: 5,
              nombre: 'Carmen Silva',
              habitacion: '105'
            },
            responsable: 'Fisio. López',
            descripcion: 'Primera sesión de rehabilitación física para miembro inferior derecho. Se realizan ejercicios de fortalecimiento muscular y movilidad articular. Paciente tolera bien la sesión. Se programan dos sesiones más para esta semana.',
            tipoEvolucion: 'Rehabilitación'
          }
        ];
        
        setEvoluciones(evolucionesSimuladas);
      } catch (error) {
        console.error('Error al cargar evoluciones:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvoluciones();
  }, []);

  // Filtrar evoluciones según criterios de búsqueda
  const evolucionesFiltradas = evoluciones.filter(evolucion => {
    // Filtro de búsqueda general
    const terminoEnNombre = evolucion.residente.nombre.toLowerCase().includes(filtro.toLowerCase());
    const terminoEnHabitacion = evolucion.residente.habitacion.includes(filtro);
    const terminoEnDescripcion = evolucion.descripcion.toLowerCase().includes(filtro.toLowerCase());
    const terminoEnResponsable = evolucion.responsable.toLowerCase().includes(filtro.toLowerCase());
    const terminoEnTipo = evolucion.tipoEvolucion.toLowerCase().includes(filtro.toLowerCase());

    const cumpleFiltroGeneral = terminoEnNombre || terminoEnHabitacion || terminoEnDescripcion || terminoEnResponsable || terminoEnTipo;
    
    // Filtros adicionales
    const cumpleFiltroFecha = filtroFecha ? evolucion.fecha === filtroFecha : true;
    const cumpleFiltroResidente = filtroResidente ? evolucion.residente.nombre.toLowerCase().includes(filtroResidente.toLowerCase()) : true;
    const cumpleFiltroResponsable = filtroResponsable ? evolucion.responsable.toLowerCase().includes(filtroResponsable.toLowerCase()) : true;
    
    return cumpleFiltroGeneral && cumpleFiltroFecha && cumpleFiltroResidente && cumpleFiltroResponsable;
  });

  const toggleFiltros = () => {
    setMostrarFiltros(!mostrarFiltros);
  };

  const limpiarFiltros = () => {
    setFiltroFecha('');
    setFiltroResidente('');
    setFiltroResponsable('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Evoluciones Clínicas</h2>
        
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          <span>Nueva Evolución</span>
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por residente, habitación, descripción o responsable..."
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          
          <button
            onClick={toggleFiltros}
            className="md:ml-2 px-4 py-2 border rounded-md flex items-center justify-center hover:bg-gray-50"
          >
            <FaFilter className="mr-2 text-gray-600" />
            <span>Filtros</span>
          </button>
        </div>
        
        {/* Filtros adicionales */}
        {mostrarFiltros && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-1" /> Fecha
              </label>
              <input
                type="date"
                className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline mr-1" /> Residente
              </label>
              <input
                type="text"
                className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del residente"
                value={filtroResidente}
                onChange={(e) => setFiltroResidente(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline mr-1" /> Responsable
              </label>
              <input
                type="text"
                className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doctor o enfermera"
                value={filtroResponsable}
                onChange={(e) => setFiltroResponsable(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de evoluciones */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando evoluciones clínicas...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {evolucionesFiltradas.length > 0 ? (
              evolucionesFiltradas.map(evolucion => (
                <div key={evolucion.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      {/* Encabezado de la evolución */}
                      <div className="mb-3 sm:mb-0">
                        <Link 
                          to={`/app/residentes/${evolucion.residente.id}`} 
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {evolucion.residente.nombre}
                        </Link>
                        <span className="text-gray-500 ml-2 text-sm">Hab: {evolucion.residente.habitacion}</span>
                        
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <span className="mr-3">{evolucion.fecha} {evolucion.hora}</span>
                          <span>{evolucion.responsable}</span>
                        </div>
                      </div>
                      
                      {/* Tipo de evolución y acciones */}
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {evolucion.tipoEvolucion}
                        </span>
                        <button 
                          className="ml-4 text-gray-600 hover:text-blue-700"
                          title="Editar evolución"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </div>
                    
                    {/* Descripción de la evolución */}
                    <div className="mt-4">
                      <p className="text-gray-800 whitespace-pre-line">
                        {evolucion.descripcion}
                      </p>
                    </div>
                  </div>
                  
                  {/* Acciones adicionales para evoluciones futuras (seguimientos, respuestas, etc) */}
                  <div className="bg-gray-50 px-6 py-2">
                    <div className="flex justify-end">
                      <button className="text-blue-600 text-sm hover:underline">
                        Agregar seguimiento
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No se encontraron evoluciones clínicas con los criterios de búsqueda.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-gray-500 text-sm">
            Mostrando {evolucionesFiltradas.length} de {evoluciones.length} evoluciones
          </div>
        </>
      )}

    </div>
  );
};

export default Evoluciones;