#!/bin/bash
# Script para iniciar el sistema LA MISERICORDIA 2 directamente en modo producción
# Fecha: 23 de mayo de 2025
# Uso: ./iniciar_produccion.sh

echo "=============================================================="
echo "    Iniciando Sistema LA MISERICORDIA 2 - MODO PRODUCCIÓN"
echo "=============================================================="

# Establecer variables de entorno para producción
export NODE_ENV=production

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
  echo "[ERROR] Docker no está ejecutándose. Por favor, inicie Docker y vuelva a intentarlo."
  exit 1
fi

# Iniciar PostgreSQL con Docker si no está en ejecución
if ! docker ps | grep -q "postgres"; then
  echo "[INFO] Iniciando contenedor de PostgreSQL..."
  cd "$(dirname "$0")/hogar-ancianos-backend" && docker-compose up -d
  echo "[INFO] Esperando a que PostgreSQL esté listo (10 segundos)..."
  sleep 10
fi

# Ejecutar el script de inicio del sistema
echo "[INFO] Iniciando el sistema completo..."
node "$(dirname "$0")/iniciar-sistema.js"
