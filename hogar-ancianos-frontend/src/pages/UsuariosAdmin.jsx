import { useState, useEffect } from 'react';
import { FaUsers, FaUserPlus, FaEdit, FaTrash, FaLock, FaCheck, FaTimes, FaUserShield } from 'react-icons/fa';
import usuariosService from '../services/usuarios.service';
import { useSystem } from '../contexts/SystemContext';

const UsuariosAdmin = () => {
  const { showNotification } = useSystem();
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState('crear'); // crear, editar, eliminar, password, solicitudes
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    passwordActual: '',
    rol: 'enfermera'
  });
  const [cargando, setCargando] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState('');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
    if (usuarioEsAdmin()) {
      cargarSolicitudesAdmin();
    }
  }, []);

  // Verificar si el usuario actual es administrador
  const usuarioEsAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    return user.role === 'admin' || user.rol === 'admin';
  };

  // Cargar la lista de usuarios
  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const response = await usuariosService.getUsuarios();
      setUsuarios(response);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showNotification('error', 'Error al cargar usuarios', error.message || 'Inténtelo de nuevo más tarde');
    } finally {
      setCargando(false);
    }
  };

  // Cargar solicitudes de administrador pendientes
  const cargarSolicitudesAdmin = async () => {
    try {
      const response = await usuariosService.getSolicitudesAdmin();
      setSolicitudes(response);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    }
  };

  // Abrir modal para crear nuevo usuario
  const abrirModalCrear = () => {
    setModalTipo('crear');
    setFormData({
      username: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: '',
      rol: 'enfermera'
    });
    setModalVisible(true);
  };

  // Abrir modal para editar usuario
  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalTipo('editar');
    setFormData({
      username: usuario.username,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email || '',
      rol: usuario.rol
    });
    setModalVisible(true);
  };

  // Abrir modal para confirmar eliminación
  const abrirModalEliminar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalTipo('eliminar');
    setModalVisible(true);
  };

  // Abrir modal para cambiar contraseña
  const abrirModalPassword = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalTipo('password');
    setFormData({
      passwordActual: '',
      password: '',
      confirmPassword: ''
    });
    setModalVisible(true);
  };

  // Abrir modal para ver solicitudes pendientes
  const abrirModalSolicitudes = () => {
    setModalTipo('solicitudes');
    cargarSolicitudesAdmin();
    setModalVisible(true);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Crear nuevo usuario
  const crearUsuario = async () => {
    setError('');
    // Validaciones
    if (!formData.username || !formData.nombre || !formData.apellido || !formData.email || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setCargando(true);
    try {
      const userData = {
        username: formData.username,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        rol: formData.rol
      };

      const response = await usuariosService.createUsuario(userData);
      showNotification('success', 'Usuario creado', 'El usuario ha sido creado exitosamente');
      
      if (response.requiereAprobacion) {
        showNotification('info', 'Aprobación pendiente', 'La creación del administrador requiere aprobación');
      }
      
      setModalVisible(false);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setError(error.message || 'Error al crear usuario');
    } finally {
      setCargando(false);
    }
  };

  // Actualizar usuario existente
  const actualizarUsuario = async () => {
    setError('');
    if (!formData.nombre || !formData.apellido) {
      setError('Nombre y apellido son obligatorios');
      return;
    }

    setCargando(true);
    try {
      const userData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol
      };

      await usuariosService.updateUsuario(usuarioSeleccionado.id, userData);
      showNotification('success', 'Usuario actualizado', 'El usuario ha sido actualizado exitosamente');
      setModalVisible(false);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError(error.message || 'Error al actualizar usuario');
    } finally {
      setCargando(false);
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async () => {
    setCargando(true);
    try {
      await usuariosService.deleteUsuario(usuarioSeleccionado.id);
      showNotification('success', 'Usuario eliminado', 'El usuario ha sido eliminado exitosamente');
      setModalVisible(false);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      showNotification('error', 'Error al eliminar usuario', error.message || 'Inténtelo de nuevo más tarde');
    } finally {
      setCargando(false);
    }
  };

  // Cambiar contraseña
  const cambiarPassword = async () => {
    setError('');
    // Validaciones
    if (!formData.password || !formData.confirmPassword) {
      setError('Debe ingresar la nueva contraseña');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Si es mi propio usuario, debo ingresar la contraseña actual
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    if (currentUser.id === usuarioSeleccionado.id && !formData.passwordActual) {
      setError('Debe ingresar su contraseña actual');
      return;
    }

    setCargando(true);
    try {
      const passwordData = {
        passwordActual: formData.passwordActual,
        passwordNueva: formData.password,
        passwordConfirmacion: formData.confirmPassword
      };

      await usuariosService.cambiarPassword(usuarioSeleccionado.id, passwordData);
      showNotification('success', 'Contraseña cambiada', 'La contraseña ha sido cambiada exitosamente');
      setModalVisible(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.message || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  // Activar o desactivar usuario
  const toggleEstadoUsuario = async (usuario) => {
    try {
      await usuariosService.toggleEstadoUsuario(usuario.id, !usuario.activo);
      showNotification('success', 'Estado cambiado', `Usuario ${usuario.activo ? 'desactivado' : 'activado'} exitosamente`);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      showNotification('error', 'Error al cambiar estado', error.message || 'Inténtelo de nuevo más tarde');
    }
  };

  // Responder a solicitud de administrador
  const responderSolicitudAdmin = async (solicitudId, aprobado) => {
    setCargando(true);
    try {
      await usuariosService.responderSolicitudAdmin(solicitudId, aprobado, '');
      showNotification('success', 'Solicitud respondida', `Solicitud ${aprobado ? 'aprobada' : 'rechazada'} exitosamente`);
      cargarSolicitudesAdmin();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al responder solicitud:', error);
      showNotification('error', 'Error al responder solicitud', error.message || 'Inténtelo de nuevo más tarde');
    } finally {
      setCargando(false);
    }
  };

  // Renderizar el formulario según el tipo de modal
  const renderFormulario = () => {
    switch (modalTipo) {
      case 'crear':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Crear Nuevo Usuario</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nombre de usuario"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nombre"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Apellido"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Correo electrónico"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="enfermera">Enfermera</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crearUsuario}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                disabled={cargando}
              >
                {cargando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        );
        
      case 'editar':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Editar Usuario</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={!usuarioEsAdmin()}
              >
                <option value="enfermera">Enfermera</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={actualizarUsuario}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                disabled={cargando}
              >
                {cargando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        );
        
      case 'eliminar':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Confirmar Eliminación</h2>
            
            <p className="text-gray-600">
              ¿Está seguro que desea eliminar al usuario <span className="font-bold">{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellido}</span>?
            </p>
            
            <p className="text-sm text-red-600">
              Esta acción no se puede deshacer. El usuario ya no podrá iniciar sesión en el sistema.
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarUsuario}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={cargando}
              >
                {cargando ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
            </div>
          </div>
        );
        
      case 'password':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cambiar Contraseña</h2>
            
            {usuarioEsAdmin() && usuarioSeleccionado?.id !== JSON.parse(localStorage.getItem('user')).id ? (
              <p className="text-sm text-blue-600">
                Como administrador, puede cambiar la contraseña sin necesidad de ingresar la contraseña actual.
              </p>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
                <input
                  type="password"
                  name="passwordActual"
                  value={formData.passwordActual}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={cambiarPassword}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                disabled={cargando}
              >
                {cargando ? 'Procesando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        );
        
      case 'solicitudes':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Solicitudes Pendientes</h2>
            
            {solicitudes.length === 0 ? (
              <p className="text-gray-600">No hay solicitudes pendientes</p>
            ) : (
              <div className="space-y-4">
                {solicitudes.map((solicitud) => (
                  <div key={solicitud.id} className="p-4 border rounded-lg bg-white shadow-sm">
                    <p className="font-medium">
                      {solicitud.nombre} {solicitud.apellido} ({solicitud.username})
                    </p>
                    <p className="text-sm text-gray-600">
                      Solicitado por: {solicitud.solicitante_nombre} {solicitud.solicitante_apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fecha: {new Date(solicitud.fecha_solicitud).toLocaleString()}
                    </p>
                    
                    {!solicitud.yaVotado ? (
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => responderSolicitudAdmin(solicitud.id, true)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          disabled={cargando}
                        >
                          <FaCheck className="mr-1" /> Aprobar
                        </button>
                        <button
                          onClick={() => responderSolicitudAdmin(solicitud.id, false)}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          disabled={cargando}
                        >
                          <FaTimes className="mr-1" /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm mt-3 italic">
                        Ya has respondido a esta solicitud: <span className={solicitud.miAprobacion ? 'text-green-600' : 'text-red-600'}>
                          {solicitud.miAprobacion ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Renderizar tabla de usuarios
  const renderTablaUsuarios = () => {
    if (cargando && usuarios.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (usuarios.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <FaUsers className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-500">No hay usuarios registrados</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className={!usuario.activo ? 'bg-gray-100' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-800">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.username}
                      </div>
                      {usuario.cambio_password_requerido && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Cambio de contraseña pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{usuario.nombre} {usuario.apellido}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{usuario.email || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      usuario.rol === 'medico' || usuario.rol === 'doctor' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {usuario.rol === 'admin' ? 'Administrador' : 
                     usuario.rol === 'medico' || usuario.rol === 'doctor' ? 'Médico' : 'Enfermera'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Editar usuario"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => abrirModalPassword(usuario)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Cambiar contraseña"
                    >
                      <FaLock />
                    </button>
                    {usuarioEsAdmin() && usuario.id !== JSON.parse(localStorage.getItem('user')).id && (
                      <>
                        <button
                          onClick={() => toggleEstadoUsuario(usuario)}
                          className={`${usuario.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usuario.activo ? <FaTimes /> : <FaCheck />}
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(usuario)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar usuario"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <FaUsers className="mr-2" /> Administración de Usuarios
        </h1>
        
        <div className="flex space-x-3">
          {usuarioEsAdmin() && (
            <button
              onClick={abrirModalSolicitudes}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FaUserShield className="mr-2" />
              Solicitudes Admin
            </button>
          )}
          
          <button
            onClick={abrirModalCrear}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaUserPlus className="mr-2" />
            Nuevo Usuario
          </button>
        </div>
      </div>
      
      {renderTablaUsuarios()}
      
      {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto p-6">
            {renderFormulario()}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;
