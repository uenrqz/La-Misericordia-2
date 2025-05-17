import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaFileMedical, FaPills, FaHeartbeat, FaNotesMedical } from 'react-icons/fa';

const DetalleResidente = () => {
  const { id } = useParams();
  const [residente, setResidente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    // Simulación de carga de datos del residente desde el backend
    const fetchResidenteDetalle = async () => {
      setIsLoading(true);
      try {
        // En un entorno real, esto sería una llamada al API
        // const response = await axios.get(`/api/residentes/${id}`);
        
        // Simulación con timeout para representar tiempo de respuesta del servidor
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Datos simulados para desarrollo
        const residenteDetalle = {
          id: parseInt(id),
          nombre: 'María González',
          edad: 78,
          fechaNacimiento: '10/08/1946',
          genero: 'Femenino',
          habitacion: '101',
          fechaIngreso: '12/02/2024',
          estadoSalud: 'Estable',
          responsable: 'Ana González (Hija)',
          telefonoContacto: '5555-1234',
          diagnosticos: [
            { id: 1, descripcion: 'Hipertensión arterial', fecha: '20/02/2024' },
            { id: 2, descripcion: 'Diabetes tipo 2', fecha: '20/02/2024' },
            { id: 3, descripcion: 'Artrosis', fecha: '15/03/2024' }
          ],
          medicamentos: [
            { id: 1, nombre: 'Enalapril', dosis: '10mg', frecuencia: 'Cada 12 horas', horario: '8:00, 20:00' },
            { id: 2, nombre: 'Metformina', dosis: '850mg', frecuencia: 'Con el almuerzo', horario: '13:00' },
            { id: 3, nombre: 'Paracetamol', dosis: '500mg', frecuencia: 'Según necesidad', horario: 'SOS' }
          ],
          signosVitales: [
            { 
              id: 1, 
              fecha: '13/05/2025', 
              hora: '08:00', 
              temperatura: 36.7, 
              presionSistolica: 130, 
              presionDiastolica: 85,
              frecuenciaCardiaca: 72,
              glucemia: 120,
              oxigenacion: 97,
              enfermera: 'Lucia Méndez'
            },
            { 
              id: 2, 
              fecha: '12/05/2025', 
              hora: '20:00', 
              temperatura: 36.5, 
              presionSistolica: 128, 
              presionDiastolica: 82,
              frecuenciaCardiaca: 70,
              glucemia: 118,
              oxigenacion: 98,
              enfermera: 'Pedro Castillo'
            },
            { 
              id: 3, 
              fecha: '12/05/2025', 
              hora: '08:00', 
              temperatura: 36.8, 
              presionSistolica: 135, 
              presionDiastolica: 88,
              frecuenciaCardiaca: 75,
              glucemia: 125,
              oxigenacion: 96,
              enfermera: 'Lucia Méndez'
            }
          ],
          ordenesMedicas: [
            { 
              id: 1, 
              fecha: '10/05/2025', 
              doctor: 'Dr. Rodríguez', 
              descripcion: 'Aumentar dosis de Enalapril a 20mg cada 12 horas por una semana, luego volver a 10mg.',
              estado: 'Activa'
            },
            { 
              id: 2, 
              fecha: '05/05/2025', 
              doctor: 'Dr. Rodríguez', 
              descripcion: 'Realizar glucemia 3 veces al día durante 5 días.',
              estado: 'Completada'
            }
          ],
          evoluciones: [
            { 
              id: 1, 
              fecha: '12/05/2025', 
              hora: '10:30',
              responsable: 'Dr. Rodríguez',
              descripcion: 'Paciente presenta mejora en control de presión arterial tras ajuste de medicación. Continuar monitoreo diario.' 
            },
            { 
              id: 2, 
              fecha: '08/05/2025', 
              hora: '11:15',
              responsable: 'Dr. Rodríguez',
              descripcion: 'Se observa ligero aumento de presión arterial. Se ajusta medicación y se solicita monitoreo más frecuente.' 
            },
            { 
              id: 3, 
              fecha: '01/05/2025', 
              hora: '09:45',
              responsable: 'Dr. Rodríguez',
              descripcion: 'Evaluación mensual. Paciente estable, refiere dolor ocasional en articulaciones. Se mantiene tratamiento actual.' 
            }
          ]
        };
        
        setResidente(residenteDetalle);
      } catch (error) {
        console.error('Error al cargar detalles del residente:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResidenteDetalle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-3 text-gray-600">Cargando información del residente...</p>
      </div>
    );
  }

  if (!residente) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">No se encontró el residente solicitado</p>
        <Link to="/app/residentes" className="mt-4 inline-block text-blue-600 hover:underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center mb-6">
        <Link to="/app/residentes" className="mr-4 text-gray-600 hover:text-gray-900">
          <FaArrowLeft />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{residente.nombre}</h2>
          <p className="text-gray-600">
            {residente.edad} años | Habitación: {residente.habitacion} | Ingresó: {residente.fechaIngreso}
          </p>
        </div>
        <div className="ml-auto">
          {residente.estadoSalud === 'Estable' ? (
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">Estable</span>
          ) : residente.estadoSalud === 'En tratamiento' ? (
            <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">En tratamiento</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">Crítico</span>
          )}
        </div>
      </div>
      
      {/* Pestañas de navegación */}
      <div className="mb-6 border-b">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              Información General
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'signos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('signos')}
            >
              <FaHeartbeat className="inline mr-2" />
              Signos Vitales
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'medicamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('medicamentos')}
            >
              <FaPills className="inline mr-2" />
              Medicamentos
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'ordenes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('ordenes')}
            >
              <FaFileMedical className="inline mr-2" />
              Órdenes Médicas
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === 'evoluciones'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('evoluciones')}
            >
              <FaNotesMedical className="inline mr-2" />
              Evoluciones
            </button>
          </li>
        </ul>
      </div>
      
      {/* Contenido según pestaña */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'general' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información personal */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Información Personal</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Nombre:</span>
                    <span>{residente.nombre}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Edad:</span>
                    <span>{residente.edad} años</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Fecha nacimiento:</span>
                    <span>{residente.fechaNacimiento}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Género:</span>
                    <span>{residente.genero}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Habitación:</span>
                    <span>{residente.habitacion}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Fecha ingreso:</span>
                    <span>{residente.fechaIngreso}</span>
                  </div>
                </div>
              </div>
              
              {/* Información de contacto */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Responsable:</span>
                    <span>{residente.responsable}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-1/3">Teléfono:</span>
                    <span>{residente.telefonoContacto}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Diagnósticos */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Diagnósticos</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnóstico</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residente.diagnosticos.map((diagnostico) => (
                    <tr key={diagnostico.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{diagnostico.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{diagnostico.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'signos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Historial de Signos Vitales</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <FaPlus className="mr-2" />
                Nuevo Registro
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperatura</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presión</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Cardíaca</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glucemia</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oxigenación</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enfermera</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residente.signosVitales.map((signo) => (
                    <tr key={signo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.fecha} {signo.hora}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.temperatura}°C
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.presionSistolica}/{signo.presionDiastolica} mmHg
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.frecuenciaCardiaca} lpm
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.glucemia} mg/dl
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.oxigenacion}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {signo.enfermera}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'medicamentos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Medicación Actual</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <FaPlus className="mr-2" />
                Agregar Medicamento
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {residente.medicamentos.map((medicamento) => (
                <div key={medicamento.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-lg">{medicamento.nombre}</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600"><span className="font-medium">Dosis:</span> {medicamento.dosis}</p>
                    <p className="text-gray-600"><span className="font-medium">Frecuencia:</span> {medicamento.frecuencia}</p>
                    <p className="text-gray-600"><span className="font-medium">Horario:</span> {medicamento.horario}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'ordenes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Órdenes Médicas</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <FaPlus className="mr-2" />
                Nueva Orden Médica
              </button>
            </div>
            
            {residente.ordenesMedicas.map((orden) => (
              <div key={orden.id} className={`mb-4 border-l-4 p-4 rounded-r-md ${orden.estado === 'Activa' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-600">{orden.fecha} - {orden.doctor}</p>
                    <p className="mt-1 font-medium">{orden.descripcion}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${orden.estado === 'Activa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {orden.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'evoluciones' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Evoluciones Clínicas</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                <FaPlus className="mr-2" />
                Nueva Evolución
              </button>
            </div>
            
            <div className="space-y-4">
              {residente.evoluciones.map((evolucion) => (
                <div key={evolucion.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium">{evolucion.fecha} {evolucion.hora}</span>
                      <span className="text-gray-600 ml-2">- {evolucion.responsable}</span>
                    </div>
                  </div>
                  <p className="text-gray-700">{evolucion.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleResidente;