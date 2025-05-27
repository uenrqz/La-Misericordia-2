import React, { useState, useEffect } from 'react';
import { useSystem } from '../contexts/SystemContext';
import diagnosticService from '../services/diagnostic.service';
import { ejecutarPruebasDeErrores, simularError500, simularError401, simularDesconexion, simularLatenciaAlta } from '../utils/testErrorHandling';

/**
 * Componente de diagnóstico del sistema para verificar el funcionamiento correcto
 * del manejo de errores y la infraestructura de notificaciones.
 */
const SystemDiagnostic = () => {
  const { systemStatus, checkSystemStatus } = useSystem();
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [restoreFunction, setRestoreFunction] = useState(null);

  // Realizar diagnóstico completo del sistema
  const performDiagnostic = async () => {
    try {
      setLoading(true);
      const result = await diagnosticService.performSystemDiagnostic();
      setDiagnosticResult(result);
    } catch (error) {
      console.error('Error al realizar diagnóstico:', error);
      setDiagnosticResult({ error: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al cargar el componente
  useEffect(() => {
    performDiagnostic();
  }, []);

  // Ejecutar una prueba específica
  const runTest = (testType) => {
    // Primero restauramos cualquier prueba anterior
    if (restoreFunction) {
      restoreFunction();
      setRestoreFunction(null);
    }

    setActiveTest(testType);
    setTestResult('Ejecutando prueba...');

    try {
      let restore;
      
      switch (testType) {
        case 'error500':
          restore = simularError500('/api/bff/dashboard');
          break;
        case 'error401':
          restore = simularError401('/api/bff/auth/verify');
          break;
        case 'disconnection':
          restore = simularDesconexion();
          break;
        case 'highLatency':
          restore = simularLatenciaAlta(5000);
          break;
        default:
          setTestResult('Tipo de prueba no reconocido');
          return;
      }

      setRestoreFunction(() => restore);
      setTestResult(`Prueba ${testType} activada correctamente. Navega por la aplicación para ver el efecto.`);
    } catch (error) {
      console.error('Error al ejecutar prueba:', error);
      setTestResult(`Error: ${error.message}`);
    }
  };

  // Restaurar funcionamiento normal
  const restoreNormal = () => {
    if (restoreFunction) {
      restoreFunction();
      setRestoreFunction(null);
      setActiveTest(null);
      setTestResult('Funcionamiento normal restaurado');
      checkSystemStatus(); // Actualizar el estado del sistema
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Diagnóstico del Sistema</h1>
      <p className="text-gray-600 mb-6">
        Esta herramienta permite verificar el estado del sistema y probar el manejo de errores.
      </p>

      {/* Estado actual del sistema */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Estado Actual del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                systemStatus.bff === 'online' ? 'bg-green-500' :
                systemStatus.bff === 'offline' ? 'bg-red-500' :
                systemStatus.bff === 'degraded' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium">BFF</span>
            </div>
            <p className="text-sm text-gray-600 mt-1 capitalize">{systemStatus.bff || 'Desconocido'}</p>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                systemStatus.backend === 'online' ? 'bg-green-500' :
                systemStatus.backend === 'offline' ? 'bg-red-500' :
                systemStatus.backend === 'degraded' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium">Backend</span>
            </div>
            <p className="text-sm text-gray-600 mt-1 capitalize">{systemStatus.backend || 'Desconocido'}</p>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center">
              <span className="font-medium">Última verificación</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {systemStatus.lastCheck ? new Date(systemStatus.lastCheck).toLocaleString() : 'Nunca'}
            </p>
          </div>
        </div>
        
        <button
          onClick={checkSystemStatus}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Verificar conectividad
        </button>
      </div>

      {/* Pruebas de manejo de errores */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Probar manejo de errores</h2>
        <p className="text-sm text-gray-600 mb-4">
          Estas pruebas simularán diferentes tipos de errores para verificar cómo responde la aplicación.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => runTest('error500')}
            className={`px-3 py-2 ${activeTest === 'error500' ? 
              'bg-red-600 text-white' : 
              'bg-white text-gray-700 border border-gray-300'} rounded-md hover:bg-red-100`}
          >
            Simular Error 500
          </button>
          
          <button
            onClick={() => runTest('error401')}
            className={`px-3 py-2 ${activeTest === 'error401' ? 
              'bg-yellow-600 text-white' : 
              'bg-white text-gray-700 border border-gray-300'} rounded-md hover:bg-yellow-100`}
          >
            Simular Error 401
          </button>
          
          <button
            onClick={() => runTest('disconnection')}
            className={`px-3 py-2 ${activeTest === 'disconnection' ? 
              'bg-orange-600 text-white' : 
              'bg-white text-gray-700 border border-gray-300'} rounded-md hover:bg-orange-100`}
          >
            Simular Desconexión
          </button>
          
          <button
            onClick={() => runTest('highLatency')}
            className={`px-3 py-2 ${activeTest === 'highLatency' ? 
              'bg-blue-600 text-white' : 
              'bg-white text-gray-700 border border-gray-300'} rounded-md hover:bg-blue-100`}
          >
            Simular Latencia Alta
          </button>
        </div>
        
        {activeTest && (
          <div className={`p-4 rounded-lg ${
            activeTest === 'error500' ? 'bg-red-50 border border-red-200' :
            activeTest === 'error401' ? 'bg-yellow-50 border border-yellow-200' :
            activeTest === 'disconnection' ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {activeTest === 'error500' ? 'Error 500 simulado activo' :
                   activeTest === 'error401' ? 'Error 401 simulado activo' :
                   activeTest === 'disconnection' ? 'Desconexión simulada activa' :
                   'Latencia alta simulada activa'}
                </p>
                <p className="text-sm mt-1">{testResult}</p>
              </div>
              <button
                onClick={restoreNormal}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Restaurar Normal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diagnóstico detallado */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Diagnóstico Detallado</h2>
          <button
            onClick={performDiagnostic}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Ejecutando...' : 'Ejecutar diagnóstico'}
          </button>
        </div>
        
        {diagnosticResult && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-2">
              <span className="font-medium">Timestamp:</span> {new Date(diagnosticResult.timestamp).toLocaleString()}
            </div>
            
            {/* Mostrar detalles del diagnóstico en formato JSON */}
            <div className="bg-gray-100 p-4 rounded overflow-x-auto">
              <pre className="text-xs text-gray-800">{JSON.stringify(diagnosticResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDiagnostic;
