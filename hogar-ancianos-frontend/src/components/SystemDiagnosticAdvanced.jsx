import React, { useState, useEffect } from 'react';
import { useSystem } from '../contexts/SystemContext';
import tokenRefreshManager from '../utils/tokenRefreshManager';

/**
 * Componente de Diagnóstico Avanzado del Sistema
 * Muestra información detallada sobre el estado del sistema, conectividad,
 * refresh tokens y permite ejecutar acciones de diagnóstico.
 */
const SystemDiagnosticAdvanced = () => {
  const { 
    systemStatus, 
    tokenRefreshStatus, 
    forceTokenRefresh,
    checkSystemStatus,
    showNotification 
  } = useSystem();
  
  const [diagnosticData, setDiagnosticData] = useState({
    tokenManager: {
      status: 'unknown',
      lastRefresh: null,
      nextRefresh: null,
      activeListeners: 0
    },
    connectivity: {
      latency: null,
      connectionQuality: 'unknown'
    },
    localStorage: {
      tokenExists: false,
      userExists: false,
      authTimestamp: null
    }
  });
  
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Actualizar datos de diagnóstico cada 5 segundos
    const updateDiagnostics = () => {
      updateTokenManagerStatus();
      updateLocalStorageStatus();
      updateConnectivityStatus();
    };

    updateDiagnostics();
    const interval = setInterval(updateDiagnostics, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateTokenManagerStatus = () => {
    const estado = tokenRefreshManager.obtenerEstado();
    setDiagnosticData(prev => ({
      ...prev,
      tokenManager: {
        status: estado.activo ? 'active' : 'inactive',
        lastRefresh: estado.lastRefresh,
        nextRefresh: estado.proximoRefresh,
        activeListeners: estado.listenersActivos
      }
    }));
  };

  const updateLocalStorageStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authTimestamp = localStorage.getItem('auth_timestamp');
    
    setDiagnosticData(prev => ({
      ...prev,
      localStorage: {
        tokenExists: !!token,
        userExists: !!user,
        authTimestamp: authTimestamp
      }
    }));
  };

  const updateConnectivityStatus = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/bff/status`, {
        method: 'GET',
        cache: 'no-store'
      });
      const latency = Date.now() - startTime;
      
      let quality = 'poor';
      if (latency < 100) quality = 'excellent';
      else if (latency < 300) quality = 'good';
      else if (latency < 1000) quality = 'fair';
      
      setDiagnosticData(prev => ({
        ...prev,
        connectivity: {
          latency,
          connectionQuality: quality
        }
      }));
    } catch (error) {
      setDiagnosticData(prev => ({
        ...prev,
        connectivity: {
          latency: null,
          connectionQuality: 'offline'
        }
      }));
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunningTest(true);
    setTestResults([]);
    
    const results = [];
    
    try {
      // Test 1: Conectividad básica
      results.push(await testConnectivity());
      
      // Test 2: Autenticación
      results.push(await testAuthentication());
      
      // Test 3: Refresh Token
      results.push(await testTokenRefresh());
      
      // Test 4: Almacenamiento Local
      results.push(await testLocalStorage());
      
      // Test 5: Servicios del sistema
      results.push(await testSystemServices());
      
      setTestResults(results);
      
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      
      if (passedTests === totalTests) {
        showNotification('success', 'Diagnóstico Completo', 'Todas las pruebas pasaron exitosamente.');
      } else {
        showNotification('warning', 'Diagnóstico Completo', `${passedTests}/${totalTests} pruebas pasaron.`);
      }
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      showNotification('error', 'Error en Diagnóstico', 'Ocurrió un error durante las pruebas.');
    } finally {
      setIsRunningTest(false);
    }
  };

  const testConnectivity = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/bff/status`);
      return {
        name: 'Conectividad BFF',
        passed: response.ok,
        message: response.ok ? 'BFF responde correctamente' : `Error ${response.status}`,
        details: `Latencia: ${diagnosticData.connectivity.latency}ms`
      };
    } catch (error) {
      return {
        name: 'Conectividad BFF',
        passed: false,
        message: 'No se pudo conectar al BFF',
        details: error.message
      };
    }
  };

  const testAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        name: 'Autenticación',
        passed: false,
        message: 'No hay token de autenticación',
        details: 'Usuario no está logueado'
      };
    }

    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/bff/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      return {
        name: 'Autenticación',
        passed: response.ok && data.authenticated,
        message: data.authenticated ? 'Token válido' : 'Token inválido',
        details: `Estado: ${response.status}`
      };
    } catch (error) {
      return {
        name: 'Autenticación',
        passed: false,
        message: 'Error verificando token',
        details: error.message
      };
    }
  };

  const testTokenRefresh = async () => {
    try {
      const estado = tokenRefreshManager.obtenerEstado();
      return {
        name: 'Sistema Refresh Token',
        passed: estado.activo,
        message: estado.activo ? 'Sistema activo' : 'Sistema inactivo',
        details: `Listeners: ${estado.listenersActivos}, Refresheando: ${estado.refresheando ? 'Sí' : 'No'}`
      };
    } catch (error) {
      return {
        name: 'Sistema Refresh Token',
        passed: false,
        message: 'Error verificando sistema',
        details: error.message
      };
    }
  };

  const testLocalStorage = () => {
    try {
      // Test de escritura/lectura
      const testKey = 'diagnostic_test';
      const testValue = Date.now().toString();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const works = retrieved === testValue;
      return {
        name: 'Almacenamiento Local',
        passed: works,
        message: works ? 'Funcionando correctamente' : 'Error en localStorage',
        details: `Token: ${diagnosticData.localStorage.tokenExists ? 'Presente' : 'Ausente'}`
      };
    } catch (error) {
      return {
        name: 'Almacenamiento Local',
        passed: false,
        message: 'localStorage no disponible',
        details: error.message
      };
    }
  };

  const testSystemServices = async () => {
    const services = ['BFF', 'Backend'];
    let passedServices = 0;
    
    if (systemStatus.bff === 'online') passedServices++;
    if (systemStatus.backend === 'online') passedServices++;
    
    return {
      name: 'Servicios del Sistema',
      passed: passedServices === services.length,
      message: `${passedServices}/${services.length} servicios online`,
      details: `BFF: ${systemStatus.bff}, Backend: ${systemStatus.backend}`
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'offline':
      case 'inactive':
      case 'poor':
        return 'text-red-600 bg-red-100';
      case 'good':
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🔧 Diagnóstico Avanzado del Sistema
        </h2>
        
        {/* Estado General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Estado de Servicios</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>BFF:</span>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(systemStatus.bff)}`}>
                  {systemStatus.bff}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Backend:</span>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(systemStatus.backend)}`}>
                  {systemStatus.backend}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Última verificación: {formatTimestamp(systemStatus.lastCheck)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Refresh Tokens</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Estado:</span>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(diagnosticData.tokenManager.status)}`}>
                  {diagnosticData.tokenManager.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Listeners:</span>
                <span className="text-sm">{diagnosticData.tokenManager.activeListeners}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Último refresh: {formatTimestamp(diagnosticData.tokenManager.lastRefresh)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Conectividad</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Calidad:</span>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(diagnosticData.connectivity.connectionQuality)}`}>
                  {diagnosticData.connectivity.connectionQuality}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Latencia:</span>
                <span className="text-sm">
                  {diagnosticData.connectivity.latency ? `${diagnosticData.connectivity.latency}ms` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={runComprehensiveTest}
            disabled={isRunningTest}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunningTest ? '🔄 Ejecutando...' : '🔍 Ejecutar Diagnóstico Completo'}
          </button>
          
          <button
            onClick={forceTokenRefresh}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🔄 Forzar Refresh Token
          </button>
          
          <button
            onClick={checkSystemStatus}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            📡 Verificar Conectividad
          </button>
        </div>

        {/* Resultados de Pruebas */}
        {testResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Resultados de Pruebas</h3>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded border">
                  <span className={`text-xl ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                    {result.details && (
                      <div className="text-xs text-gray-500 mt-1">{result.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información Detallada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Almacenamiento Local</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Token presente:</span>
                <span className={diagnosticData.localStorage.tokenExists ? 'text-green-600' : 'text-red-600'}>
                  {diagnosticData.localStorage.tokenExists ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Usuario presente:</span>
                <span className={diagnosticData.localStorage.userExists ? 'text-green-600' : 'text-red-600'}>
                  {diagnosticData.localStorage.userExists ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Auth timestamp: {formatTimestamp(diagnosticData.localStorage.authTimestamp)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Información del Sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hostname:</span>
                <span className="text-gray-700">{window.location.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span>Puerto Frontend:</span>
                <span className="text-gray-700">{window.location.port || '80'}</span>
              </div>
              <div className="flex justify-between">
                <span>Protocolo:</span>
                <span className="text-gray-700">{window.location.protocol}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnosticAdvanced;
