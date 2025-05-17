import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaMoneyBillWave, FaBoxOpen, FaHandsHelping, FaCalendarAlt, FaFileAlt, FaTrash, FaFileInvoiceDollar, FaIdCard, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';

const FormularioDonacion = ({ donacion, onSave, onCancel, esContador = false }) => {
  const tipoDonacionOptions = ['Monetaria', 'Especie', 'Servicios'];
  const metodoPagoOptions = ['Efectivo', 'Transferencia bancaria', 'Cheque', 'Tarjeta de crédito/débito'];
  const estadoOptions = ['Pendiente', 'Procesada', 'Rechazada'];

  const initialState = {
    tipo_donacion: 'monetaria',
    monto: '',
    valor_estimado: '',
    donante_nombre: '',
    donante_nit: '',
    donante_direccion: '',
    descripcion: '',
    metodo_pago: 'Efectivo',
    detalle_especie: '',
    detalle_servicio: '',
    comprobante: null,
    notas: '',
    fecha_donacion: new Date().toISOString().split('T')[0],
    estado: 'Pendiente',
    generar_recibo: false
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reciboGenerado, setReciboGenerado] = useState(null);
  const [mostrarDetallesRecibo, setMostrarDetallesRecibo] = useState(false);

  useEffect(() => {
    if (donacion) {
      setFormData({
        tipo_donacion: donacion.tipo_donacion || 'monetaria',
        monto: donacion.monto || '',
        valor_estimado: donacion.valor_estimado || '',
        donante_nombre: donacion.donante_nombre || '',
        donante_nit: donacion.donante_nit || '',
        donante_direccion: donacion.donante_direccion || '',
        descripcion: donacion.descripcion || '',
        metodo_pago: donacion.metodo_pago || 'Efectivo',
        detalle_especie: donacion.detalle_especie || '',
        detalle_servicio: donacion.detalle_servicio || '',
        comprobante: null,
        notas: donacion.notas || '',
        fecha_donacion: donacion.fecha_donacion || new Date().toISOString().split('T')[0],
        estado: donacion.estado || 'Pendiente',
        generar_recibo: false
      });

      if (donacion.comprobante_url) {
        setPreviewUrl(donacion.comprobante_url);
      }

      if (donacion.recibo_generado && donacion.uuid_recibo) {
        setReciboGenerado({
          numero: donacion.numero_recibo,
          uuid: donacion.uuid_recibo,
          url_pdf: donacion.url_recibo
        });
      }
    }
  }, [donacion]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (name === 'comprobante' && files && files.length > 0) {
      setFormData({
        ...formData,
        comprobante: files[0]
      });

      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      fileReader.readAsDataURL(files[0]);
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleRemoveFile = () => {
    setFormData({
      ...formData,
      comprobante: null
    });
    setPreviewUrl(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.donante_nombre.trim()) {
      newErrors.donante_nombre = 'El nombre del donante es obligatorio';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.fecha_donacion) {
      newErrors.fecha_donacion = 'La fecha de donación es obligatoria';
    } else {
      const fechaSeleccionada = new Date(formData.fecha_donacion);
      const hoy = new Date();
      if (fechaSeleccionada > hoy) {
        newErrors.fecha_donacion = 'La fecha no puede ser futura';
      }
    }

    if (formData.tipo_donacion === 'monetaria') {
      if (!formData.monto) {
        newErrors.monto = 'El monto es obligatorio para donaciones monetarias';
      } else if (isNaN(formData.monto) || Number(formData.monto) <= 0) {
        newErrors.monto = 'El monto debe ser un número válido mayor que cero';
      }
    } else {
      if (!formData.valor_estimado) {
        newErrors.valor_estimado = 'El valor estimado es obligatorio';
      } else if (isNaN(formData.valor_estimado) || Number(formData.valor_estimado) <= 0) {
        newErrors.valor_estimado = 'El valor estimado debe ser un número válido mayor que cero';
      }

      if (formData.tipo_donacion === 'especie' && !formData.detalle_especie.trim()) {
        newErrors.detalle_especie = 'Detalle de los artículos donados es obligatorio';
      }

      if (formData.tipo_donacion === 'servicios' && !formData.detalle_servicio.trim()) {
        newErrors.detalle_servicio = 'Detalle del servicio donado es obligatorio';
      }
    }

    if (formData.generar_recibo && !formData.donante_nit) {
      newErrors.donante_nit = 'El NIT es obligatorio para generar recibo de donación';
    }

    if (formData.generar_recibo && !formData.donante_direccion) {
      newErrors.donante_direccion = 'La dirección es obligatoria para generar recibo de donación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setIsSubmitting(true);

      try {
        const formDataToSend = new FormData();

        Object.keys(formData).forEach(key => {
          if (
            (key !== 'detalle_especie' || formData.tipo_donacion === 'especie') &&
            (key !== 'detalle_servicio' || formData.tipo_donacion === 'servicios') &&
            (key !== 'monto' || formData.tipo_donacion === 'monetaria') &&
            (key !== 'valor_estimado' || formData.tipo_donacion !== 'monetaria')
          ) {
            if (key === 'comprobante' && formData[key]) {
              formDataToSend.append('comprobante', formData[key]);
            } else if (formData[key] !== null && formData[key] !== undefined) {
              formDataToSend.append(key, formData[key]);
            }
          }
        });

        let response;
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

        if (donacion?.id) {
          response = await axios.put(`${apiUrl}/donaciones/${donacion.id}`, formDataToSend);
        } else {
          response = await axios.post(`${apiUrl}/donaciones`, formDataToSend);
        }

        const donacionGuardada = response.data;

        if (formData.generar_recibo && donacionGuardada.recibo) {
          setReciboGenerado({
            numero: donacionGuardada.recibo.numero,
            serie: donacionGuardada.recibo.serie,
            uuid: donacionGuardada.recibo.uuid,
            url_pdf: donacionGuardada.recibo.url_pdf
          });
          setMostrarDetallesRecibo(true);
        }

        onSave(donacionGuardada);

        if (!donacion) {
          setFormData(initialState);
          setPreviewUrl(null);
        }
      } catch (error) {
        console.error('Error al guardar la donación:', error);
        alert(`Error al guardar la donación: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGenerarRecibo = async () => {
    if (!donacion?.id) return;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await axios.post(`${apiUrl}/donaciones/${donacion.id}/recibo`);

      if (response.data && response.data.recibo) {
        setReciboGenerado({
          numero: response.data.recibo.numero,
          serie: response.data.recibo.serie,
          uuid: response.data.recibo.uuid,
          url_pdf: response.data.recibo.url_pdf
        });
        setMostrarDetallesRecibo(true);

        onSave({
          ...donacion,
          recibo_generado: true,
          numero_recibo: response.data.recibo.numero,
          uuid_recibo: response.data.recibo.uuid,
          url_recibo: response.data.recibo.url_pdf
        });
      }
    } catch (error) {
      console.error('Error al generar recibo de donación:', error);
      alert(`Error al generar recibo de donación: ${error.response?.data?.mensaje || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisualizarRecibo = () => {
    if (reciboGenerado?.url_pdf) {
      window.open(reciboGenerado.url_pdf, '_blank');
    }
  };

  const renderDetallesRecibo = () => {
    if (!mostrarDetallesRecibo || !reciboGenerado) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full">
          <h3 className="text-lg font-semibold text-center mb-4">Recibo de Donación Generado Exitosamente</h3>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-4">
              <FaFileInvoiceDollar className="text-3xl text-green-600" />
            </div>

            <p className="text-center mb-2">
              <span className="font-semibold">Serie:</span> {reciboGenerado.serie}
            </p>
            <p className="text-center mb-2">
              <span className="font-semibold">Número:</span> {reciboGenerado.numero}
            </p>
            <p className="text-center text-xs text-gray-600 break-all">
              <span className="font-semibold">UUID:</span> {reciboGenerado.uuid}
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleVisualizarRecibo}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Ver Recibo de Donación
            </button>

            <button
              onClick={() => setMostrarDetallesRecibo(false)}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaBoxOpen className="inline mr-1" /> Tipo de Donación
            </label>
            <select
              name="tipo_donacion"
              value={formData.tipo_donacion}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {tipoDonacionOptions.map(option => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaCalendarAlt className="inline mr-1" /> Fecha de Donación
            </label>
            <input
              type="date"
              name="fecha_donacion"
              value={formData.fecha_donacion}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.fecha_donacion && <p className="text-red-500 text-xs mt-1">{errors.fecha_donacion}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaIdCard className="inline mr-1" /> Nombre del Donante
            </label>
            <input
              type="text"
              name="donante_nombre"
              value={formData.donante_nombre}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nombre completo o razón social"
            />
            {errors.donante_nombre && <p className="text-red-500 text-xs mt-1">{errors.donante_nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFileInvoiceDollar className="inline mr-1" /> NIT
            </label>
            <input
              type="text"
              name="donante_nit"
              value={formData.donante_nit}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="NIT del donante (si aplica)"
            />
            {errors.donante_nit && <p className="text-red-500 text-xs mt-1">{errors.donante_nit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-1" /> Dirección
            </label>
            <input
              type="text"
              name="donante_direccion"
              value={formData.donante_direccion}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Dirección del donante (si aplica)"
            />
            {errors.donante_direccion && <p className="text-red-500 text-xs mt-1">{errors.donante_direccion}</p>}
          </div>

          {formData.tipo_donacion === 'monetaria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMoneyBillWave className="inline mr-1" /> Monto (Q)
              </label>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto}</p>}
            </div>
          )}

          {formData.tipo_donacion !== 'monetaria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMoneyBillWave className="inline mr-1" /> Valor Estimado (Q)
              </label>
              <input
                type="number"
                name="valor_estimado"
                value={formData.valor_estimado}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.valor_estimado && (
                <p className="text-red-500 text-xs mt-1">{errors.valor_estimado}</p>
              )}
            </div>
          )}

          {formData.tipo_donacion === 'monetaria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMoneyBillWave className="inline mr-1" /> Método de Pago
              </label>
              <select
                name="metodo_pago"
                value={formData.metodo_pago}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {metodoPagoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.tipo_donacion === 'especie' && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaBoxOpen className="inline mr-1" /> Detalle de Artículos Donados
              </label>
              <textarea
                name="detalle_especie"
                value={formData.detalle_especie}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describa los artículos donados, cantidades y estado"
              ></textarea>
              {errors.detalle_especie && <p className="text-red-500 text-xs mt-1">{errors.detalle_especie}</p>}
            </div>
          )}

          {formData.tipo_donacion === 'servicios' && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaHandsHelping className="inline mr-1" /> Detalle de Servicios Donados
              </label>
              <textarea
                name="detalle_servicio"
                value={formData.detalle_servicio}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describa los servicios donados, duración y alcance"
              ></textarea>
              {errors.detalle_servicio && <p className="text-red-500 text-xs mt-1">{errors.detalle_servicio}</p>}
            </div>
          )}

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFileAlt className="inline mr-1" /> Descripción General
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Información adicional sobre la donación..."
            ></textarea>
          </div>

          {esContador && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {estadoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(esContador || !donacion) && (
            <div className="flex items-center">
              <input
                id="generar-recibo"
                name="generar_recibo"
                type="checkbox"
                checked={formData.generar_recibo}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="generar-recibo" className="ml-2 block text-sm text-gray-700">
                <FaFileInvoiceDollar className="inline mr-1" /> Generar recibo de donación
              </label>
            </div>
          )}

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaFileAlt className="inline mr-1" /> Comprobante de donación
            </label>
            <input
              type="file"
              name="comprobante"
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formData.comprobante_url && (
              <div className="mt-2">
                <a
                  href={formData.comprobante_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <FaFileAlt className="mr-1" /> Ver comprobante actual
                </a>
              </div>
            )}
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTimes className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Por favor corrige los errores en el formulario antes de continuar.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {esContador && donacion && !donacion.recibo_generado && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
              onClick={handleGenerarRecibo}
              disabled={isSubmitting}
            >
              <FaFileInvoiceDollar className="mr-2" />
              Generar Recibo de Donación
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaTimes className="mr-2 -ml-1" />
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaSave className="mr-2 -ml-1" />
            Guardar
          </button>
        </div>
      </form>

      {renderDetallesRecibo()}
    </>
  );
};

export default FormularioDonacion;