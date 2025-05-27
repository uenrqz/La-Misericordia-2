const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determinar el entorno
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('Sistema en modo PRODUCCIÓN - Usando PostgreSQL');
} else {
  console.log('Sistema en modo DESARROLLO - Usando PostgreSQL con Docker');
}

// Configuración de la base de datos
const sequelizeConfig = isProduction ? {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hogar_ancianos_prod',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
} : {
  host: 'localhost',
  port: 5432,
  database: 'hogar_db',
  username: 'hogar_user',
  password: 'securepass',
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = new Sequelize(sequelizeConfig);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};