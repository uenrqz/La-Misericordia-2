/**
 * Script para poblar la base de datos con datos iniciales de prueba
 * Este script crea usuarios, residentes y datos básicos para demostración
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hogar_user',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'hogar_db'
});

/**
 * Función para encriptar contraseñas
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Función principal para poblar la base de datos
 */
async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Iniciando población de la base de datos...');
    
    // 1. Crear usuarios de prueba
    console.log('Creando usuarios de prueba...');
    
    const usuarios = [
      // Administrador
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@lamisericordia.org',
        password: await hashPassword('admin123'),
        rol: 'admin'
      },
      // Médico
      {
        nombre: 'Doctor',
        apellido: 'García',
        email: 'doctor@lamisericordia.org',
        password: await hashPassword('doctor123'),
        rol: 'medico'
      },
      // Enfermera
      {
        nombre: 'Enfermera',
        apellido: 'López',
        email: 'enfermera@lamisericordia.org',
        password: await hashPassword('enfermera123'),
        rol: 'enfermera'
      },
      // Administrativo
      {
        nombre: 'Secretaria',
        apellido: 'Mendez',
        email: 'secretaria@lamisericordia.org',
        password: await hashPassword('secretaria123'),
        rol: 'administrativo'
      },
      // Contador
      {
        nombre: 'Contador',
        apellido: 'Ramírez',
        email: 'contador@lamisericordia.org',
        password: await hashPassword('contador123'),
        rol: 'contador'
      }
    ];
    
    for (const usuario of usuarios) {
      await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, rol)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [usuario.nombre, usuario.apellido, usuario.email, usuario.password, usuario.rol]
      );
    }
    
    console.log('Usuarios creados exitosamente');
    
    // 2. Crear residentes de prueba
    console.log('Creando residentes de prueba...');
    
    const residentes = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1945-05-15',
        direccion_anterior: 'Calle Principal 123, Quetzaltenango',
        fecha_ingreso: '2023-01-10',
        estado_salud: 'Estable con hipertensión controlada',
        medicamentos: 'Enalapril 10mg cada 12 horas',
        alergias: 'Penicilina',
        contacto_emergencia: 'María Pérez (Hija)',
        telefono_emergencia: '55512345',
        tipo_ingreso: 'particular'
      },
      {
        nombre: 'Rosa',
        apellido: 'Gutiérrez',
        fecha_nacimiento: '1940-11-22',
        direccion_anterior: 'Desconocida',
        fecha_ingreso: '2023-03-05',
        estado_salud: 'Requiere asistencia para movilidad',
        medicamentos: 'Metformina 500mg diario',
        alergias: 'Ninguna conocida',
        contacto_emergencia: null,
        telefono_emergencia: null,
        tipo_ingreso: 'hallazgo_calle'
      },
      {
        nombre: 'Carlos',
        apellido: 'Mendoza',
        fecha_nacimiento: '1938-07-30',
        direccion_anterior: 'Barrio San Antonio, Zona 4',
        fecha_ingreso: '2022-11-15',
        estado_salud: 'Enfermedad de Alzheimer en fase inicial',
        medicamentos: 'Donepezilo 5mg diario',
        alergias: 'Sulfas',
        contacto_emergencia: 'Roberto Mendoza (Sobrino)',
        telefono_emergencia: '77889900',
        tipo_ingreso: 'referido_pgn'
      }
    ];
    
    for (const residente of residentes) {
      const result = await client.query(
        `INSERT INTO ancianos (
          nombre, apellido, fecha_nacimiento, direccion_anterior, 
          fecha_ingreso, estado_salud, medicamentos, alergias,
          contacto_emergencia, telefono_emergencia, tipo_ingreso
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (nombre, apellido, fecha_nacimiento) DO NOTHING
        RETURNING id`,
        [
          residente.nombre,
          residente.apellido,
          residente.fecha_nacimiento,
          residente.direccion_anterior,
          residente.fecha_ingreso,
          residente.estado_salud,
          residente.medicamentos,
          residente.alergias,
          residente.contacto_emergencia,
          residente.telefono_emergencia,
          residente.tipo_ingreso
        ]
      );
      
      // Guardar el ID para usar en registros relacionados
      if (result.rows.length > 0) {
        residente.id = result.rows[0].id;
      }
    }
    
    console.log('Residentes creados exitosamente');
    
    // 3. Crear medicamentos de muestra
    console.log('Creando medicamentos de muestra...');
    
    const medicamentos = [
      { nombre: 'Paracetamol', descripcion: 'Analgésico y antipirético', stock: 100 },
      { nombre: 'Ibuprofeno', descripcion: 'Antiinflamatorio no esteroideo', stock: 80 },
      { nombre: 'Omeprazol', descripcion: 'Inhibidor de la bomba de protones', stock: 60 },
      { nombre: 'Loratadina', descripcion: 'Antihistamínico', stock: 50 },
      { nombre: 'Enalapril', descripcion: 'Antihipertensivo', stock: 70 },
      { nombre: 'Metformina', descripcion: 'Antidiabético', stock: 90 },
      { nombre: 'Atorvastatina', descripcion: 'Estatina para colesterol', stock: 45 },
      { nombre: 'Donepezilo', descripcion: 'Para Alzheimer', stock: 30 }
    ];
    
    // Verificar si existe la tabla medicamentos
    const tableCheck = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'medicamentos'
       )`
    );
    
    if (tableCheck.rows[0].exists) {
      // Si la tabla existe, insertar medicamentos
      for (const med of medicamentos) {
        await client.query(
          `INSERT INTO medicamentos (nombre, descripcion, stock)
           VALUES ($1, $2, $3)
           ON CONFLICT (nombre) DO NOTHING`,
          [med.nombre, med.descripcion, med.stock]
        );
      }
      console.log('Medicamentos creados exitosamente');
    } else {
      console.log('La tabla medicamentos no existe, se omite la creación de medicamentos');
    }
    
    // 4. Registrar algunos signos vitales para los residentes
    if (residentes[0].id) {
      console.log('Creando registros de signos vitales...');
      
      // Obtener ID del usuario enfermera
      const enfermeraResult = await client.query(
        `SELECT id FROM usuarios WHERE rol = 'enfermera' LIMIT 1`
      );
      
      if (enfermeraResult.rows.length > 0) {
        const enfermera_id = enfermeraResult.rows[0].id;
        
        // Fecha actual y fechas anteriores
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        const anteayer = new Date(hoy);
        anteayer.setDate(hoy.getDate() - 2);
        
        // Signos vitales para Juan Pérez
        const signosVitales = [
          {
            anciano_id: residentes[0].id,
            fecha_registro: anteayer,
            temperatura: 36.5,
            presion_arterial: '120/80',
            frecuencia_cardiaca: 72,
            saturacion_oxigeno: 96,
            usuario_id: enfermera_id
          },
          {
            anciano_id: residentes[0].id,
            fecha_registro: ayer,
            temperatura: 36.7,
            presion_arterial: '125/82',
            frecuencia_cardiaca: 75,
            saturacion_oxigeno: 97,
            usuario_id: enfermera_id
          },
          {
            anciano_id: residentes[0].id,
            fecha_registro: hoy,
            temperatura: 36.6,
            presion_arterial: '122/79',
            frecuencia_cardiaca: 73,
            saturacion_oxigeno: 98,
            usuario_id: enfermera_id
          }
        ];
        
        for (const signo of signosVitales) {
          await client.query(
            `INSERT INTO signos_vitales (
              anciano_id, fecha_registro, temperatura, presion_arterial, 
              frecuencia_cardiaca, saturacion_oxigeno, usuario_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              signo.anciano_id,
              signo.fecha_registro,
              signo.temperatura,
              signo.presion_arterial,
              signo.frecuencia_cardiaca,
              signo.saturacion_oxigeno,
              signo.usuario_id
            ]
          );
        }
        console.log('Signos vitales creados exitosamente');
      }
    }
    
    // 5. Crear algunas donaciones de muestra
    console.log('Creando donaciones de muestra...');
    
    // Obtener ID del usuario administrativo
    const adminResult = await client.query(
      `SELECT id FROM usuarios WHERE rol = 'administrativo' LIMIT 1`
    );
    
    if (adminResult.rows.length > 0) {
      const admin_id = adminResult.rows[0].id;
      
      const donaciones = [
        {
          fecha_donacion: new Date(),
          tipo_donacion: 'monetaria',
          monto: 1000,
          descripcion: 'Donación mensual',
          donante_nombre: 'Empresa ABC',
          donante_nit: '12345678',
          donante_direccion: 'Zona 10, Ciudad de Guatemala',
          usuario_registro_id: admin_id
        },
        {
          fecha_donacion: new Date(),
          tipo_donacion: 'especie',
          descripcion: 'Ropa y alimentos',
          donante_nombre: 'Juan Donante',
          usuario_registro_id: admin_id
        }
      ];
      
      for (const donacion of donaciones) {
        await client.query(
          `INSERT INTO donaciones (
            fecha_donacion, tipo_donacion, monto, descripcion, 
            donante_nombre, donante_nit, donante_direccion, 
            recibo_generado, usuario_registro_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            donacion.fecha_donacion,
            donacion.tipo_donacion,
            donacion.monto || null,
            donacion.descripcion,
            donacion.donante_nombre,
            donacion.donante_nit || null,
            donacion.donante_direccion || null,
            false,
            donacion.usuario_registro_id
          ]
        );
      }
      console.log('Donaciones creadas exitosamente');
    }
    
    await client.query('COMMIT');
    console.log('Población de la base de datos completada exitosamente!');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error al poblar la base de datos:', e);
    throw e;
  } finally {
    client.release();
  }
}

// Ejecutar la función
seedDatabase()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  });