const { Sequelize } = require('sequelize');
require('dotenv').config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isDevelopment = process.env.NODE_ENV === 'development' && !hasDatabaseUrl;

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
  try {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL no está definida');
    }

    const parsedDbUrl = new URL(dbUrl);
    const isInternalRenderHost = !parsedDbUrl.hostname.includes('.');
    if (parsedDbUrl.hostname.startsWith('dpg-') && !parsedDbUrl.hostname.includes('.')) {
      parsedDbUrl.hostname = `${parsedDbUrl.hostname}.oregon-postgres.render.com`;
    }
    dbUrl = parsedDbUrl.toString();
    const dialectOptions = isInternalRenderHost
      ? {}
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        };

    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectOptions,
      logging: false,
    });
  } catch (error) {
    console.error('❌ [database.js] Error al crear Sequelize:', error.message);
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
    throw error;
  }
};

module.exports = { sequelize, testConnection };
