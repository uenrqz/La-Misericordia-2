const { Sequelize } = require('sequelize');
require('dotenv').config();

const isDevelopment = process.env.NODE_ENV === 'development';

let sequelize;

if (isDevelopment) {
  // Configuración para desarrollo local
  sequelize = new Sequelize(
    process.env.DB_NAME || 'hogar_db',
    process.env.DB_USER || 'hogar_user',
    process.env.DB_PASSWORD || 'securepass',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
} else {
  // Configuración para producción (Render)
  console.log('🔍 [database.js] ===== INICIANDO CONFIGURACIÓN DE PRODUCCIÓN =====');
  console.log('🔍 [database.js] NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 [database.js] DATABASE_URL existe?', process.env.DATABASE_URL ? 'SÍ' : 'NO');
  
  if (process.env.DATABASE_URL) {
    console.log('🔍 [database.js] DATABASE_URL tipo:', typeof process.env.DATABASE_URL);
    console.log('🔍 [database.js] DATABASE_URL length:', process.env.DATABASE_URL.length);
    console.log('🔍 [database.js] DATABASE_URL (primeros 30 chars):', 
      process.env.DATABASE_URL.substring(0, 30) + '...');
    console.log('🔍 [database.js] DATABASE_URL contiene "postgresql"?', 
      process.env.DATABASE_URL.includes('postgresql') ? 'SÍ' : 'NO');
  } else {
    console.error('❌ [database.js] ¡DATABASE_URL NO ESTÁ DEFINIDA!');
    console.log('🔍 [database.js] Todas las variables de entorno disponibles:');
    console.log('🔍 [database.js] Keys:', Object.keys(process.env));
    
    const possibleDbVars = Object.keys(process.env).filter(key => 
      key.toLowerCase().includes('db') || 
      key.toLowerCase().includes('database') || 
      key.toLowerCase().includes('postgres')
    );
    console.log('🔍 [database.js] Posibles variables de DB encontradas:', possibleDbVars);
    
    possibleDbVars.forEach(key => {
      const val = process.env[key];
      if (val && val.length > 0) {
        console.log(`🔍 [database.js] ${key}: ${val.substring(0, 15)}... (${val.length} chars)`);
      }
    });
  }
  
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL no está definida');
    }
    
    console.log('🔍 [database.js] Intentando crear Sequelize con DATABASE_URL...');
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
    });
    console.log('✅ [database.js] Sequelize creado exitosamente');
  } catch (error) {
    console.error('❌ [database.js] Error al crear Sequelize:', error.message);
    console.error('❌ [database.js] Stack:', error.stack);
    throw error;
  }
}

// Función para probar conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Sequelize establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Sequelize:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
