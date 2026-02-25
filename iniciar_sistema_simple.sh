#!/bin/bash
# ============================================================================
# SCRIPT SIMPLIFICADO PARA INICIAR EL SISTEMA LA MISERICORDIA 2
# ============================================================================
# Este script inicia automáticamente los componentes esenciales del sistema:
#  - PostgreSQL: Base de datos
#  - Backend (Node.js): API REST
#  - BFF (Backend for Frontend): Capa intermedia
#  - Frontend (React): Interfaz de usuario web
#
# También crea/actualiza el usuario administrador "Ulises"
# ============================================================================

# Colores para la salida
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"
BOLD="\033[1m"

# Configuración de directorios y puertos
ROOT_DIR="$(pwd)"
BACKEND_DIR="${ROOT_DIR}/hogar-ancianos-backend"
BFF_DIR="${ROOT_DIR}/hogar-ancianos-bff"
FRONTEND_DIR="${ROOT_DIR}/hogar-ancianos-frontend"
LOGS_DIR="${ROOT_DIR}/logs"

BACKEND_PORT=3000
BFF_PORT=4000
FRONTEND_PORT=5174
DB_PORT=5432

# Crear directorio de logs si no existe
mkdir -p $LOGS_DIR

# Función para verificar si un puerto está en uso
verificar_puerto() {
  local port=$1
  if lsof -i :$port -sTCP:LISTEN &>/dev/null; then
    echo -e "${YELLOW}[INFO]${RESET} Puerto $port está en uso"
    return 0  # Puerto en uso
  else
    echo -e "${CYAN}[INFO]${RESET} Puerto $port está disponible"
    return 1  # Puerto libre
  fi
}

# Función para liberar un puerto matando el proceso que lo está usando
liberar_puerto() {
  local puerto=$1
  local servicio=$2
  
  echo -e "${YELLOW}[INFO]${RESET} Intentando liberar puerto $puerto para $servicio..."
  
  # Obtener el PID del proceso usando el puerto
  local pids=$(lsof -i :$puerto -sTCP:LISTEN -t 2>/dev/null)
  
  if [ -z "$pids" ]; then
    echo -e "${YELLOW}[AVISO]${RESET} No se encontró proceso usando el puerto $puerto"
    return 0  # No hay proceso, consideramos que está liberado
  fi
  
  for pid in $pids; do
    if [ -n "$pid" ]; then
      echo -e "${YELLOW}[INFO]${RESET} Deteniendo proceso con PID $pid que usa el puerto $puerto..."
      kill -15 $pid 2>/dev/null
      sleep 1
      
      # Verificar si el proceso sigue ejecutándose
      if ps -p $pid > /dev/null 2>&1; then
        echo -e "${YELLOW}[AVISO]${RESET} El proceso $pid no respondió, usando kill -9..."
        kill -9 $pid 2>/dev/null
        sleep 1
      fi
    fi
  done
  
  # Verificar que el puerto esté realmente liberado
  if verificar_puerto $puerto; then
    echo -e "${RED}[ERROR]${RESET} El puerto $puerto sigue en uso después de intentar liberarlo"
    return 1
  else
    echo -e "${GREEN}[ÉXITO]${RESET} Puerto $puerto liberado exitosamente"
    return 0
  fi
}

# Mostrar encabezado
clear
echo -e "${BLUE}=============================================================${RESET}"
echo -e "${GREEN}${BOLD}      INICIANDO SISTEMA LA MISERICORDIA 2       ${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e " ${YELLOW}Fecha:${RESET} $(date '+%d-%m-%Y %H:%M:%S')"
echo -e " ${YELLOW}Usuario:${RESET} $(whoami)"
echo -e "${BLUE}=============================================================${RESET}"

# 1. Iniciar PostgreSQL
echo -e "\n${CYAN}[1/5]${RESET} Iniciando PostgreSQL..."
if brew services list | grep -q "postgresql.*started"; then
  echo -e "${GREEN}[OK]${RESET} PostgreSQL ya está en ejecución"
else
  brew services start postgresql
  sleep 3
  if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}[OK]${RESET} PostgreSQL iniciado correctamente"
  else
    echo -e "${RED}[ERROR]${RESET} No se pudo iniciar PostgreSQL. Verifique la instalación"
    exit 1
  fi
fi

# 2. Verificar y liberar puertos si es necesario
echo -e "\n${CYAN}[2/5]${RESET} Verificando puertos necesarios..."

for puerto in $BACKEND_PORT $BFF_PORT $FRONTEND_PORT; do
  if verificar_puerto $puerto; then
    echo -e "${YELLOW}[AVISO]${RESET} Liberando puerto $puerto..."
    liberar_puerto $puerto "Servicio en puerto $puerto"
  fi
done

# 3. Crear/actualizar usuarios administradores
echo -e "\n${CYAN}[3/5]${RESET} Creando/actualizando usuario administrador..."

cd $BACKEND_DIR
echo -e "${YELLOW}[INFO]${RESET} Ejecutando script de creación de usuarios..."
node ./scripts/crear_usuarios_admin.js

# 4. Iniciar Backend
echo -e "\n${CYAN}[4/5]${RESET} Iniciando Backend (Puerto $BACKEND_PORT)..."

cd $BACKEND_DIR
echo -e "${YELLOW}[INFO]${RESET} Instalando dependencias del Backend..."
npm install --quiet

echo -e "${YELLOW}[INFO]${RESET} Iniciando servidor Backend..."
NODE_ENV=production npm start > $LOGS_DIR/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null && verificar_puerto $BACKEND_PORT; then
  echo -e "${GREEN}[OK]${RESET} Backend iniciado correctamente (PID: $BACKEND_PID)"
else
  echo -e "${RED}[ERROR]${RESET} Error al iniciar el Backend. Revise los logs en $LOGS_DIR/backend.log"
  exit 1
fi

# 5. Iniciar BFF
echo -e "\n${CYAN}[4/5]${RESET} Iniciando BFF (Puerto $BFF_PORT)..."

cd $BFF_DIR
echo -e "${YELLOW}[INFO]${RESET} Instalando dependencias del BFF..."
npm install --quiet

echo -e "${YELLOW}[INFO]${RESET} Iniciando servidor BFF..."
NODE_ENV=production npm start > $LOGS_DIR/bff.log 2>&1 &
BFF_PID=$!
sleep 3

if ps -p $BFF_PID > /dev/null && verificar_puerto $BFF_PORT; then
  echo -e "${GREEN}[OK]${RESET} BFF iniciado correctamente (PID: $BFF_PID)"
else
  echo -e "${RED}[ERROR]${RESET} Error al iniciar el BFF. Revise los logs en $LOGS_DIR/bff.log"
  exit 1
fi

# 6. Iniciar Frontend
echo -e "\n${CYAN}[5/5]${RESET} Iniciando Frontend (Puerto $FRONTEND_PORT)..."

cd $FRONTEND_DIR
echo -e "${YELLOW}[INFO]${RESET} Instalando dependencias del Frontend..."
npm install --quiet

echo -e "${YELLOW}[INFO]${RESET} Iniciando aplicación Frontend..."
npm run dev -- --host > $LOGS_DIR/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5

if ps -p $FRONTEND_PID > /dev/null && verificar_puerto $FRONTEND_PORT; then
  echo -e "${GREEN}[OK]${RESET} Frontend iniciado correctamente (PID: $FRONTEND_PID)"
else
  echo -e "${RED}[ERROR]${RESET} Error al iniciar el Frontend. Revise los logs en $LOGS_DIR/frontend.log"
  exit 1
fi

# Resumen de servicios
echo -e "\n${GREEN}${BOLD}¡SISTEMA LA MISERICORDIA 2 INICIADO CORRECTAMENTE!${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "${CYAN}Resumen de servicios iniciados:${RESET}"
echo -e " - ${YELLOW}PostgreSQL:${RESET} En ejecución (Puerto $DB_PORT)"
echo -e " - ${YELLOW}Backend:${RESET} En ejecución (PID: $BACKEND_PID, Puerto $BACKEND_PORT)"
echo -e " - ${YELLOW}BFF:${RESET} En ejecución (PID: $BFF_PID, Puerto $BFF_PORT)"
echo -e " - ${YELLOW}Frontend:${RESET} En ejecución (PID: $FRONTEND_PID, Puerto $FRONTEND_PORT)"
echo -e "${BLUE}=============================================================${RESET}"

echo -e "\n${YELLOW}Acceso al sistema:${RESET}"
echo -e " URL de acceso: ${GREEN}http://localhost:$FRONTEND_PORT${RESET}"
echo -e " Credenciales de administrador:"
echo -e "   - Usuario: ${CYAN}admin${RESET} o ${CYAN}u.enrqz${RESET}"
echo -e "   - Contraseña: ${CYAN}Admin2025!${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "\n${YELLOW}NOTA: Para detener el sistema ejecute: ./detener_sistema.sh${RESET}\n"
