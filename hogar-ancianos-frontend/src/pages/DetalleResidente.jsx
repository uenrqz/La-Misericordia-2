import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaFileMedical, FaPills, FaHeartbeat, FaNotesMedical, FaUserCircle, FaCamera } from 'react-icons/fa';
import { residentesService } from '../services/residentes.service';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const DetalleResidente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [residente, setResidente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchResidenteDetalle();
  }, [id]);

  const fetchResidenteDetalle = async () => {
    setIsLoading(true);
    try {
      const response = await residentesService.getResidenteById(id);
      setResidente(response.data);
    } catch (error) {
      console.error('Error al cargar detalles del residente:', error);
      toast.error('Error al cargar los detalles del residente');
      navigate('/app/residentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('El archivo debe ser una imagen');
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe exceder los 5MB');
        return;
      }
      
      setPhotoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePhotoUpload = async () => {
    if (!photoFile) {
      toast.error('Debe seleccionar una imagen');
      return;
    }
    
    try {
      setIsLoading(true);
      await residentesService.uploadResidentePhoto(id, photoFile);
      toast.success('Foto actualizada exitosamente');
      setPhotoModalOpen(false);
      fetchResidenteDetalle();
    } catch (err) {
      console.error('Error al subir foto:', err);
      toast.error('Error al subir la foto');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePhotoDelete = async () => {
    if (!residente?.foto_url) {
      toast.error('El residente no tiene una foto para eliminar');
      return;
    }
    
    if (window.confirm('¿Está seguro de que desea eliminar la foto de este residente?')) {
      try {
        setIsLoading(true);
        await residentesService.deleteResidentePhoto(id);
        toast.success('Foto eliminada exitosamente');
        setPhotoModalOpen(false);
        fetchResidenteDetalle();
      } catch (err) {
        console.error('Error al eliminar foto:', err);
        toast.error('Error al eliminar la foto');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openPhotoModal = () => {
    setPhotoPreview(residente?.foto_url || null);
    setPhotoFile(null);
    setPhotoModalOpen(true);
  };

  if (isLoading) {
    return <Spinner />;
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
      
      {/* Modal para foto del residente */}
      <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Foto del Residente</h3>
          
          {photoPreview && (
            <div className="mb-4">
              <img src={photoPreview} alt="Foto del residente" className="w-full h-auto rounded-md" />
            </div>
          )}
          
          <div className="flex items-center mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaCamera className="mr-2" />
              {photoFile ? 'Cambiar Foto' : 'Subir Foto'}
            </button>
            {photoFile && (
              <button
                onClick={() => setPhotoFile(null)}
                className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <FaTrash className="mr-2" />
                Eliminar Foto
              </button>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handlePhotoUpload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Guardar Foto
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DetalleResidente;