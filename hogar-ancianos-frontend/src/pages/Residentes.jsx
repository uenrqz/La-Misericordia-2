import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaUserPlus, FaSearch, FaCamera, FaUserCircle, FaIdCard } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { residentesService } from '../services/residentes.service';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import UserDashboardSelector from '../components/UserDashboardSelector';

const Residentes = () => {
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResidente, setSelectedResidente] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef(null);
  const [dpiError, setDpiError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dpi: '',
    fecha_nacimiento: '',
    direccion_anterior: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    estado_salud: 'Estable',
    medicamentos: '',
    alergias: '',
    contacto_emergencia: '',
    telefono_emergencia: ''
  });
  
  // Cargar residentes al montar el componente
  useEffect(() => {
    fetchResidentes();
  }, [currentPage, searchTerm]);
  
  // Validación y formateo del DPI - Versión arreglada
  const handleDpiChange = (e) => {
    let value = e.target.value;
    
    // Solo permitir números y guiones
    value = value.replace(/[^\d-]/g, '');
    
    // Procesar los dígitos y guiones
    const digitsOnly = value.replace(/-/g, '');
    
    // No aplicar limitación hasta después de formatear
    // Esto permite ingresar dígitos incluso cuando hay guiones presentes
    
    // Crear el formato con los dígitos disponibles
    let formattedValue = '';
    
    if (digitsOnly.length > 0) {
      // Primeros 4 dígitos
      formattedValue = digitsOnly.slice(0, 4);
      
      // Añadir guión y los siguientes 5 dígitos
      if (digitsOnly.length > 4) {
        formattedValue += '-' + digitsOnly.slice(4, 9);
        
        // Añadir guión y los últimos 4 dígitos
        if (digitsOnly.length > 9) {
          formattedValue += '-' + digitsOnly.slice(9, 13);
        }
      }
    }
    
    // Solo usar el valor formateado si tiene sentido (si hay suficientes dígitos)
    if (formattedValue && digitsOnly.length >= 4) {
      value = formattedValue;
    }
    
    // Permitir siempre hasta 13 dígitos (o 14 caracteres con guiones)
    // Importante: NO limitamos aquí para evitar problemas con el último dígito
    
    setFormData({ ...formData, dpi: value });
    
    // Solo mostrar errores después de ingresar varios dígitos
    if (digitsOnly.length > 4) {
      validateDpi(value);
    } else {
      setDpiError('');
    }
  };
  
  const validateDpi = (dpiValue) => {
    // Eliminar guiones para contar sólo los dígitos
    const digitsOnly = dpiValue.replace(/-/g, '');
    
    // Verificar si el DPI está completo (13 dígitos)
    const isComplete = digitsOnly.length === 13;
    
    if (isComplete) {
      // Verificar formato xxxx-xxxxx-xxxx solo cuando tiene los 13 dígitos
      if (dpiValue.length === 14 && !/^\d{4}-\d{5}-\d{4}$/.test(dpiValue)) {
        setDpiError('El formato del DPI debe ser xxxx-xxxxx-xxxx');
        return false;
      }
    } else {
      // Solo mostrar error de longitud si ya ha ingresado más de 10 dígitos
      // pero aún faltan para completar los 13
      if (digitsOnly.length > 10) {
        setDpiError(`Faltan ${13 - digitsOnly.length} dígitos para completar el DPI`);
        return false;
      }
    }
    
    setDpiError('');
    return true;
  };
  
  const fetchResidentes = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) {
        params.nombre = searchTerm;
      }
      
      const response = await residentesService.getResidentes(params);
      
      // La respuesta puede venir en dos formatos diferentes
      // 1. Si es un objeto con data y total (paginado)
      // 2. Si es un array directamente (todas los residentes)
      if (response.data && Array.isArray(response.data.data)) {
        // Formato 1: Objeto con datos paginados
        setResidentes(response.data.data);
        setTotalPages(Math.ceil(response.data.total / 10) || 1);
      } else if (response.data && Array.isArray(response.data)) {
        // Formato 2: Array directo de residentes
        setResidentes(response.data);
        setTotalPages(Math.ceil(response.data.length / 10) || 1);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setError('La respuesta del servidor tiene un formato inesperado');
        setResidentes([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error al obtener residentes:', err);
      setError('Error al cargar los residentes. Por favor, intente de nuevo.');
      toast.error('Error al cargar los residentes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Para el DPI usamos el manejador especial
    if (name === 'dpi') {
      handleDpiChange(e);
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página
  };
  
  const openCreateModal = () => {
    setSelectedResidente(null);
    setFormData({
      nombre: '',
      apellido: '',
      dpi: '',
      fecha_nacimiento: '',
      direccion_anterior: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      estado_salud: 'Estable',
      medicamentos: '',
      alergias: '',
      contacto_emergencia: '',
      telefono_emergencia: ''
    });
    setDpiError('');
    setModalOpen(true);
  };
  
  const openEditModal = (residente) => {
    setSelectedResidente(residente);
    setFormData({
      nombre: residente.nombre,
      apellido: residente.apellido,
      dpi: residente.dpi || '',
      fecha_nacimiento: residente.fecha_nacimiento ? new Date(residente.fecha_nacimiento).toISOString().split('T')[0] : '',
      direccion_anterior: residente.direccion_anterior || '',
      fecha_ingreso: residente.fecha_ingreso ? new Date(residente.fecha_ingreso).toISOString().split('T')[0] : '',
      estado_salud: residente.estado_salud || 'Estable',
      medicamentos: residente.medicamentos || '',
      alergias: residente.alergias || '',
      contacto_emergencia: residente.contacto_emergencia || '',
      telefono_emergencia: residente.telefono_emergencia || ''
    });
    setModalOpen(true);
  };
  
  const openPhotoModal = (residente) => {
    setSelectedResidente(residente);
    setPhotoPreview(residente.foto_url || null);
    setPhotoFile(null);
    setPhotoModalOpen(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let dataToSubmit = { ...formData };
      
      // Validar el formato completo del DPI si está presente
      if (formData.dpi) {
        const digitsOnly = formData.dpi.replace(/-/g, '');
        
        if (digitsOnly.length !== 13) {
          toast.error(`El DPI debe contener exactamente 13 números (tiene ${digitsOnly.length})`);
          setLoading(false);
          return;
        }
        
        // Siempre formatear correctamente antes de enviar
        const formattedDpi = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 9)}-${digitsOnly.slice(9, 13)}`;
        dataToSubmit.dpi = formattedDpi;
      }
      
      // Validar fecha de nacimiento (60+ años)
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const minAge = new Date();
      minAge.setFullYear(today.getFullYear() - 60);
      
      if (birthDate > minAge) {
        toast.error('La fecha de nacimiento debe ser de al menos 60 años atrás');
        setLoading(false);
        return;
      }
      
      // Esta validación ya se hizo arriba, no es necesaria y además tiene un error en la expresión regular
      
      if (selectedResidente) {
        // Actualizar residente existente
        await residentesService.updateResidente(selectedResidente.id, dataToSubmit);
        toast.success('Residente actualizado exitosamente');
      } else {
        // Crear nuevo residente
        await residentesService.createResidente(dataToSubmit);
        toast.success('Residente creado exitosamente');
      }
      
      setModalOpen(false);
      fetchResidentes();
    } catch (err) {
      console.error('Error al guardar residente:', err);
      toast.error(err.response?.data?.message || 'Error al guardar el residente');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este residente? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        await residentesService.deleteResidente(id);
        toast.success('Residente eliminado exitosamente');
        fetchResidentes();
      } catch (err) {
        console.error('Error al eliminar residente:', err);
        toast.error('Error al eliminar el residente');
      } finally {
        setLoading(false);
      }
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
      setLoading(true);
      await residentesService.uploadResidentePhoto(selectedResidente.id, photoFile);
      toast.success('Foto actualizada exitosamente');
      setPhotoModalOpen(false);
      fetchResidentes();
    } catch (err) {
      console.error('Error al subir foto:', err);
      toast.error('Error al subir la foto');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhotoDelete = async () => {
    if (!selectedResidente.foto_url) {
      toast.error('El residente no tiene una foto para eliminar');
      return;
    }
    
    if (window.confirm('¿Está seguro de que desea eliminar la foto de este residente?')) {
      try {
        setLoading(true);
        await residentesService.deleteResidentePhoto(selectedResidente.id);
        toast.success('Foto eliminada exitosamente');
        setPhotoModalOpen(false);
        fetchResidentes();
      } catch (err) {
        console.error('Error al eliminar foto:', err);
        toast.error('Error al eliminar la foto');
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (loading && residentes.length === 0) {
    return <Spinner />;
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Residentes</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          onClick={openCreateModal}
        >
          <FaUserPlus className="mr-2" /> Nuevo Abuelito/a
        </button>
      </div>
      
      {/* Selector de dashboard - Solo visible para usuario admin "ulises enriquez" 
           (La verificación se realiza dentro del componente) */}
      <div className="mb-6">
        <UserDashboardSelector className="w-full md:w-96" />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar residentes..."
              className="w-full p-2 pl-10 border rounded-md"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        {error ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
            {error}
          </div>
        ) : residentes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron residentes.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Foto</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Edad</th>
                    <th className="px-4 py-2 text-left">Fecha Ingreso</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {residentes.map((residente) => (
                    <tr key={residente.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {residente.foto_url ? (
                          <img 
                            src={residente.foto_url} 
                            alt={`${residente.nombre} ${residente.apellido}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="w-10 h-10 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Link to={`/app/residentes/${residente.id}`} className="text-blue-600 hover:underline">
                          {residente.nombre} {residente.apellido}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{residente.edad} años</td>
                      <td className="px-4 py-2">
                        {new Date(residente.fecha_ingreso).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            residente.estado_salud === 'Estable' ? 'bg-green-100 text-green-800' :
                            residente.estado_salud === 'En tratamiento' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {residente.estado_salud}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => openPhotoModal(residente)}
                            className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            title="Gestionar foto"
                          >
                            <FaCamera size={16} />
                          </button>
                          <button 
                            onClick={() => openEditModal(residente)}
                            className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title="Editar"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(residente.id)}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Eliminar"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
      
      {/* Modal para crear/editar residente */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedResidente ? 'Editar Residente' : 'Nuevo Residente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                DPI * <span className="text-xs text-gray-500">(formato: xxxx-xxxxx-xxxx)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="dpi"
                  value={formData.dpi}
                  onChange={handleDpiChange}
                  placeholder="xxxx-xxxxx-xxxx"
                  maxLength="16" // Aumentado para permitir ingresar más dígitos antes del formateo
                  className={`mt-1 block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 ${
                    dpiError ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {dpiError && <p className="text-red-500 text-xs mt-1">{dpiError}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento *</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Debe tener al menos 60 años</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso *</label>
              <input
                type="date"
                name="fecha_ingreso"
                value={formData.fecha_ingreso}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección Anterior</label>
              <input
                type="text"
                name="direccion_anterior"
                value={formData.direccion_anterior}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado de Salud *</label>
            <select
              name="estado_salud"
              value={formData.estado_salud}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
              required
            >
              <option value="Estable">Estable</option>
              <option value="En tratamiento">En tratamiento</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Medicamentos</label>
            <textarea
              name="medicamentos"
              value={formData.medicamentos}
              onChange={handleInputChange}
              rows="2"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Alergias</label>
            <textarea
              name="alergias"
              value={formData.alergias}
              onChange={handleInputChange}
              rows="2"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contacto de Emergencia</label>
              <input
                type="text"
                name="contacto_emergencia"
                value={formData.contacto_emergencia}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono de Emergencia</label>
              <input
                type="text"
                name="telefono_emergencia"
                value={formData.telefono_emergencia}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal para gestionar foto */}
      <Modal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title="Gestionar Foto del Residente"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Vista previa" 
                className="w-48 h-48 object-cover rounded-md shadow-md" 
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded-md flex items-center justify-center">
                <FaUserCircle className="w-24 h-24 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Seleccionar Foto
            </button>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handlePhotoDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={loading || !selectedResidente?.foto_url}
            >
              Eliminar Foto
            </button>
            <div className="space-x-3">
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePhotoUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={loading || !photoFile}
              >
                Guardar Foto
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Residentes;