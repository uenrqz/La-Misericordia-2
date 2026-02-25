#!/bin/bash
# Script de inicio para el backend en Railway

# Cargar variables de entorno específicas para Railway
if [ -f .env.railway ]; then
  set -o allexport
  source .env.railway
  set +o allexport
  echo "Variables de entorno cargadas desde .env.railway"
fi

# Aplicar migraciones de base de datos
echo "Verificando migraciones de base de datos..."
npm run migrate || echo "No se pudieron aplicar migraciones"

# Iniciar el backend
echo "Iniciando el servidor backend..."
exec npm run railway
