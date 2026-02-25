#!/bin/bash

# Colores para la salida
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}==============================================================${RESET}"
echo -e "${GREEN}          PREPARACIÓN DEL PROYECTO PARA RAILWAY           ${RESET}"
echo -e "${BLUE}==============================================================${RESET}"

# Verificar si estamos en la carpeta raíz del proyecto
if [ ! -d "hogar-ancianos-backend" ] || [ ! -d "hogar-ancianos-bff" ] || [ ! -d "hogar-ancianos-frontend" ]; then
    echo -e "${RED}[ERROR]${RESET} Este script debe ejecutarse desde la carpeta raíz del proyecto."
    exit 1
fi

# 1. Preparación del backend
echo -e "${YELLOW}[1/3]${RESET} Preparando el Backend para Railway..."
cd hogar-ancianos-backend

# Crear archivo .env.railway para Railway
cat > .env.railway << EOL
DB_HOST=\${PGHOST}
DB_PORT=\${PGPORT}
DB_USER=\${PGUSER}
DB_PASSWORD=\${PGPASSWORD}
DB_NAME=\${PGDATABASE}
DB_SSL=true
NODE_ENV=production
PORT=\${PORT}
CORS_ORIGIN=*
JWT_SECRET=hogar_misericordia_jwt_secret_2025
EOL

# Actualizar package.json para incluir script de inicio Railway
echo -e "${CYAN}Actualizando package.json del Backend...${RESET}"
TMP_FILE=$(mktemp)
jq '.scripts.start = "node app.js" | .scripts.railway = "NODE_ENV=production node app.js"' package.json > "$TMP_FILE" && mv "$TMP_FILE" package.json

cd ..

# 2. Preparación del BFF
echo -e "${YELLOW}[2/3]${RESET} Preparando el BFF para Railway..."
cd hogar-ancianos-bff

# Crear archivo .env.railway para Railway
cat > .env.railway << EOL
PORT=\${PORT}
API_URL=\${BACKEND_URL}
NODE_ENV=production
API_TIMEOUT=30000
EOL

# Actualizar package.json para incluir script de inicio Railway
echo -e "${CYAN}Actualizando package.json del BFF...${RESET}"
TMP_FILE=$(mktemp)
jq '.scripts.railway = "NODE_ENV=production node src/index.js"' package.json > "$TMP_FILE" && mv "$TMP_FILE" package.json

cd ..

# 3. Preparación del Frontend
echo -e "${YELLOW}[3/3]${RESET} Preparando el Frontend para Railway..."
cd hogar-ancianos-frontend

# Crear archivo .env.railway para Railway
cat > .env.railway << EOL
VITE_API_URL=\${BFF_URL}
VITE_NODE_ENV=production
EOL

# Actualizar package.json para incluir script de construcción optimizada
echo -e "${CYAN}Actualizando package.json del Frontend...${RESET}"
TMP_FILE=$(mktemp)
jq '.scripts.railway = "vite build && node server.js"' package.json > "$TMP_FILE" && mv "$TMP_FILE" package.json

# Crear un simple servidor para el frontend
cat > server.js << EOL
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar compresión
app.use(compression());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar cualquier solicitud que no coincida con un archivo estático
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Frontend corriendo en el puerto \${PORT}\`);
});
EOL

# Asegurarse de que las dependencias de Express estén instaladas
echo -e "${CYAN}Instalando dependencias para el servidor del Frontend...${RESET}"
npm install --save express compression

cd ..

echo -e "${BLUE}==============================================================${RESET}"
echo -e "${GREEN}          PREPARACIÓN COMPLETADA CON ÉXITO                ${RESET}"
echo -e "${BLUE}==============================================================${RESET}"
echo -e "${YELLOW}[SIGUIENTE PASO]${RESET} Para desplegar en Railway:"
echo -e "1. Conecta tus repositorios a Railway"
echo -e "2. Configura las variables de entorno según los archivos .env.railway"
echo -e "3. Para la base de datos, puedes usar el plugin de PostgreSQL de Railway"
echo -e "4. Configura los dominios personalizados si es necesario"
echo -e "${BLUE}==============================================================${RESET}"
