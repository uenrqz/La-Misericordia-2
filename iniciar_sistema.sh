#!/bin/bash
# Script para iniciar la aplicación La Misericordia 2 y verificar su funcionamiento

echo "==================================================="
echo "   Iniciando sistema LA MISERICORDIA 2"
echo "   Verificador de mejoras de estabilidad"
echo "==================================================="

# Función para verificar si un proceso está en ejecución
check_process() {
  if pgrep -f "$1" > /dev/null; then
    return 0  # Proceso encontrado
  else
    return 1  # Proceso no encontrado
  fi
}

# Verificar si el sistema ya está en ejecución
if check_process "hogar-ancianos-bff"; then
  echo "⚠️  El BFF ya parece estar en ejecución."
fi

# Directorio actual
BASEDIR=$(pwd)
FRONTEND_DIR="$BASEDIR/hogar-ancianos-frontend"
BFF_DIR="$BASEDIR/hogar-ancianos-bff"
BACKEND_DIR="$BASEDIR/hogar-ancianos-backend"

echo ""
echo "📋 Verificando componentes del sistema..."

# Verificar que existan los directorios necesarios
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "❌ Error: No se encuentra el directorio del frontend"
  exit 1
fi

if [ ! -d "$BFF_DIR" ]; then
  echo "❌ Error: No se encuentra el directorio del BFF"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ Error: No se encuentra el directorio del backend"
  exit 1
fi

echo "✅ Estructura de directorios correcta"

# Verificar los archivos package.json
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "❌ Error: No se encuentra el archivo package.json en el frontend"
  exit 1
fi

if [ ! -f "$BFF_DIR/package.json" ]; then
  echo "❌ Error: No se encuentra el archivo package.json en el BFF"
  exit 1
fi

if [ ! -f "$BACKEND_DIR/package.json" ]; then
  echo "❌ Error: No se encuentra el archivo package.json en el backend"
  exit 1
fi

echo "✅ Archivos package.json verificados"

# Verificar las mejoras implementadas
echo ""
echo "🔍 Verificando implementación de mejoras..."

if [ ! -f "$FRONTEND_DIR/src/utils/errorHandler.js" ]; then
  echo "❌ Error: No se encuentra el manejador de errores"
  exit 1
fi

if [ ! -f "$FRONTEND_DIR/src/components/ui/SystemNotification.jsx" ]; then
  echo "❌ Error: No se encuentra el componente de notificaciones"
  exit 1
fi

if [ ! -f "$FRONTEND_DIR/src/contexts/SystemContext.jsx" ]; then
  echo "❌ Error: No se encuentra el contexto del sistema"
  exit 1
fi

echo "✅ Mejoras implementadas correctamente"

# Preguntar si se quiere iniciar la aplicación
echo ""
echo "🚀 ¿Desea iniciar la aplicación? (s/n)"
read -r start_app

if [ "$start_app" != "s" ] && [ "$start_app" != "S" ]; then
  echo "Operación cancelada por el usuario"
  exit 0
fi

# Iniciar backend (en una nueva terminal) con configuración de producción
echo ""
echo "🔄 Iniciando backend en modo producción..."
osascript -e "tell application \"Terminal\" to do script \"cd $BACKEND_DIR && NODE_ENV=production npm start\""
echo "✅ Proceso de backend iniciado"

# Esperar unos segundos
sleep 3

# Iniciar BFF (en una nueva terminal) con configuración de producción
echo ""
echo "🔄 Iniciando BFF en modo producción..."
osascript -e "tell application \"Terminal\" to do script \"cd $BFF_DIR && NODE_ENV=production npm start\""
echo "✅ Proceso de BFF iniciado"

# Esperar unos segundos
sleep 3

# Iniciar frontend (en una nueva terminal)
echo ""
echo "🔄 Iniciando frontend..."
osascript -e "tell application \"Terminal\" to do script \"cd $FRONTEND_DIR && npm run dev\""
echo "✅ Proceso de frontend iniciado"

# Mostrar información final
echo ""
echo "==================================================="
echo "   Sistema LA MISERICORDIA 2 iniciado"
echo "==================================================="
echo ""
echo "ℹ️  URLs disponibles:"
echo "   - Frontend: http://localhost:5174"
echo "   - BFF: http://localhost:4000/api/bff/status"
echo ""
echo "ℹ️  Credenciales de acceso:"
echo "   - Usuario administrador: admin"
echo "   - Contraseña: Admin2025!"
echo ""
echo "==================================================="
