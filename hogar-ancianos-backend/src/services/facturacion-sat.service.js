/**
 * Servicio para la integración con el sistema de Recibos de Donación Electrónicos de la SAT
 * Este servicio se encarga de la autenticación con SAT y la emisión de recibos de donación electrónicos
 */

const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const { v4: uuidv4 } = require('uuid');

// Configuración para entornos de desarrollo y producción
const config = {
  development: {
    apiUrl: 'https://apiv2.ifacere-fel.com/api/FELRequestV2',
    certificationUrl: 'https://certificador.fel.sat.gob.gt/FELCertificacion',
    validationUrl: 'https://validador.fel.sat.gob.gt/FELValidacion'
  },
  production: {
    apiUrl: 'https://app.ifacere-fel.com/api/FELRequest',
    certificationUrl: 'https://certificador.fel.sat.gob.gt/FEL',
    validationUrl: 'https://validador.fel.sat.gob.gt/FEL'
  }
};

// Configuración de certificados SSL para conexiones seguras
const agent = new https.Agent({
  rejectUnauthorized: false, // Usar true en producción
  // Para producción: Cargar certificados desde variables de entorno o archivos seguros
  // cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem')),
  // key: fs.readFileSync(path.join(__dirname, '../../certs/key.pem')),
  // ca: fs.readFileSync(path.join(__dirname, '../../certs/ca.pem'))
});

// Información oficial de la entidad según SAT
const DATOS_EMISOR = {
  nombreEmisor: 'ASOCIACION FAMILIA VICENTINA DE LA CIUDAD DE QUETZALTENANGO',
  nombreComercial: 'FAVIQ',
  nit: '65050223',
  direccion: '14 AVENIDA 0-11 zona 1',
  codigoPostal: '09001',
  municipio: 'Quetzaltenango',
  departamento: 'QUETZALTENANGO',
  pais: 'GT'
};

class RecibosDonacionService {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = config[this.env];
    this.token = null;
    this.tokenExpiration = null;
    
    // Credenciales que deben ser reemplazadas con las reales de la Asociación
    this.credentials = {
      nit: process.env.SAT_NIT || DATOS_EMISOR.nit,
      user: process.env.SAT_USERNAME || '',
      password: process.env.SAT_PASSWORD || '',
      certificadorNit: process.env.SAT_CERTIFICADOR_NIT || '',
      emisorNit: process.env.SAT_EMISOR_NIT || DATOS_EMISOR.nit
    };
  }

  /**
   * Autenticación con el servicio de la SAT
   * @returns {Promise<string>} Token de acceso
   */
  async authenticate() {
    try {
      // Verificar si ya tenemos un token válido
      if (this.token && this.tokenExpiration && new Date() < this.tokenExpiration) {
        return this.token;
      }

      const response = await axios.post(
        `${this.config.apiUrl}/autenticar`,
        {
          username: this.credentials.user,
          password: this.credentials.password
        },
        { httpsAgent: agent }
      );

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Tokens normalmente válidos por 24 horas, pero configuramos 23 por seguridad
        this.tokenExpiration = new Date(Date.now() + 23 * 60 * 60 * 1000);
        return this.token;
      } else {
        throw new Error('No se pudo obtener el token de autenticación');
      }
    } catch (error) {
      console.error('Error al autenticar con SAT:', error);
      throw error;
    }
  }

  /**
   * Genera el XML del recibo siguiendo el esquema requerido por SAT
   * @param {Object} data - Datos del recibo
   * @returns {string} - XML del recibo en formato DTE
   */
  generateDTEXML(data) {
    try {
      const { emisor, receptor, items, totalAmount, documentType = 'RDON' } = data;

      // Generar identificadores únicos
      const uuid = uuidv4();
      const dateTime = new Date().toISOString();

      // Construir el XML siguiendo el esquema SAT
      const xmlObj = {
        dte: {
          '@xmlns': 'http://www.sat.gob.gt/dte/fel/0.2.0',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@Version': '0.1',
          DatosEmision: {
            DatosGenerales: {
              '@CodigoMoneda': 'GTQ',
              '@FechaHoraEmision': dateTime,
              '@Tipo': documentType
            },
            Emisor: {
              '@AfiliacionIVA': 'GEN',
              '@CodigoEstablecimiento': '1',
              '@NITEmisor': emisor.nit,
              '@NombreComercial': emisor.nombreComercial,
              '@NombreEmisor': emisor.nombreEmisor,
              DireccionEmisor: {
                Direccion: emisor.direccion,
                CodigoPostal: emisor.codigoPostal,
                Municipio: emisor.municipio,
                Departamento: emisor.departamento,
                Pais: emisor.pais || 'GT'
              }
            },
            Receptor: {
              '@IDReceptor': receptor.nit || 'CF', // CF = Consumidor Final
              '@NombreReceptor': receptor.nombre,
              DireccionReceptor: {
                Direccion: receptor.direccion || 'Ciudad',
                CodigoPostal: receptor.codigoPostal || '01001',
                Municipio: receptor.municipio || 'Guatemala',
                Departamento: receptor.departamento || 'Guatemala',
                Pais: receptor.pais || 'GT'
              }
            },
            Items: {
              Item: items.map((item, index) => ({
                '@NumeroLinea': index + 1,
                '@BienOServicio': item.tipo || 'B', // B=Bien, S=Servicio
                Cantidad: item.cantidad,
                UnidadMedida: item.unidadMedida || 'UND',
                Descripcion: item.descripcion,
                PrecioUnitario: item.precioUnitario,
                Precio: item.precioUnitario * item.cantidad,
                Descuento: item.descuento || 0,
                Total: (item.precioUnitario * item.cantidad) - (item.descuento || 0)
              }))
            },
            Totales: {
              GranTotal: totalAmount
            },
            Complementos: {
              Complemento: {
                '@IDComplemento': 'Notas',
                '@NombreComplemento': 'Notas',
                '@URIComplemento': 'http://www.sat.gob.gt/fel/notas.xsd',
                Notas: data.notas || 'Recibo de donación electrónico emitido por ASOCIACION FAMILIA VICENTINA DE LA CIUDAD DE QUETZALTENANGO'
              }
            }
          }
        }
      };

      // Crear XML con xmlbuilder2 en lugar de fast-xml-builder
      const builder = create(xmlObj);
      return builder.end({ prettyPrint: true });
    } catch (error) {
      console.error('Error al generar XML de DTE:', error);
      throw new Error('Error al generar XML del recibo de donación electrónico');
    }
  }

  /**
   * Firma electrónicamente el documento XML
   * @param {string} xmlContent - Contenido XML del DTE
   * @returns {Promise<string>} - XML firmado
   */
  async signDTE(xmlContent) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.config.apiUrl}/firmar`,
        {
          xml_content: xmlContent,
          certificador_nit: this.credentials.certificadorNit,
          emisor_nit: this.credentials.emisorNit
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent
        }
      );

      if (response.data && response.data.signed_xml) {
        return response.data.signed_xml;
      } else {
        throw new Error('No se pudo firmar electrónicamente el documento');
      }
    } catch (error) {
      console.error('Error al firmar DTE:', error);
      throw error;
    }
  }

  /**
   * Envía el XML firmado al certificador de la SAT
   * @param {string} signedXml - XML firmado
   * @returns {Promise<Object>} - Respuesta del certificador
   */
  async certifyDTE(signedXml) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.config.apiUrl}/certificar`,
        {
          signed_xml: signedXml
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent
        }
      );

      if (response.data && response.data.uuid) {
        return {
          uuid: response.data.uuid,
          serie: response.data.serie,
          numero: response.data.numero,
          fecha_certificacion: response.data.fecha_certificacion,
          xml_certificado: response.data.xml_certificado
        };
      } else {
        throw new Error('Error al certificar el documento: ' + (response.data.error || 'Sin detalles'));
      }
    } catch (error) {
      console.error('Error al certificar DTE:', error);
      throw error;
    }
  }

  /**
   * Proceso completo para emitir un recibo de donación electrónico
   * @param {Object} reciboData - Datos completos del recibo
   * @returns {Promise<Object>} - Datos del recibo certificado
   */
  async emitirReciboDonacion(reciboData) {
    try {
      // 1. Generar el XML del DTE
      const xmlContent = this.generateDTEXML(reciboData);
      
      // 2. Firmar electrónicamente el XML
      const signedXml = await this.signDTE(xmlContent);
      
      // 3. Certificar el XML firmado
      const certificacionResult = await this.certifyDTE(signedXml);
      
      // 4. Guardar el resultado y generar respuesta amigable
      return {
        success: true,
        mensaje: 'Recibo de donación emitido correctamente',
        recibo: {
          uuid: certificacionResult.uuid,
          serie: certificacionResult.serie,
          numero: certificacionResult.numero,
          fecha: certificacionResult.fecha_certificacion,
          receptor: reciboData.receptor.nombre,
          nit_receptor: reciboData.receptor.nit || 'CF',
          monto_total: reciboData.totalAmount,
          xml_url: certificacionResult.xml_certificado
        }
      };
    } catch (error) {
      console.error('Error en proceso de emisión de recibo de donación:', error);
      return {
        success: false,
        mensaje: 'Error al emitir el recibo de donación electrónico',
        error: error.message
      };
    }
  }

  /**
   * Emite un recibo por donación
   * @param {Object} donacionData - Datos de la donación
   * @returns {Promise<Object>} - Datos del recibo certificado
   */
  async procesarReciboDonacion(donacionData) {
    const { donante, monto, descripcion, tipo, valorEstimado } = donacionData;
    
    // Configurar datos específicos para recibo de donación
    const reciboData = {
      emisor: {
        nit: DATOS_EMISOR.nit,
        nombreEmisor: DATOS_EMISOR.nombreEmisor,
        nombreComercial: DATOS_EMISOR.nombreComercial,
        direccion: DATOS_EMISOR.direccion,
        codigoPostal: DATOS_EMISOR.codigoPostal,
        municipio: DATOS_EMISOR.municipio,
        departamento: DATOS_EMISOR.departamento,
        pais: DATOS_EMISOR.pais
      },
      receptor: {
        nit: donante.nit || 'CF',
        nombre: donante.nombre || donacionData.donante,
        direccion: donante.direccion || 'Ciudad'
      },
      items: [
        {
          tipo: 'S',
          cantidad: 1,
          descripcion: descripcion || `Donación ${tipo}`,
          precioUnitario: tipo === 'Monetaria' ? monto : valorEstimado,
          unidadMedida: 'UND'
        }
      ],
      totalAmount: tipo === 'Monetaria' ? monto : valorEstimado,
      documentType: 'RDON', // Tipo documento: Recibo por donación
      notas: 'Donación realizada a la ASOCIACION FAMILIA VICENTINA DE LA CIUDAD DE QUETZALTENANGO'
    };
    
    return await this.emitirReciboDonacion(reciboData);
  }

  /**
   * Consulta el estado de un recibo por su UUID
   * @param {string} uuid - Identificador único del recibo
   * @returns {Promise<Object>} - Estado del recibo
   */
  async consultarEstadoRecibo(uuid) {
    try {
      const token = await this.authenticate();

      const response = await axios.get(
        `${this.config.apiUrl}/consultar/${uuid}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          httpsAgent: agent
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error al consultar estado del recibo ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Genera una URL para descargar el PDF del recibo
   * @param {string} uuid - Identificador único del recibo
   * @returns {string} - URL para descargar el PDF
   */
  generarURLPDF(uuid) {
    return `${this.config.validationUrl}/PDF/${uuid}`;
  }

  /**
   * Anula un recibo emitido previamente
   * @param {string} uuid - UUID del recibo a anular
   * @param {string} motivo - Motivo de la anulación
   * @returns {Promise<Object>} - Resultado de la anulación
   */
  async anularRecibo(uuid, motivo) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.config.apiUrl}/anular`,
        {
          uuid: uuid,
          motivo: motivo || 'Anulación solicitada'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error al anular recibo:', error);
      throw error;
    }
  }
}

module.exports = new RecibosDonacionService();