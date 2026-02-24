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
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // CRUCIAL para Render
      }
    },
    logging: false,
  });
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

