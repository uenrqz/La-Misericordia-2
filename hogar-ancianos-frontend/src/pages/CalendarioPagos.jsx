import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import finanzasService from '../services/finanzas.service';

const CalendarioPagos = () => {
  const [pagosProgramados, setPagosProgramados] = useState([]);
  const [instancias, setInstancias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedInstancia, setSelectedInstancia] = useState(null);
  const [vistaActual, setVistaActual] = useState('calendario'); // 'calendario' o 'lista'
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    monto_base: '',
    categoria_id: '',
    frecuencia: 'mensual',
    dia_programado: 1,
    fecha_inicio: new Date().toISOString().split('T')[0],
    activo: true
  });

  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, [mesActual, anioActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pagosData, instanciasData, categoriasData] = await Promise.all([
        finanzasService.obtenerPagosProgramados(),
        finanzasService.obtenerInstanciasPagos(mesActual, anioActual),
        finanzasService.obtenerCategorias()
      ]);
      
      setPagosProgramados(pagosData.filter(p => p.activo));
      setInstancias(instanciasData);
      setCategorias(categoriasData.filter(c => c.tipo === 'egreso'));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar el calendario de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();
    try {
      await finanzasService.crearPagoProgramado(formData);
      toast.success('Pago programado creado exitosamente');
      setShowModal(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      console.error('Error al crear pago programado:', error);
      toast.error(error.response?.data?.message || 'Error al crear pago programado');
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    try {
      await finanzasService.registrarPago(selectedInstancia.id, {
        monto_pagado: selectedInstancia.monto_real || selectedInstancia.monto_programado,
        metodo_pago: selectedInstancia.metodo_pago || 'efectivo',
        numero_comprobante: selectedInstancia.numero_comprobante || ''
      });
      toast.success('Pago registrado exitosamente');
      setShowPagoModal(false);
      setSelectedInstancia(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const handleDesactivarPago = async (id) => {
    if (window.confirm('¿Está seguro de desactivar este pago programado?')) {
      try {
        await finanzasService.desactivarPagoProgramado(id);
        toast.success('Pago programado desactivado');
        cargarDatos();
      } catch (error) {
        console.error('Error al desactivar:', error);
        toast.error('Error al desactivar pago programado');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      monto_base: '',
      categoria_id: '',
      frecuencia: 'mensual',
      dia_programado: 1,
      fecha_inicio: new Date().toISOString().split('T')[0],
      activo: true
    });
  };

  const getDiasDelMes = () => {
    const primerDia = new Date(anioActual, mesActual - 1, 1);
    const ultimoDia = new Date(anioActual, mesActual, 0);
    const dias = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(i);
    }
    
    return dias;
  };

  const obtenerInstanciasPorDia = (dia) => {
    return instancias.filter(inst => {
      const fecha = new Date(inst.fecha_programada);
      return fecha.getDate() === dia;
    });
  };

  const cambiarMes = (direccion) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;
    
    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio++;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio--;
    }
    
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      pagado: 'bg-green-100 text-green-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    
    const textos = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${estilos[estado]}`}>
        {textos[estado]}
      </span>
    );
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendario de Pagos</h1>
        <p className="text-gray-600">Gestión y seguimiento de pagos programados</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pagos Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {instancias.filter(i => i.estado === 'pendiente').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Pagos Realizados</p>
          <p className="text-2xl font-bold text-green-600">
            {instancias.filter(i => i.estado === 'pagado').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Pagos Vencidos</p>
          <p className="text-2xl font-bold text-red-600">
            {instancias.filter(i => i.estado === 'vencido').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total del Mes</p>
          <p className="text-2xl font-bold text-blue-600">
            Q{instancias.reduce((sum, i) => sum + parseFloat(i.monto_real || i.monto_programado), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className="fas fa-plus"></i>
              Nuevo Pago Programado
            </button>
            
            <button
              onClick={() => setVistaActual(vistaActual === 'calendario' ? 'lista' : 'calendario')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <i className={`fas fa-${vistaActual === 'calendario' ? 'list' : 'calendar'}`}></i>
              {vistaActual === 'calendario' ? 'Ver Lista' : 'Ver Calendario'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="font-semibold text-lg min-w-[200px] text-center">
              {nombresMeses[mesActual - 1]} {anioActual}
            </span>
            <button
              onClick={() => cambiarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Vista de Calendario */}
      {vistaActual === 'calendario' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
              <div key={dia} className="p-3 text-center font-semibold text-gray-700 bg-gray-50">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getDiasDelMes().map((dia, index) => {
              const instanciasDia = dia ? obtenerInstanciasPorDia(dia) : [];
              const esHoy = dia === new Date().getDate() && 
                           mesActual === new Date().getMonth() + 1 && 
                           anioActual === new Date().getFullYear();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-b border-r p-2 ${
                    !dia ? 'bg-gray-50' : esHoy ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {dia && (
                    <>
                      <div className={`text-sm font-semibold mb-2 ${esHoy ? 'text-blue-600' : 'text-gray-700'}`}>
                        {dia}
                      </div>
                      <div className="space-y-1">
                        {instanciasDia.map(instancia => (
                          <div
                            key={instancia.id}
                            onClick={() => {
                              setSelectedInstancia(instancia);
                              if (instancia.estado === 'pendiente') {
                                setShowPagoModal(true);
                              }
                            }}
                            className={`text-xs p-1 rounded cursor-pointer transition ${
                              instancia.estado === 'pagado' 
                                ? 'bg-green-100 hover:bg-green-200' 
                                : instancia.estado === 'vencido'
                                ? 'bg-red-100 hover:bg-red-200'
                                : 'bg-yellow-100 hover:bg-yellow-200'
                            }`}
                          >
                            <div className="font-medium truncate">{instancia.nombre_pago}</div>
                            <div className="text-gray-600">Q{parseFloat(instancia.monto_programado).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {vistaActual === 'lista' && (
        <div className="space-y-4">
          {/* Pagos Programados */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Pagos Programados</h2>
            </div>
            <div className="divide-y">
              {pagosProgramados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>No hay pagos programados</p>
                </div>
              ) : (
                pagosProgramados.map(pago => (
                  <div key={pago.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{pago.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pago.descripcion}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>
                            <i className="fas fa-calendar-alt mr-1"></i>
                            {pago.frecuencia === 'mensual' && `Día ${pago.dia_programado} de cada mes`}
                            {pago.frecuencia === 'semanal' && 'Semanal'}
                            {pago.frecuencia === 'quincenal' && 'Quincenal'}
                            {pago.frecuencia === 'anual' && 'Anual'}
                          </span>
                          <span>
                            <i className="fas fa-tag mr-1"></i>
                            {pago.categoria_nombre}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          Q{parseFloat(pago.monto_base).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDesactivarPago(pago.id)}
                          className="text-red-600 hover:text-red-800 text-sm mt-2 transition"
                        >
                          <i className="fas fa-times-circle mr-1"></i>
                          Desactivar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instancias del mes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Instancias de Pago del Mes</h2>
            </div>
            <div className="divide-y">
              {instancias.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>No hay instancias de pago este mes</p>
                </div>
              ) : (
                instancias.map(instancia => (
                  <div key={instancia.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{instancia.nombre_pago}</h3>
                          {getEstadoBadge(instancia.estado)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Fecha programada: {new Date(instancia.fecha_programada).toLocaleDateString('es-GT')}
                        </p>
                        {instancia.fecha_pago_real && (
                          <p className="text-sm text-green-600">
                            Pagado el: {new Date(instancia.fecha_pago_real).toLocaleDateString('es-GT')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          Q{parseFloat(instancia.monto_real || instancia.monto_programado).toFixed(2)}
                        </p>
                        {instancia.estado === 'pendiente' && (
                          <button
                            onClick={() => {
                              setSelectedInstancia(instancia);
                              setShowPagoModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm mt-2 transition"
                          >
                            <i className="fas fa-check mr-1"></i>
                            Registrar Pago
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Pago Programado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Nuevo Pago Programado</h2>
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

            <form onSubmit={handleSubmitPago} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Pago *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: Pago de agua"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="2"
                  placeholder="Detalles adicionales"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Base (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto_base}
                    onChange={(e) => setFormData({...formData, monto_base: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0.00"
                    required
                  />
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
                    <option value="">Seleccione</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia *
                  </label>
                  <select
                    value={formData.frecuencia}
                    onChange={(e) => setFormData({...formData, frecuencia: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día Programado *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_programado}
                    onChange={(e) => setFormData({...formData, dia_programado: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
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
                  Crear Pago Programado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registrar Pago */}
      {showPagoModal && selectedInstancia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Registrar Pago</h2>
              <button
                onClick={() => {
                  setShowPagoModal(false);
                  setSelectedInstancia(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">{selectedInstancia.nombre_pago}</h3>
                <p className="text-sm text-gray-600">
                  Fecha programada: {new Date(selectedInstancia.fecha_programada).toLocaleDateString('es-GT')}
                </p>
                <p className="text-sm text-gray-600">
                  Monto programado: Q{parseFloat(selectedInstancia.monto_programado).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Pagado (Q) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedInstancia.monto_real || selectedInstancia.monto_programado}
                  onChange={(e) => setSelectedInstancia({...selectedInstancia, monto_real: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={selectedInstancia.metodo_pago || 'efectivo'}
                  onChange={(e) => setSelectedInstancia({...selectedInstancia, metodo_pago: e.target.value})}
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
                  value={selectedInstancia.numero_comprobante || ''}
                  onChange={(e) => setSelectedInstancia({...selectedInstancia, numero_comprobante: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Opcional"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPagoModal(false);
                    setSelectedInstancia(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <i className="fas fa-check mr-2"></i>
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioPagos;
