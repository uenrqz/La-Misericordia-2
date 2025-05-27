import apiClient from './api.config';
import authService from './auth.service';
import { recuperarDeErrores500, diagnosticarErrores500 } from '../utils/errorHandler';

// Constantes
const API_BASE = '/api';

// Servicio para obtener datos para el dashboard de administración
export const getAdminDashboardData = async () => {
  try {
    // Llamada optimizada al BFF que combina múltiples peticiones en una
    const dashboardResponse = await apiClient.get('/dashboard');
    
    // El BFF ya proporciona los datos combinados
    return dashboardResponse.data;
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    
    // En caso de error, devolvemos datos por defecto
    const monthlyData = {
      labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP'],
      datasets: [
        {
          label: 'Donaciones',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: '#1e3a8a',
          backgroundColor: '#1e3a8a',
        },
        {
          label: 'Gastos',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: '#fbbf24',
          backgroundColor: '#fbbf24',
        },
      ],
    };

    return {
      residentes: {
        total: 0,
        activos: 0
      },
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
        monthlyData
      }
    };
  }
};

// Servicio para obtener datos para el dashboard de enfermería
export const getEnfermeriaDashboardData = async () => {
  try {
    // Obtener resumen de residentes
    const residentesResponse = await apiClient.get('/residentes');
    
    // Obtener signos vitales recientes (limitado a 5)
    const signosVitalesPromises = residentesResponse.data.slice(0, 5).map(residente => 
      apiClient.get(`/residentes/${residente.id}/signos-vitales`)
        .then(response => ({
          ...response.data,
          residenteNombre: residente.nombre,
          residenteId: residente.id
        }))
        .catch(() => [])
    );
    
    const signosVitalesResults = await Promise.all(signosVitalesPromises);
    let signosVitalesRecientes = [];
    
    signosVitalesResults.forEach(result => {
      if (Array.isArray(result)) {
        signosVitalesRecientes = signosVitalesRecientes.concat(
          result.map(sv => ({
            ...sv,
            residenteNombre: result.residenteNombre,
            residenteId: result.residenteId
          }))
        );
      }
    });
    
    // Ordenar por fecha más reciente
    signosVitalesRecientes.sort((a, b) => 
      new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
    );
    
    // Limitar a 5 registros
    signosVitalesRecientes = signosVitalesRecientes.slice(0, 5);
    
    // Obtener evoluciones recientes
    const evolucionesPromises = residentesResponse.data.slice(0, 5).map(residente => 
      axios.get(`${API_URL}/residentes/${residente.id}/evoluciones`)
        .then(response => ({
          ...response.data,
          residenteNombre: residente.nombre,
          residenteId: residente.id
        }))
        .catch(() => [])
    );
    
    const evolucionesResults = await Promise.all(evolucionesPromises);
    let evolucionesRecientes = [];
    
    evolucionesResults.forEach(result => {
      if (Array.isArray(result)) {
        evolucionesRecientes = evolucionesRecientes.concat(
          result.map(ev => ({
            ...ev,
            residenteNombre: result.residenteNombre,
            residenteId: result.residenteId
          }))
        );
      }
    });
    
    // Ordenar por fecha más reciente
    evolucionesRecientes.sort((a, b) => 
      new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
    );
    
    // Limitar a 5 registros
    evolucionesRecientes = evolucionesRecientes.slice(0, 5);
    
    // Calcular métricas
    const totalResidentes = residentesResponse.data.length;
    const activosResidentes = residentesResponse.data.filter(r => r.estado !== 'Inactivo').length;
    
    return {
      residentes: {
        total: totalResidentes,
        activos: activosResidentes
      },
      signosVitalesRecientes,
      evolucionesRecientes,
      medicamentosPendientes: 12 // En una implementación real esto vendría de la API
    };
  } catch (error) {
    console.error('Error al cargar datos del dashboard de enfermería:', error);
    throw error;
  }
};

// Servicio para obtener datos para el dashboard de médicos
export const getMedicosDashboardData = async () => {
  try {
    // Obtener resumen de residentes
    const residentesResponse = await apiClient.get('/residentes');
    
    // Obtener órdenes médicas activas
    const ordenesMedicasPromises = residentesResponse.data.slice(0, 5).map(residente => 
      apiClient.get(`/residentes/${residente.id}/ordenes?estado=activo`)
        .then(response => ({
          ...response.data,
          residenteNombre: residente.nombre,
          residenteId: residente.id
        }))
        .catch(() => [])
    );
    
    const ordenesMedicasResults = await Promise.all(ordenesMedicasPromises);
    let ordenesMedicasActivas = [];
    
    ordenesMedicasResults.forEach(result => {
      if (Array.isArray(result)) {
        ordenesMedicasActivas = ordenesMedicasActivas.concat(
          result.map(om => ({
            ...om,
            residenteNombre: result.residenteNombre,
            residenteId: result.residenteId
          }))
        );
      }
    });
    
    // Ordenar por fecha más reciente
    ordenesMedicasActivas.sort((a, b) => 
      new Date(b.fecha_orden).getTime() - new Date(a.fecha_orden).getTime()
    );
    
    // Limitar a 5 registros
    ordenesMedicasActivas = ordenesMedicasActivas.slice(0, 5);
    
    // Obtener evoluciones recientes
    const evolucionesPromises = residentesResponse.data.slice(0, 5).map(residente => 
      axios.get(`${API_URL}/residentes/${residente.id}/evoluciones`)
        .then(response => ({
          ...response.data,
          residenteNombre: residente.nombre,
          residenteId: residente.id
        }))
        .catch(() => [])
    );
    
    const evolucionesResults = await Promise.all(evolucionesPromises);
    let evolucionesRecientes = [];
    
    evolucionesResults.forEach(result => {
      if (Array.isArray(result)) {
        evolucionesRecientes = evolucionesRecientes.concat(
          result.map(ev => ({
            ...ev,
            residenteNombre: result.residenteNombre,
            residenteId: result.residenteId
          }))
        );
      }
    });
    
    // Ordenar por fecha más reciente
    evolucionesRecientes.sort((a, b) => 
      new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
    );
    
    // Limitar a 5 registros
    evolucionesRecientes = evolucionesRecientes.slice(0, 5);
    
    // Calcular métricas
    const totalResidentes = residentesResponse.data.length;
    const activosResidentes = residentesResponse.data.filter(r => r.estado !== 'Inactivo').length;
    
    return {
      residentes: {
        total: totalResidentes,
        activos: activosResidentes
      },
      ordenesMedicasActivas,
      evolucionesRecientes
    };
  } catch (error) {
    console.error('Error al cargar datos del dashboard de médicos:', error);
    throw error;
  }
};

// Servicio para obtener datos del dashboard para un médico específico
export const getMedicoDashboardData = async (medicoId) => {
  try {
    // Obtener información del médico
    const medicoResponse = await axios.get(`${API_URL}/usuarios/${medicoId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Obtener residentes asignados a este médico
    const residentesResponse = await axios.get(`${API_URL}/usuarios/${medicoId}/residentes`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Obtener órdenes médicas activas emitidas por este médico
    const ordenesMedicasResponse = await axios.get(`${API_URL}/usuarios/${medicoId}/ordenes?estado=activo`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let ordenesMedicasActivas = [];
    if (ordenesMedicasResponse.data && Array.isArray(ordenesMedicasResponse.data)) {
      ordenesMedicasActivas = ordenesMedicasResponse.data.map(orden => ({
        ...orden,
        residenteNombre: orden.residente ? orden.residente.nombre : 'Desconocido',
        residenteId: orden.residente ? orden.residente.id : null
      }));
      
      // Ordenar por fecha más reciente
      ordenesMedicasActivas.sort((a, b) => 
        new Date(b.fecha_orden).getTime() - new Date(a.fecha_orden).getTime()
      );
      
      // Limitar a 5 registros
      ordenesMedicasActivas = ordenesMedicasActivas.slice(0, 5);
    }
    
    // Obtener evoluciones recientes registradas por este médico
    const evolucionesResponse = await axios.get(`${API_URL}/usuarios/${medicoId}/evoluciones`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let evolucionesRecientes = [];
    if (evolucionesResponse.data && Array.isArray(evolucionesResponse.data)) {
      evolucionesRecientes = evolucionesResponse.data.map(evolucion => ({
        ...evolucion,
        residenteNombre: evolucion.residente ? evolucion.residente.nombre : 'Desconocido',
        residenteId: evolucion.residente ? evolucion.residente.id : null
      }));
      
      // Ordenar por fecha más reciente
      evolucionesRecientes.sort((a, b) => 
        new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
      );
      
      // Limitar a 5 registros
      evolucionesRecientes = evolucionesRecientes.slice(0, 5);
    }
    
    // Obtener citas programadas para este médico
    const citasResponse = await axios.get(`${API_URL}/usuarios/${medicoId}/citas`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let citasPendientes = [];
    if (citasResponse.data && Array.isArray(citasResponse.data)) {
      citasPendientes = citasResponse.data
        .filter(cita => new Date(cita.fecha) >= new Date())
        .map(cita => ({
          ...cita,
          residenteNombre: cita.residente ? cita.residente.nombre : 'Desconocido',
          residenteId: cita.residente ? cita.residente.id : null
        }));
      
      // Ordenar por fecha más próxima
      citasPendientes.sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      
      // Limitar a 5 registros
      citasPendientes = citasPendientes.slice(0, 5);
    }
    
    // Calcular métricas específicas para este médico
    const totalResidentesAsignados = residentesResponse.data ? residentesResponse.data.length : 0;
    const ordenesMedicasActivas24h = ordenesMedicasActivas.filter(orden => {
      const fechaOrden = new Date(orden.fecha_orden);
      const ahora = new Date();
      const diferencia = ahora.getTime() - fechaOrden.getTime();
      const horas = diferencia / (1000 * 60 * 60);
      return horas <= 24;
    }).length;
    
    return {
      medico: medicoResponse.data,
      residentes: {
        total: totalResidentesAsignados,
        activos: residentesResponse.data ? residentesResponse.data.filter(r => r.estado !== 'Inactivo').length : 0
      },
      estadisticas: {
        ordenesMedicas24h: ordenesMedicasActivas24h,
        citasPendientesHoy: citasPendientes.filter(cita => {
          const fechaCita = new Date(cita.fecha);
          const hoy = new Date();
          return fechaCita.getDate() === hoy.getDate() && 
                 fechaCita.getMonth() === hoy.getMonth() && 
                 fechaCita.getFullYear() === hoy.getFullYear();
        }).length,
        evolucionesUltimaSemana: evolucionesRecientes.filter(evolucion => {
          const fechaEvolucion = new Date(evolucion.fecha_registro);
          const hoy = new Date();
          const unaSemanaAtras = new Date(hoy.setDate(hoy.getDate() - 7));
          return fechaEvolucion >= unaSemanaAtras;
        }).length
      },
      ordenesMedicasActivas,
      evolucionesRecientes,
      citasPendientes
    };
  } catch (error) {
    console.error('Error al cargar datos del dashboard del médico:', error);
    throw error;
  }
};