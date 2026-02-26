import { useState, useEffect } from 'react';
import { FaUsers, FaUserPlus, FaEdit, FaTrash, FaLock, FaCheck, FaTimes, FaUserShield } from 'react-icons/fa';
import usuariosService from '../services/usuarios.service';
import { useSystem } from '../contexts/SystemContext';

const PERMISOS_DISPONIBLES = [
  { id: 'dashboard_admin', label: 'Dashboard Admin' },
  { id: 'dashboard_medico', label: 'Dashboard Medico' },
  { id: 'dashboard_enfermeria', label: 'Dashboard Enfermeria' },
  { id: 'residentes', label: 'Residentes' },
  { id: 'signos_vitales', label: 'Signos Vitales' },
  { id: 'ordenes_medicas', label: 'Ordenes Medicas' },
  { id: 'evoluciones', label: 'Evoluciones' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'diagnostico', label: 'Diagnostico del Sistema' }
];

const PERMISOS_POR_ROL = {
  admin: PERMISOS_DISPONIBLES.map((permiso) => permiso.id),
  medico: ['dashboard_medico', 'residentes', 'ordenes_medicas', 'evoluciones'],
  enfermero: ['dashboard_enfermeria', 'residentes', 'signos_vitales', 'evoluciones'],
  cuidador: ['residentes'],
  secretaria: ['residentes']
};

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
    rol: 'enfermero',
    permisos: []
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
    const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
    return user.role === 'admin' || user.rol === 'admin' || permisos.includes('usuarios');
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
    // Establecer valores iniciales con rol por defecto 'enfermero'
    // ya que es un rol que sabemos que existe en el backend
    setFormData({
      username: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: '',
      rol: 'enfermero',
      permisos: PERMISOS_POR_ROL.enfermero // Este rol está garantizado en el backend
    });
    setError(''); // Resetear cualquier error previo
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
      rol: usuario.rol,
      permisos: Array.isArray(usuario.permisos) ? usuario.permisos : []
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
    if (name === 'rol') {
      const permisosRecomendados = PERMISOS_POR_ROL[value] || [];
      setFormData({
        ...formData,
        [name]: value,
        permisos: permisosRecomendados
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePermiso = (permisoId) => {
    const permisosActuales = Array.isArray(formData.permisos) ? formData.permisos : [];
    const nuevosPermisos = permisosActuales.includes(permisoId)
      ? permisosActuales.filter((permiso) => permiso !== permisoId)
      : [...permisosActuales, permisoId];

    setFormData({
      ...formData,
      permisos: nuevosPermisos
    });
  };

  const aplicarPermisosRecomendados = () => {
    const permisosRecomendados = PERMISOS_POR_ROL[formData.rol] || [];
    setFormData({
      ...formData,
      permisos: permisosRecomendados
    });
  };

  const seleccionarTodosLosPermisos = () => {
    setFormData({
      ...formData,
      permisos: PERMISOS_DISPONIBLES.map((permiso) => permiso.id)
    });
  };

  // Crear nuevo usuario
  const crearUsuario = async () => {
    setError('');
    console.log("Función crearUsuario ejecutada");
    
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
    console.log("Iniciando creación de usuario:", formData.username);
    
    try {
      // Asegurar que el rol sea uno de los permitidos
      const rolesPermitidos = ['admin', 'medico', 'enfermero', 'cuidador', 'secretaria'];
      const rolSeleccionado = rolesPermitidos.includes(formData.rol) ? formData.rol : 'enfermero';
      
      const userData = {
        username: formData.username.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        password: formData.password,
        rol: rolSeleccionado,
        permisos: Array.isArray(formData.permisos) ? formData.permisos : []
      };

      console.log("Enviando datos de usuario:", { ...userData, password: '[OCULTA]' });
      const response = await usuariosService.createUsuario(userData);
      console.log("Respuesta del servidor:", response);
      
      showNotification('success', 'Usuario creado', 'El usuario ha sido creado exitosamente');
      
      if (response && response.requiereAprobacion) {
        showNotification('info', 'Aprobación pendiente', 'La creación del administrador requiere aprobación');
      }
      
      setModalVisible(false);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Intentar extraer el mensaje de error del servidor
      let mensajeError = 'Error al crear usuario';
      
      if (error.response && error.response.data) {
        mensajeError = error.response.data.message || error.response.data.error || mensajeError;
        console.error('Detalles del error del servidor:', error.response.data);
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      // Si es un error 500, agregar información adicional
      if (error.response && error.response.status === 500) {
        mensajeError = `Error interno del servidor: ${mensajeError}. Posiblemente haya un problema con el rol seleccionado o el formato de los datos.`;
      }
      
      setError(mensajeError);
      showNotification('error', 'Error al crear usuario', mensajeError);
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
        rol: formData.rol,
        permisos: Array.isArray(formData.permisos) ? formData.permisos : []
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Crear Nuevo Usuario</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nombre de usuario"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Correo electrónico"
              />
            </div>              <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="enfermero">Enfermero</option>
                <option value="cuidador">Cuidador</option>
                <option value="medico">Médico</option>
                <option value="secretaria">Secretaria</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Permisos</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={aplicarPermisosRecomendados}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Recomendados
                  </button>
                  <button
                    type="button"
                    onClick={seleccionarTodosLosPermisos}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Todos
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <label key={permiso.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.permisos) && formData.permisos.includes(permiso.id)}
                      onChange={() => togglePermiso(permiso.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {permiso.label}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Los permisos recomendados se ajustan automaticamente al rol seleccionado.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crearUsuario}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center shadow-md font-medium transition-all duration-200 text-sm"
                disabled={cargando}
              >
                <FaUserPlus className="mr-2" size={14} /> {cargando ? 'Creando...' : 'Crear'}
              </button>
            </div>
            

          </div>
        );
        
      case 'editar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Editar Usuario</h2>
            
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>              <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={!usuarioEsAdmin()}
              >
                <option value="enfermero">Enfermero</option>
                <option value="cuidador">Cuidador</option>
                <option value="medico">Médico</option>
                <option value="secretaria">Secretaria</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">Permisos</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={aplicarPermisosRecomendados}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Recomendados
                  </button>
                  <button
                    type="button"
                    onClick={seleccionarTodosLosPermisos}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Todos
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <label key={permiso.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.permisos) && formData.permisos.includes(permiso.id)}
                      onChange={() => togglePermiso(permiso.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="truncate">{permiso.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Los permisos recomendados se ajustan automaticamente al rol seleccionado.
              </p>
            </div>
            
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={actualizarUsuario}
                className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                disabled={cargando}
              >
                {cargando ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        );
        
      case 'eliminar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Confirmar Eliminación</h2>
            
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
            
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
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="********"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                  className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Solicitudes Pendientes</h2>
            
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
              <button
                type="button"
                onClick={abrirModalCrear}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaUserPlus className="mr-2" /> Nuevo Usuario
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
      <div>
        {/* Vista Desktop - Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="hidden lg:table-cell px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="hidden sm:table-cell px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 lg:px-8 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className={!usuario.activo ? 'bg-gray-100' : ''}>
                  <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-800 text-base font-bold">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base lg:text-lg font-medium text-gray-900 truncate">
                          {usuario.username}
                        </div>
                        {usuario.cambio_password_requerido && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded bg-yellow-100 text-yellow-800 whitespace-nowrap">
                            Cambio pwd
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                    <div className="text-base lg:text-lg text-gray-900 truncate">{usuario.nombre} {usuario.apellido}</div>
                  </td>
                  <td className="hidden lg:table-cell px-6 lg:px-8 py-4 whitespace-nowrap">
                    <div className="text-base lg:text-lg text-gray-900 truncate">{usuario.email || '-'}</div>
                  </td>
                  <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-base leading-5 font-semibold rounded-full 
                      ${usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        usuario.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                        usuario.rol === 'enfermero' ? 'bg-green-100 text-green-800' : 
                        usuario.rol === 'cuidador' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {usuario.rol === 'admin' ? 'Admin' : 
                       usuario.rol === 'medico' ? 'Médico' : 
                       usuario.rol === 'enfermero' ? 'Enf.' : 
                       usuario.rol === 'cuidador' ? 'Cuid.' : 
                       usuario.rol === 'secretaria' ? 'Sec.' : usuario.rol}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-6 lg:px-8 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-base leading-5 font-semibold rounded-full 
                      ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 lg:px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="p-2.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded"
                        title="Editar usuario"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => abrirModalPassword(usuario)}
                        className="p-2.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="Cambiar contraseña"
                      >
                        <FaLock size={18} />
                      </button>
                      {usuarioEsAdmin() && usuario.id !== JSON.parse(localStorage.getItem('user')).id && (
                        <>
                          <button
                            onClick={() => toggleEstadoUsuario(usuario)}
                            className={`p-2.5 rounded ${usuario.activo ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                            title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {usuario.activo ? <FaTimes size={18} /> : <FaCheck size={18} />}
                          </button>
                          <button
                            onClick={() => abrirModalEliminar(usuario)}
                            className="p-2.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Eliminar usuario"
                          >
                            <FaTrash size={18} />
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

        {/* Vista Mobile - Tarjetas */}
        <div className="md:hidden space-y-5">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className={`border rounded-lg p-5 ${!usuario.activo ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 text-primary-800 text-base font-bold">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-medium text-gray-900 truncate">{usuario.username}</p>
                    <p className="text-base text-gray-600 truncate">{usuario.nombre} {usuario.apellido}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 px-3 py-1.5 text-base font-semibold rounded-full
                  ${usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    usuario.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                    usuario.rol === 'enfermero' ? 'bg-green-100 text-green-800' : 
                    usuario.rol === 'cuidador' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {usuario.rol === 'admin' ? 'Admin' : 
                   usuario.rol === 'medico' ? 'Médico' : 
                   usuario.rol === 'enfermero' ? 'Enf.' : 
                   usuario.rol === 'cuidador' ? 'Cuid.' : 
                   usuario.rol === 'secretaria' ? 'Sec.' : usuario.rol}
                </span>
              </div>
              
              {usuario.email && (
                <p className="text-base text-gray-600 mb-3 truncate">Email: {usuario.email}</p>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <span className={`text-base font-semibold rounded-full px-3 py-1.5
                  ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
                {usuario.cambio_password_requerido && (
                  <span className="text-sm bg-yellow-100 text-yellow-800 rounded-full px-3 py-1.5">
                    Cambio pwd
                  </span>
                )}
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => abrirModalEditar(usuario)}
                  className="flex-1 min-w-[70px] px-3 py-2.5 text-base font-medium text-primary-600 border border-primary-600 rounded hover:bg-primary-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => abrirModalPassword(usuario)}
                  className="flex-1 min-w-[100px] px-3 py-2.5 text-base font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Contraseña camb.
                </button>
                {usuarioEsAdmin() && usuario.id !== JSON.parse(localStorage.getItem('user')).id && (
                  <>
                    <button
                      onClick={() => toggleEstadoUsuario(usuario)}
                      className={`flex-1 min-w-[70px] px-3 py-2.5 text-base font-medium rounded border ${usuario.activo ? 'text-red-600 border-red-600 hover:bg-red-50' : 'text-green-600 border-green-600 hover:bg-green-50'}`}
                    >
                      {usuario.activo ? 'Desact.' : 'Act.'}
                    </button>
                    <button
                      onClick={() => abrirModalEliminar(usuario)}
                      className="flex-1 min-w-[70px] px-3 py-2.5 text-base font-medium text-red-600 border border-red-600 rounded hover:bg-red-50"
                    >
                      Elim.
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-0">
      <div className="p-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-2" /> Usuarios
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {usuarioEsAdmin() && (
            <button
              onClick={abrirModalSolicitudes}
              className="flex items-center justify-center px-4 py-2.5 text-base bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
            >
              <FaUserShield className="mr-1" size={18} /> Solicitudes
              {solicitudes.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {solicitudes.length}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={abrirModalCrear}
            className="flex items-center justify-center px-4 py-2.5 text-base bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all font-medium"
          >
            <FaUserPlus className="mr-2" size={18} /> Agregar
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {renderTablaUsuarios()}
      </div>
      
      {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            {renderFormulario()}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;
