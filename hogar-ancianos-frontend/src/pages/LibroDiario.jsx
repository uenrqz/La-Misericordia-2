import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import finanzasService from '../services/finanzas.service';

const LibroDiario = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [predicciones, setPredicciones] = useState([]);
  const [mostrarPredicciones, setMostrarPredicciones] = useState(false);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    tipo: 'egreso',
    categoria_id: '',
    monto: '',
    descripcion: '',
    fecha_transaccion: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    numero_comprobante: ''
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    categoria_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [transData, categoriasData, resumenData] = await Promise.all([
        finanzasService.obtenerTransacciones(filtros),
        finanzasService.obtenerCategorias(),
        finanzasService.obtenerResumenMensual(filtros.mes, filtros.anio)
      ]);
      
      setTransacciones(transData);
      setCategorias(categoriasData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const cargarPredicciones = async () => {
    try {
      const data = await finanzasService.obtenerPredicciones();
      setPredicciones(data);
      setMostrarPredicciones(true);
    } catch (error) {
      console.error('Error al cargar predicciones:', error);
      toast.error('Error al cargar predicciones');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await finanzasService.crearTransaccion(formData);
      toast.success('Transacción registrada exitosamente');
      setShowModal(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error al crear transacción:', error);
      toast.error(error.response?.data?.message || 'Error al registrar transacción');
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta transacción?')) {
      try {
        await finanzasService.eliminarTransaccion(id);
        toast.success('Transacción eliminada');
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        toast.error('Error al eliminar transacción');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'egreso',
      categoria_id: '',
      monto: '',
      descripcion: '',
      fecha_transaccion: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      numero_comprobante: ''
    });
  };

  const exportarDatos = async (formato) => {
    try {
      const blob = await finanzasService.exportarTransacciones(formato, filtros);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacciones_${new Date().toISOString().split('T')[0]}.${formato}`;
      link.click();
      toast.success(`Datos exportados en formato ${formato.toUpperCase()}`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar datos');
    }
  };

  const aplicarPrediccion = (prediccion) => {
    setFormData({
      ...formData,
      tipo: 'egreso',
      categoria_id: prediccion.categoria_id,
      monto: prediccion.monto_promedio,
      descripcion: prediccion.descripcion_comun || ''
    });
    setMostrarPredicciones(false);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Libro Diario Financiero</h1>
        <p className="text-gray-600">Control de ingresos y egresos del hogar</p>
      </div>

      {/* Resumen Financiero */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Ingresos</p>
            <p className="text-2xl font-bold text-blue-600">
              Q{parseFloat(resumen.total_ingresos || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Total Egresos</p>
            <p className="text-2xl font-bold text-red-600">
              Q{parseFloat(resumen.total_egresos || 0).toFixed(2)}
            </p>
          </div>
          <div className={`${resumen.balance >= 0 ? 'bg-green-50' : 'bg-orange-50'} rounded-lg p-4 border-l-4 ${resumen.balance >= 0 ? 'border-green-500' : 'border-orange-500'}`}>
            <p className="text-sm text-gray-600">Balance</p>
            <p className={`text-2xl font-bold ${resumen.balance >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
              Q{parseFloat(resumen.balance || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Transacciones</p>
            <p className="text-2xl font-bold text-purple-600">{resumen.total_transacciones}</p>
          </div>
        </div>
      )}

      {/* Barra de Acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className="fas fa-plus"></i>
              Nueva Transacción
            </button>
            <button
              onClick={cargarPredicciones}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className="fas fa-brain"></i>
              Ver Predicciones
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportarDatos('excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className="fas fa-file-excel"></i>
              Excel
            </button>
            <button
              onClick={() => exportarDatos('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className="fas fa-file-pdf"></i>
              PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
          
          <select
            value={filtros.categoria_id}
            onChange={(e) => setFiltros({...filtros, categoria_id: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Fecha fin"
          />

          <button
            onClick={() => setFiltros({
              tipo: '',
              categoria_id: '',
              fecha_inicio: '',
              fecha_fin: '',
              mes: new Date().getMonth() + 1,
              anio: new Date().getFullYear()
            })}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de Transacciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transacciones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-2"></i>
                    <p>No hay transacciones registradas</p>
                  </td>
                </tr>
              ) : (
                transacciones.map((trans) => (
                  <tr key={trans.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(trans.fecha_transaccion).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trans.tipo === 'ingreso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trans.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trans.categoria_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {trans.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trans.metodo_pago}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={trans.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                        Q{parseFloat(trans.monto).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEliminar(trans.id)}
                        className="text-red-600 hover:text-red-900 transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nueva Transacción */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Nueva Transacción</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Transacción *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="egreso">Egreso</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias
                      .filter(cat => cat.tipo === formData.tipo)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_transaccion}
                    onChange={(e) => setFormData({...formData, fecha_transaccion: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Comprobante
                  </label>
                  <input
                    type="text"
                    value={formData.numero_comprobante}
                    onChange={(e) => setFormData({...formData, numero_comprobante: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Detalle de la transacción"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Predicciones */}
      {mostrarPredicciones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                <i className="fas fa-brain text-purple-600 mr-2"></i>
                Predicciones Inteligentes
              </h2>
              <button
                onClick={() => setMostrarPredicciones(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {predicciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-info-circle text-4xl mb-2"></i>
                  <p>No hay suficiente historial para generar predicciones</p>
                  <p className="text-sm mt-2">Registre más transacciones para obtener sugerencias</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {predicciones.map((pred, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => aplicarPrediccion(pred)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{pred.categoria_nombre}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {pred.descripcion_comun || 'Sin descripción'}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>
                              <i className="fas fa-calendar-alt mr-1"></i>
                              Cada {pred.frecuencia_dias} días
                            </span>
                            <span>
                              <i className="fas fa-chart-line mr-1"></i>
                              {pred.total_ocurrencias} veces
                            </span>
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              Próximo: {new Date(pred.proxima_fecha_estimada).toLocaleDateString('es-GT')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            Q{parseFloat(pred.monto_promedio).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">promedio</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibroDiario;
