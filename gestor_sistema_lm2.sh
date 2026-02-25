#!/bin/bash
# ============================================================================
# GESTOR DEL SISTEMA LA MISERICORDIA 2 (Versión mejorada)
# ============================================================================
# Este script permite gestionar todos los componentes del sistema:
#  - PostgreSQL: Base de datos (usando instalación local de Homebrew)
#  - Backend (Node.js): API REST para el acceso a datos
#  - BFF (Backend for Frontend): Capa intermedia entre frontend y backend
#  - Frontend (React): Interfaz de usuario web
#
# PARÁMETROS:
# - Sin parámetros: Inicia el menú interactivo de gestión
# - --start-produccion: Inicia todo el sistema en modo producción automáticamente
# - --stop: Detiene todos los servicios del sistema
#
# EJEMPLOS DE USO:
# ./gestor_sistema_lm2.sh                  # Inicia el menú interactivo
# ./gestor_sistema_lm2.sh --start-produccion # Inicia todo en producción sin preguntas
# ./gestor_sistema_lm2.sh --stop           # Detiene todos los servicios
#
# REQUISITOS:
# - macOS con Homebrew instalado
# - PostgreSQL instalado via Homebrew
# - Node.js y npm instalados
# 
# ACTUALIZADO: 3 de Junio 2025 - Versión mejorada según especificaciones
# ============================================================================

# Colores para la salida
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
CYAN="\033[0;36m"
PURPLE="\033[0;35m"
BOLD="\033[1m"
RESET="\033[0m"

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

DB_USER="hogar_user"
DB_PASSWORD="securepass"
DB_NAME="hogar_db"

# Crear directorio de logs si no existe
mkdir -p $LOGS_DIR

# Función para mostrar el banner
show_banner() {
  clear
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e "${GREEN}${BOLD}      SISTEMA LA MISERICORDIA 2 - GESTOR UNIFICADO      ${RESET}"
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e " ${YELLOW}Fecha:${RESET} $(date '+%d-%m-%Y %H:%M:%S')"
  echo -e " ${YELLOW}Entorno:${RESET} $([ "$NODE_ENV" == "production" ] && echo "${GREEN}PRODUCCIÓN${RESET}" || echo "${CYAN}DESARROLLO${RESET}")"
  echo -e "${BLUE}=============================================================${RESET}"
}

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
      
      # Obtener nombre del proceso
      local proceso=$(ps -p $pid -o comm= 2>/dev/null || echo "desconocido")
      echo -e "${YELLOW}[INFO]${RESET} Proceso: $proceso (PID: $pid)"
      
      # Enviar señal SIGTERM para detener el proceso de forma controlada
      kill -15 $pid 2>/dev/null
      
      # Esperar un momento para que el proceso termine
      sleep 1
      
      # Verificar si el proceso sigue ejecutándose
      if ps -p $pid > /dev/null 2>&1; then
        # Si sigue vivo, intentar con SIGKILL
        echo -e "${YELLOW}[AVISO]${RESET} El proceso $pid no respondió, usando kill -9..."
        kill -9 $pid 2>/dev/null
        sleep 1
      fi
      
      # Verificar si se liberó el proceso
      if ! ps -p $pid > /dev/null 2>&1; then
        echo -e "${GREEN}[ÉXITO]${RESET} Proceso $pid terminado correctamente"
      else
        echo -e "${RED}[ERROR]${RESET} No se pudo terminar el proceso $pid"
        return 1
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

# Función para verificar si un servicio está corriendo
verificar_servicio() {
  local servicio=$1
  local puerto=$2
  
  if verificar_puerto $puerto; then
    local pid=$(lsof -i:$puerto -sTCP:LISTEN -t)
    local proceso=$(ps -p $pid -o comm= 2>/dev/null || echo "desconocido")
    echo -e "${GREEN}[ACTIVO]${RESET} en puerto $puerto (PID: $pid - $proceso)"
    return 0
  else
    echo -e "${RED}[INACTIVO]${RESET}"
    return 1
  fi
}

# Función para verificar PostgreSQL
verificar_postgres() {
  echo -e "${CYAN}[INFO]${RESET} Verificando PostgreSQL..."
  
  # Verificar si el servicio está corriendo
  if ! brew services list | grep -q "postgresql.*started"; then
    echo -e "${RED}[ERROR]${RESET} Servicio PostgreSQL no está iniciado"
    return 1
  fi
  
  # Verificar si está respondiendo en el puerto
  if ! pg_isready -h localhost -p $DB_PORT -t 2 &>/dev/null; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está respondiendo en puerto $DB_PORT"
    return 1
  fi
  
  # Verificar si podemos conectar con el usuario específico
  if ! pg_isready -h localhost -p $DB_PORT -U $DB_USER -t 2 &>/dev/null; then
    echo -e "${YELLOW}[AVISO]${RESET} PostgreSQL está activo pero no se puede conectar con el usuario '$DB_USER'"
    return 2
  fi
  
  # Verificar si existe la base de datos
  if ! psql -U $DB_USER -d postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}[AVISO]${RESET} La base de datos '$DB_NAME' no existe."
    return 3
  fi
  
  # Verificar si podemos conectarnos a la base de datos específica
  if ! pg_isready -h localhost -p $DB_PORT -U $DB_USER -d $DB_NAME -t 2 &>/dev/null; then
    echo -e "${YELLOW}[AVISO]${RESET} No se puede conectar a la base de datos '$DB_NAME'"
    return 4
  fi
  
  echo -e "${GREEN}[OK]${RESET} PostgreSQL está activo y funcionando correctamente en puerto $DB_PORT"
  echo -e "      └── Base de datos: ${CYAN}$DB_NAME${RESET}, Usuario: ${CYAN}$DB_USER${RESET}"
  return 0
}

# Función para iniciar PostgreSQL
iniciar_postgres() {
  echo -e "\n${CYAN}[PostgreSQL]${RESET} Iniciando servicio..."
  
  # Verificar si PostgreSQL está instalado
  if ! command -v postgres &> /dev/null; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está instalado. Instale con Homebrew primero:"
    echo -e "${YELLOW}brew install postgresql${RESET}"
    return 1
  fi
  
  # Verificar si ya está en ejecución
  if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}[OK]${RESET} PostgreSQL ya está en ejecución"
  else
    echo -e "${YELLOW}[INFO]${RESET} Iniciando PostgreSQL con Homebrew..."
    brew services start postgresql
    
    # Esperar a que PostgreSQL inicie
    echo -e "${YELLOW}[INFO]${RESET} Esperando a que PostgreSQL esté listo..."
    for ((i=1; i<=10; i++)); do
      echo -ne "${YELLOW}[ESPERA]${RESET} Intento $i/10\r"
      if pg_isready -h localhost -p $DB_PORT -t 1 &>/dev/null; then
        echo -e "\n${GREEN}[OK]${RESET} PostgreSQL iniciado correctamente"
        sleep 1
        break
      fi
      
      if [ $i -eq 10 ]; then
        echo -e "\n${RED}[ERROR]${RESET} PostgreSQL no pudo iniciarse a tiempo"
        echo -e "${YELLOW}[DIAGNÓSTICO]${RESET} Estado actual de PostgreSQL:"
        brew services list | grep postgresql
        return 1
      fi
      
      sleep 2
    done
  fi
  
  # Verificar conexión a PostgreSQL general (no a una base de datos específica)
  if ! pg_isready -h localhost -p $DB_PORT -t 2 &>/dev/null; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está respondiendo. Verificando estado..."
    brew services list | grep postgresql
    
    echo -e "${YELLOW}[INFO]${RESET} Intentando reiniciar PostgreSQL..."
    brew services restart postgresql
    sleep 5
    
    if ! pg_isready -h localhost -p $DB_PORT -t 2 &>/dev/null; then
      echo -e "${RED}[ERROR]${RESET} No se pudo reiniciar PostgreSQL"
      return 1
    fi
  fi
  
  # Verificar usuario
  local puede_conectar=false
  if psql -U $(whoami) -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' ya existe"
    puede_conectar=true
  else
    echo -e "${YELLOW}[INFO]${RESET} Creando usuario '$DB_USER'..."
    if createuser -d $DB_USER 2>/dev/null; then
      echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' creado exitosamente"
      puede_conectar=true
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo crear el usuario '$DB_USER'"
      echo -e "${YELLOW}[INFO]${RESET} Intentando con psql directamente..."
      
      if psql -U $(whoami) -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN CREATEDB PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
        echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' creado exitosamente con psql"
        puede_conectar=true
      else
        echo -e "${RED}[ERROR]${RESET} No se pudo crear el usuario '$DB_USER'"
        return 1
      fi
    fi
  fi
  
  # Establecer contraseña para el usuario
  if $puede_conectar; then
    echo -e "${YELLOW}[INFO]${RESET} Estableciendo contraseña para el usuario..."
    if psql -U $(whoami) -d postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
      echo -e "${GREEN}[OK]${RESET} Contraseña establecida correctamente"
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo establecer la contraseña"
      return 1
    fi
  fi

  # Verificar si existe la base de datos
  if psql -U $(whoami) -d postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}[OK]${RESET} Base de datos '$DB_NAME' ya existe"
  else
    echo -e "${YELLOW}[INFO]${RESET} Creando base de datos '$DB_NAME'..."
    if createdb -U $(whoami) -O $DB_USER $DB_NAME 2>/dev/null; then
      echo -e "${GREEN}[OK]${RESET} Base de datos '$DB_NAME' creada exitosamente"
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo crear la base de datos. Intentando con psql..."
      if psql -U $(whoami) -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
        echo -e "${GREEN}[OK]${RESET} Base de datos '$DB_NAME' creada exitosamente con psql"
      else
        echo -e "${RED}[ERROR]${RESET} No se pudo crear la base de datos '$DB_NAME'"
        return 1
      fi
    fi
  fi
  
  echo -e "${GREEN}[OK]${RESET} PostgreSQL está listo para usar"
  
  # Aplicar esquema inicial si es necesario
  if [ -f "${BACKEND_DIR}/scripts/init_db.sql" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Aplicando esquema inicial de la base de datos..."
    if psql -U $DB_USER -d $DB_NAME -f "${BACKEND_DIR}/scripts/init_db.sql" 2>/dev/null; then
      echo -e "${GREEN}[OK]${RESET} Esquema aplicado correctamente"
    else
      echo -e "${YELLOW}[AVISO]${RESET} Hubo errores al aplicar el esquema. Esto puede ser normal si las tablas ya existen."
    fi
  fi
  
  return 0
}

# Función para detener PostgreSQL
detener_postgres() {
  echo -e "\n${CYAN}[PostgreSQL]${RESET} Deteniendo servicio..."
  brew services stop postgresql
  sleep 2
  
  if brew services list | grep -q "postgresql.*started"; then
    echo -e "${RED}[ERROR]${RESET} No se pudo detener PostgreSQL."
    return 1
  else
    echo -e "${GREEN}[OK]${RESET} PostgreSQL detenido correctamente."
    return 0
  fi
}

# Función para configurar PostgreSQL
setup_postgres() {
  echo -e "\n${CYAN}[PostgreSQL]${RESET} Configurando PostgreSQL local..."
  
  # Asegurarse que PostgreSQL está instalado
  if ! command -v postgres &> /dev/null; then
    echo -e "${YELLOW}[INFO]${RESET} PostgreSQL no está instalado. Instalando con Homebrew..."
    brew install postgresql@14
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} Falló la instalación de PostgreSQL."
      return 1
    fi
  fi
  
  # Iniciar servicio
  brew services start postgresql
  echo -e "${YELLOW}[INFO]${RESET} Esperando a que PostgreSQL esté listo..."
  sleep 5
  
  # Crear usuario si no existe
  echo -e "${YELLOW}[INFO]${RESET} Verificando usuario de base de datos..."
  if ! psql -U $(whoami) -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
    echo -e "${YELLOW}[INFO]${RESET} Creando usuario '$DB_USER'..."
    psql -U $(whoami) -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN CREATEDB PASSWORD '$DB_PASSWORD';" 2>/dev/null
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} No se pudo crear el usuario. Intentando con createuser..."
      createuser -d $DB_USER
    fi
  else
    echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' ya existe."
  fi
  
  # Establecer contraseña para el usuario
  echo -e "${YELLOW}[INFO]${RESET} Estableciendo contraseña para el usuario..."
  psql -U $(whoami) -d postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null
  
  # Crear base de datos si no existe
  echo -e "${YELLOW}[INFO]${RESET} Verificando base de datos..."
  if ! psql -U $(whoami) -d postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}[INFO]${RESET} Creando base de datos '$DB_NAME'..."
    createdb -U $(whoami) -O $DB_USER $DB_NAME 2>/dev/null
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} No se pudo crear la base de datos. Intentando con psql..."
      psql -U $(whoami) -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    fi
  else
    echo -e "${GREEN}[OK]${RESET} Base de datos '$DB_NAME' ya existe."
  fi
  
  # Aplicar esquema inicial
  echo -e "${YELLOW}[INFO]${RESET} Aplicando esquema inicial de la base de datos..."
  if [ -f "${BACKEND_DIR}/scripts/init_db.sql" ]; then
    psql -U $DB_USER -d $DB_NAME -f "${BACKEND_DIR}/scripts/init_db.sql" 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}[OK]${RESET} Esquema aplicado correctamente."
    else
      echo -e "${YELLOW}[AVISO]${RESET} Hubo errores al aplicar el esquema. Esto puede ser normal si las tablas ya existen."
    fi
  else
    echo -e "${RED}[ERROR]${RESET} No se encontró el archivo de esquema inicial."
  fi
  
  # Crear usuario administrador
  echo -e "${YELLOW}[INFO]${RESET} Verificando/creando usuario administrador..."
  if [ -f "${BACKEND_DIR}/scripts/crear_usuarios_admin.js" ]; then
    cd ${BACKEND_DIR}
    node ./scripts/crear_usuarios_admin.js
    cd ${ROOT_DIR}
  else
    echo -e "${RED}[ERROR]${RESET} No se encontró el script para crear usuarios administradores."
    # Insertar usuario admin manualmente
    echo -e "${YELLOW}[INFO]${RESET} Intentando crear usuario administrador manualmente..."
    psql -U $DB_USER -d $DB_NAME -c "INSERT INTO usuarios (username, password, nombre, email, rol) VALUES ('admin', '\$2a\$10\$XWAeQiUb5.DUIZBOubPAV.iC7I7dc9ecOvmS9o7xx1Ug28jNMO3JS', 'Administrador', 'admin@ejemplo.com', 'admin') ON CONFLICT (username) DO NOTHING;" 2>/dev/null
  fi
  
  echo -e "${GREEN}[OK]${RESET} PostgreSQL configurado correctamente."
  echo -e "${BLUE}==============================================================${RESET}"
  echo -e "Base de datos: ${YELLOW}$DB_NAME${RESET}"
  echo -e "Usuario: ${YELLOW}$DB_USER${RESET}"
  echo -e "Contraseña: ${YELLOW}$DB_PASSWORD${RESET}"
  echo -e "URL de conexión: ${YELLOW}postgresql://localhost:$DB_PORT/$DB_NAME${RESET}"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
  return 0
}

# Función genérica para iniciar un componente
iniciar_componente() {
  local tipo=$1          # Tipo de componente (backend, bff, frontend)
  local directorio=$2    # Ruta del directorio
  local puerto=$3        # Puerto donde se ejecutará
  local comando=$4       # Comando para ejecutar (npm start, npm run dev, node app.js)
  local ruta_api=$5      # Ruta para verificar disponibilidad
  local auto_mode=${6:-0}  # 0: interactivo, 1: automático
  
  echo -e "\n${CYAN}[$tipo]${RESET} Iniciando servicio..."
  
  # Convertir primera letra a mayúscula para los mensajes
  local tipo_cap="$(tr '[:lower:]' '[:upper:]' <<< ${tipo:0:1})${tipo:1}"
  
  # Verificar si ya está ejecutándose
  if verificar_puerto $puerto; then
    local pid=$(lsof -i:$puerto -t)
    echo -e "${YELLOW}[INFO]${RESET} El $tipo_cap ya está en ejecución (PID: $pid)."
    
    if [ "$auto_mode" -eq 0 ]; then
      read -p "¿Desea reiniciarlo? (s/n): " reiniciar
      if [[ $reiniciar != "s" && $reiniciar != "S" ]]; then
        echo -e "${YELLOW}[INFO]${RESET} Operación cancelada."
        return 0
      fi
    fi
    
    echo -e "${YELLOW}[INFO]${RESET} Liberando puerto $puerto..."
    liberar_puerto $puerto $tipo
    sleep 1
  fi
  
  # Verificar que exista el directorio del componente
  if [ ! -d "$directorio" ]; then
    echo -e "${RED}[ERROR]${RESET} No se encontró el directorio: $directorio"
    return 1
  fi
  
  # Verificar/crear archivo .env
  if [ ! -f "$directorio/.env" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando archivo .env para $tipo..."
    
    case $tipo in
      backend)
        cat > "$directorio/.env" << EOL
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
NODE_ENV=${NODE_ENV:-production}
PORT=$puerto
EOL
        ;;
      bff)
        cat > "$directorio/.env" << EOL
PORT=$puerto
API_URL=http://localhost:$BACKEND_PORT
NODE_ENV=${NODE_ENV:-production}
EOL
        ;;
      frontend)
        cat > "$directorio/.env" << EOL
VITE_API_URL=http://localhost:$BFF_PORT
VITE_NODE_ENV=${NODE_ENV:-production}
EOL
        ;;
    esac
    
    echo -e "${GREEN}[OK]${RESET} Archivo .env configurado correctamente"
  fi
  
  # Verificar que estén instaladas las dependencias
  if [ ! -d "${directorio}/node_modules" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Instalando dependencias de $tipo..."
    cd "$directorio"
    npm install
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} Error instalando dependencias"
      cd "$ROOT_DIR"
      return 1
    fi
    cd "$ROOT_DIR"
  fi
  
  # Verificar directorio de uploads para el backend
  if [ "$tipo" = "backend" ] && [ ! -d "${directorio}/uploads" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando directorio de uploads para fotos..."
    mkdir -p "${directorio}/uploads"
    chmod 755 "${directorio}/uploads"
    echo -e "${GREEN}[OK]${RESET} Directorio de uploads creado y configurado"
  fi
  
  # Iniciar el componente
  cd "$directorio"
  local log_file="${LOGS_DIR}/${tipo}.log"
  
  # Limpiar archivo de log anterior
  echo "=== Log de $tipo_cap iniciado a $(date) ===" > "$log_file"
  
  echo -e "${YELLOW}[INFO]${RESET} Iniciando $tipo_cap con: $comando"
  eval "nohup $comando > '$log_file' 2>&1 &"
  local pid=$!
  cd "$ROOT_DIR"
  
  # Guardar PID en variable global
  export ${tipo^^}_PID=$pid
  
  # Esperar a que el componente esté disponible
  echo -e "${YELLOW}[INFO]${RESET} Esperando a que $tipo_cap esté disponible..."
  if esperar_servidor $tipo $puerto "$ruta_api"; then
    echo -e "${GREEN}[OK]${RESET} $tipo_cap iniciado exitosamente en puerto $puerto (PID: $pid)"
    return 0
  else
    echo -e "${RED}[ERROR]${RESET} Error al iniciar el $tipo_cap"
    echo -e "${YELLOW}[AVISO]${RESET} Últimas líneas del log:"
    tail -n 10 "$log_file"
    return 1
  fi
}

# Función para iniciar el backend
iniciar_backend() {
  local auto_mode=${1:-0}
  
  # Verificar primero que PostgreSQL está corriendo
  if ! verificar_postgres; then
    echo -e "${YELLOW}[INFO]${RESET} PostgreSQL no está activo. Iniciando..."
    iniciar_postgres
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} No se pudo iniciar PostgreSQL. Cancelando inicio del backend."
      return 1
    fi
  fi
  
  # Comando de inicio según entorno
  local comando
  if [ "${NODE_ENV:-production}" = "production" ]; then
    comando="node app.js"
  else
    comando="npm run dev"
  fi
  
  # Iniciamos el backend
  iniciar_componente "backend" "$BACKEND_DIR" $BACKEND_PORT "$comando" "/api/status" $auto_mode
}

# Función para detener el backend
detener_backend() {
  echo -e "\n${CYAN}[Backend]${RESET} Deteniendo servicio..."
  
  if verificar_puerto $BACKEND_PORT; then
    local pid=$(lsof -i:$BACKEND_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo Backend (PID: $pid)..."
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $BACKEND_PORT; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Backend. Intentando forzar cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $BACKEND_PORT; then
      echo -e "${GREEN}[OK]${RESET} Backend detenido correctamente."
      return 0
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Backend."
      return 1
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El Backend no está en ejecución."
    return 0
  fi
}

# Función para iniciar el BFF
iniciar_bff() {
  local auto_mode=${1:-0}
  
  # Verificar que el backend esté funcionando
  if ! verificar_puerto $BACKEND_PORT; then
    echo -e "${YELLOW}[AVISO]${RESET} El Backend no está en ejecución. El BFF depende del Backend."
    
    if [ "$auto_mode" -eq 0 ]; then
      read -p "¿Desea iniciar el Backend primero? (s/n): " iniciar_back
      if [[ $iniciar_back == "s" || $iniciar_back == "S" ]]; then
        iniciar_backend $auto_mode
        if [ $? -ne 0 ]; then
          echo -e "${RED}[ERROR]${RESET} No se pudo iniciar el Backend. Cancelando inicio del BFF."
          return 1
        fi
      fi
    else
      echo -e "${YELLOW}[INFO]${RESET} Iniciando Backend automáticamente..."
      iniciar_backend 1
      if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${RESET} No se pudo iniciar el Backend. Cancelando inicio del BFF."
        return 1
      fi
    fi
  fi
  
  # Verificar si el Backend responde correctamente antes de iniciar el BFF
  if ! verificar_conexion $BACKEND_PORT "/api/status" > /dev/null; then
    echo -e "${YELLOW}[AVISO]${RESET} El Backend no está respondiendo. Esperando..."
    if ! esperar_servidor "backend" $BACKEND_PORT "/api/status"; then
      echo -e "${RED}[ERROR]${RESET} El Backend no responde correctamente. Cancelando inicio del BFF."
      return 1
    fi
  fi
  
  # Determinar comando según el entorno
  local comando
  if [ "${NODE_ENV:-production}" = "production" ]; then
    comando="NODE_ENV=production npm start"
    echo -e "${YELLOW}[INFO]${RESET} Iniciando BFF en modo PRODUCCIÓN..."
  else
    comando="npm start"
    echo -e "${YELLOW}[INFO]${RESET} Iniciando BFF en modo desarrollo..."
  fi
  
  # Iniciamos el BFF
  iniciar_componente "bff" "$BFF_DIR" $BFF_PORT "$comando" "/api/status" $auto_mode
}

# Función para detener el BFF
detener_bff() {
  echo -e "\n${CYAN}[BFF]${RESET} Deteniendo servicio..."
  
  if verificar_puerto $BFF_PORT; then
    local pid=$(lsof -i:$BFF_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo BFF (PID: $pid)..."
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $BFF_PORT; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el BFF. Intentando forzar cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $BFF_PORT; then
      echo -e "${GREEN}[OK]${RESET} BFF detenido correctamente."
      return 0
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el BFF."
      return 1
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El BFF no está en ejecución."
    return 0
  fi
}

# Función para iniciar el frontend
iniciar_frontend() {
  local auto_mode=${1:-0}
  
  # Verificar que el BFF esté funcionando
  if ! verificar_puerto $BFF_PORT; then
    echo -e "${YELLOW}[AVISO]${RESET} El BFF no está en ejecución. El Frontend depende del BFF."
    
    if [ "$auto_mode" -eq 0 ]; then
      read -p "¿Desea iniciar el BFF primero? (s/n): " iniciar_bff_first
      if [[ $iniciar_bff_first == "s" || $iniciar_bff_first == "S" ]]; then
        iniciar_bff $auto_mode
        if [ $? -ne 0 ]; then
          echo -e "${RED}[ERROR]${RESET} No se pudo iniciar el BFF. Cancelando inicio del Frontend."
          return 1
        fi
      fi
    else
      echo -e "${YELLOW}[INFO]${RESET} Iniciando BFF automáticamente..."
      iniciar_bff 1
      if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${RESET} No se pudo iniciar el BFF. Cancelando inicio del Frontend."
        return 1
      fi
    fi
  fi
  
  # Verificar si el BFF responde correctamente antes de iniciar el Frontend
  if ! verificar_conexion $BFF_PORT "/api/status" > /dev/null; then
    echo -e "${YELLOW}[AVISO]${RESET} El BFF no está respondiendo. Esperando..."
    if ! esperar_servidor "bff" $BFF_PORT "/api/status"; then
      echo -e "${RED}[ERROR]${RESET} El BFF no responde correctamente. Cancelando inicio del Frontend."
      return 1
    fi
  fi
  
  # Determinar el comando según el entorno
  local comando
  if [ "${NODE_ENV:-production}" = "production" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Iniciando Frontend en modo PRODUCCIÓN..."
    # En modo producción, primero hacemos el build y luego lo servimos con preview
    cd "$FRONTEND_DIR"
    echo -e "${YELLOW}[INFO]${RESET} Construyendo aplicación frontend (npm run build)..."
    npm run build >> "${LOGS_DIR}/frontend_build.log" 2>&1
    if [ $? -ne 0 ]; then
      echo -e "${RED}[ERROR]${RESET} Error al construir la aplicación frontend"
      echo -e "${YELLOW}[AVISO]${RESET} Vea el log en ${LOGS_DIR}/frontend_build.log"
      cd "$ROOT_DIR"
      return 1
    fi
    cd "$ROOT_DIR"
    comando="npm run preview -- --port $FRONTEND_PORT"
  else
    comando="npm run dev -- --port $FRONTEND_PORT"
  fi
  
  # Iniciar el frontend
  iniciar_componente "frontend" "$FRONTEND_DIR" $FRONTEND_PORT "$comando" "/" $auto_mode
}

# Función para detener el frontend
detener_frontend() {
  echo -e "\n${CYAN}[Frontend]${RESET} Deteniendo servicio..."
  
  if verificar_puerto $FRONTEND_PORT; then
    local pid=$(lsof -i:$FRONTEND_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo Frontend (PID: $pid)..."
    kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $FRONTEND_PORT; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Frontend. Intentando forzar cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $FRONTEND_PORT; then
      echo -e "${GREEN}[OK]${RESET} Frontend detenido correctamente."
      return 0
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Frontend."
      return 1
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El Frontend no está en ejecución."
    return 0
  fi
}

# Función para iniciar todo el sistema
# Función para iniciar todo el sistema (definición completa en la línea ~1078)

  

  




# Función para iniciar todo el sistema en modo producción
iniciar_todo() {
  local auto_mode=${1:-0}  # 0: modo interactivo, 1: modo automático (no pregunta)
  
  echo -e "\n${CYAN}[Sistema]${RESET} Iniciando La Misericordia 2..."
  
  # Banner informativo
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e "${GREEN}${BOLD}      SISTEMA LA MISERICORDIA 2 - GESTOR UNIFICADO      ${RESET}"
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e " ${YELLOW}Fecha:${RESET} $(date '+%d-%m-%Y %H:%M:%S')"
  echo -e " ${YELLOW}Entorno:${RESET} ${GREEN}PRODUCCIÓN${RESET}"
  echo -e "${BLUE}=============================================================${RESET}"
  
  # Paso 1: Preparar el entorno
  echo -e "\n${YELLOW}[1/5]${RESET} Preparando entorno..."
  if ! preparar_entorno; then
    echo -e "${RED}[ERROR]${RESET} Error al preparar el entorno. Cancelando inicio del sistema."
    return 1
  fi
  
  # Paso 2: Verificar y liberar puertos si es necesario
  echo -e "\n${YELLOW}[2/5]${RESET} Verificando puertos..."
  if ! verificar_y_liberar_puertos; then
    echo -e "${RED}[ERROR]${RESET} Error al verificar/liberar puertos. Cancelando inicio del sistema."
    return 1
  fi
  
  # Paso 3: Verificar e iniciar PostgreSQL
  echo -e "\n${YELLOW}[3/5]${RESET} Iniciando PostgreSQL..."
  if ! iniciar_postgres; then
    echo -e "${RED}[ERROR]${RESET} Error al iniciar PostgreSQL. Cancelando inicio del sistema."
    return 1
  fi
  
  # Paso 4: Iniciar Backend
  echo -e "\n${YELLOW}[4/5]${RESET} Iniciando Backend..."
  if ! iniciar_backend $auto_mode; then
    echo -e "${RED}[ERROR]${RESET} Error al iniciar el Backend. Cancelando inicio del sistema."
    return 1
  fi
  
  # Paso 5: Iniciar BFF
  echo -e "\n${YELLOW}[5/5]${RESET} Iniciando BFF..."
  if ! iniciar_bff $auto_mode; then
    echo -e "${RED}[ERROR]${RESET} Error al iniciar el BFF. Cancelando inicio del sistema."
    return 1
  fi
  
  # Paso 6: Iniciar Frontend
  echo -e "\n${YELLOW}[6/5]${RESET} Iniciando Frontend..."
  if ! iniciar_frontend $auto_mode; then
    echo -e "${RED}[ERROR]${RESET} Error al iniciar el Frontend. Cancelando inicio del sistema."
    return 1
  fi
  
  # Verificación final
  echo -e "\n${CYAN}[Verificación Final]${RESET} Comprobando todos los servicios..."
  local errores=0
  
  echo -e "${YELLOW}[INFO]${RESET} Esperando 5 segundos para que todos los servicios estén completamente disponibles..."
  sleep 5
  
  if ! verificar_postgres > /dev/null; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está funcionando correctamente."
    ((errores++))
  else
    echo -e "${GREEN}[OK]${RESET} PostgreSQL está activo."
  fi
  
  if ! verificar_puerto $BACKEND_PORT > /dev/null; then
    echo -e "${RED}[ERROR]${RESET} Backend no está funcionando correctamente."
    ((errores++))
  else
    echo -e "${GREEN}[OK]${RESET} Backend está activo en puerto $BACKEND_PORT."
  fi
  
  if ! verificar_puerto $BFF_PORT > /dev/null; then
    echo -e "${RED}[ERROR]${RESET} BFF no está funcionando correctamente."
    ((errores++))
  else
    echo -e "${GREEN}[OK]${RESET} BFF está activo en puerto $BFF_PORT."
  fi
  
  if ! verificar_puerto $FRONTEND_PORT > /dev/null; then
    echo -e "${RED}[ERROR]${RESET} Frontend no está funcionando correctamente."
    ((errores++))
  else
    echo -e "${GREEN}[OK]${RESET} Frontend está activo en puerto $FRONTEND_PORT."
  fi
  
  if [ $errores -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}¡Sistema La Misericordia 2 iniciado correctamente!${RESET}"
    echo -e "${YELLOW}Acceso al sistema:${RESET} ${CYAN}${BOLD}http://localhost:$FRONTEND_PORT${RESET}"
    echo -e "${BLUE}==============================================================${RESET}"
    return 0
  else
    echo -e "\n${RED}${BOLD}¡ADVERTENCIA! Algunos servicios no se iniciaron correctamente.${RESET}"
    echo -e "${YELLOW}Puede revisar los logs para más detalles:${RESET}"
    echo -e "${CYAN}- Backend:${RESET} $LOGS_DIR/backend.log"
    echo -e "${CYAN}- BFF:${RESET} $LOGS_DIR/bff.log"
    echo -e "${CYAN}- Frontend:${RESET} $LOGS_DIR/frontend.log"
    echo -e "${BLUE}==============================================================${RESET}"
    return 1
  fi
}

# Función para detener todo el sistema
detener_todo() {
  local auto_mode=${1:-0}  # 0: modo interactivo, 1: modo automático (no pregunta)
  
  echo -e "\n${CYAN}[Sistema]${RESET} Deteniendo todos los servicios..."
  
  # 1. Detener Frontend
  echo -e "\n${CYAN}[1/3]${RESET} Deteniendo Frontend..."
  if verificar_puerto $FRONTEND_PORT > /dev/null; then
    local pid=$(lsof -i:$FRONTEND_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo Frontend (PID: $pid)..."
    kill -15 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $FRONTEND_PORT > /dev/null; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Frontend. Forzando cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $FRONTEND_PORT > /dev/null; then
      echo -e "${GREEN}[OK]${RESET} Frontend detenido correctamente."
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Frontend completamente."
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El Frontend no está en ejecución."
  fi
  
  # 2. Detener BFF
  echo -e "\n${CYAN}[2/3]${RESET} Deteniendo BFF..."
  if verificar_puerto $BFF_PORT > /dev/null; then
    local pid=$(lsof -i:$BFF_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo BFF (PID: $pid)..."
    kill -15 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $BFF_PORT > /dev/null; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el BFF. Forzando cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $BFF_PORT > /dev/null; then
      echo -e "${GREEN}[OK]${RESET} BFF detenido correctamente."
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el BFF completamente."
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El BFF no está en ejecución."
  fi
  
  # 3. Detener Backend
  echo -e "\n${CYAN}[3/3]${RESET} Deteniendo Backend..."
  if verificar_puerto $BACKEND_PORT > /dev/null; then
    local pid=$(lsof -i:$BACKEND_PORT -t)
    echo -e "${YELLOW}[INFO]${RESET} Deteniendo Backend (PID: $pid)..."
    kill -15 $pid 2>/dev/null
    sleep 2
    
    if verificar_puerto $BACKEND_PORT > /dev/null; then
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Backend. Forzando cierre..."
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    if ! verificar_puerto $BACKEND_PORT > /dev/null; then
      echo -e "${GREEN}[OK]${RESET} Backend detenido correctamente."
    else
      echo -e "${RED}[ERROR]${RESET} No se pudo detener el Backend completamente."
    fi
  else
    echo -e "${YELLOW}[INFO]${RESET} El Backend no está en ejecución."
  fi
  
  # Opcionalmente detener PostgreSQL
  if [ $auto_mode -eq 1 ]; then
    # En modo automático no detenemos PostgreSQL por seguridad
    echo -e "${YELLOW}[INFO]${RESET} PostgreSQL no se ha detenido para preservar datos."
  else
    read -p "¿Desea detener también PostgreSQL? (s/n): " detener_pg
    if [[ $detener_pg == "s" || $detener_pg == "S" ]]; then
      detener_postgres
    fi
  fi
  
  echo -e "\n${GREEN}${BOLD}Sistema La Misericordia 2 detenido correctamente.${RESET}"
  return 0
}

# Función para verificar el estado del sistema
verificar_sistema() {
  echo -e "\n${CYAN}[Diagnóstico]${RESET} Verificando estado del sistema..."
  
  echo -e "\n${YELLOW}Estado de los servicios:${RESET}"
  echo -n "PostgreSQL: "; verificar_postgres
  echo -n "Backend: "; verificar_servicio "Backend" $BACKEND_PORT
  echo -n "BFF: "; verificar_servicio "BFF" $BFF_PORT
  echo -n "Frontend: "; verificar_servicio "Frontend" $FRONTEND_PORT
  
  echo -e "\n${YELLOW}Verificación de directorios:${RESET}"
  for dir in "$BACKEND_DIR" "$BFF_DIR" "$FRONTEND_DIR" "$LOGS_DIR"; do
    if [ -d "$dir" ]; then
      echo -e "$dir: ${GREEN}[EXISTE]${RESET}"
    else
      echo -e "$dir: ${RED}[FALTA]${RESET}"
    fi
  done
  
  echo -e "\n${YELLOW}Verificación de dependencias:${RESET}"
  for dir in "$BACKEND_DIR" "$BFF_DIR" "$FRONTEND_DIR"; do
    if [ -d "$dir/node_modules" ]; then
      echo -e "$dir: ${GREEN}[INSTALADAS]${RESET}"
    else
      echo -e "$dir: ${RED}[FALTANTES]${RESET}"
    fi
  done
  
  echo -e "\n${YELLOW}Verificación de archivos críticos:${RESET}"
  [[ -f "$BACKEND_DIR/.env" ]] && echo -e "Backend .env: ${GREEN}[OK]${RESET}" || echo -e "Backend .env: ${RED}[FALTA]${RESET}"
  [[ -f "$BFF_DIR/.env" ]] && echo -e "BFF .env: ${GREEN}[OK]${RESET}" || echo -e "BFF .env: ${RED}[FALTA]${RESET}"
  [[ -f "$FRONTEND_DIR/.env" ]] && echo -e "Frontend .env: ${GREEN}[OK]${RESET}" || echo -e "Frontend .env: ${RED}[FALTA]${RESET}"
  
  echo -e "\n${BLUE}==============================================================${RESET}"
  read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
}

# Función para reparar rutas y permisos
fix_paths() {
  echo -e "\n${CYAN}[Reparación]${RESET} Verificando y reparando rutas y permisos..."
  
  # Verificar directorio de uploads
  if [ ! -d "${BACKEND_DIR}/uploads" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando directorio de uploads..."
    mkdir -p "${BACKEND_DIR}/uploads"
    chmod 755 "${BACKEND_DIR}/uploads"
  fi
  
  # Verificar directorio de logs
  if [ ! -d "${LOGS_DIR}" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando directorio de logs..."
    mkdir -p "${LOGS_DIR}"
    chmod 755 "${LOGS_DIR}"
  fi
  
  # Verificar archivos .env
  for dir_name in "backend" "bff" "frontend"; do
    case $dir_name in "backend") local dir="${BACKEND_DIR}" ;; "bff") local dir="${BFF_DIR}" ;; "frontend") local dir="${FRONTEND_DIR}" ;; esac
    
    
    if [ ! -f "${dir}/.env" ]; then
      echo -e "${YELLOW}[INFO]${RESET} Creando archivo .env para ${dir_name}..."
      
      case $dir_name in
        backend)
          cat > "${dir}/.env" << EOL
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
NODE_ENV=${NODE_ENV:-development}
EOL
          ;;
        bff)
          cat > "${dir}/.env" << EOL
PORT=$BFF_PORT
API_URL=http://localhost:$BACKEND_PORT
NODE_ENV=${NODE_ENV:-development}
EOL
          ;;
        frontend)
          cat > "${dir}/.env" << EOL
VITE_API_URL=http://localhost:$BFF_PORT
VITE_NODE_ENV=${NODE_ENV:-development}
EOL
          ;;
      esac
      
      echo -e "${GREEN}[OK]${RESET} Archivo .env creado para ${dir_name}."
    fi
  done
  
  echo -e "${GREEN}[OK]${RESET} Reparación de rutas y permisos completada."
  echo -e "${BLUE}==============================================================${RESET}"
  read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
}

# Función para mostrar el menú
show_menu() {
  show_banner
  
  echo -e "\n${YELLOW}Seleccione una opción:${RESET}"
  echo -e "${BOLD}1)${RESET} Iniciar todo el sistema"
  echo -e "${BOLD}2)${RESET} Detener todo el sistema"
  echo -e "${BOLD}3)${RESET} Gestionar PostgreSQL"
  echo -e "${BOLD}4)${RESET} Gestionar Backend"
  echo -e "${BOLD}5)${RESET} Gestionar BFF"
  echo -e "${BOLD}6)${RESET} Gestionar Frontend"
  echo -e "${BOLD}7)${RESET} Ejecutar diagnóstico del sistema"
  echo -e "${BOLD}8)${RESET} Reparar problemas de rutas"
  echo -e "${BOLD}9)${RESET} Cambiar modo (Desarrollo/Producción)"
  echo -e "${BOLD}0)${RESET} Salir"
  echo -e "${BLUE}==============================================================${RESET}"
  
  echo -e "\n${YELLOW}Estado actual:${RESET}"
  echo -n "PostgreSQL: "; verificar_postgres
  echo -n "Backend: "; verificar_servicio "Backend" $BACKEND_PORT
  echo -n "BFF: "; verificar_servicio "BFF" $BFF_PORT
  echo -n "Frontend: "; verificar_servicio "Frontend" $FRONTEND_PORT
  echo
}

# Función para mostrar submenú PostgreSQL
postgres_menu() {
  show_banner
  
  echo -e "\n${YELLOW}Gestión de PostgreSQL:${RESET}"
  echo -e "${BOLD}1)${RESET} Iniciar PostgreSQL"
  echo -e "${BOLD}2)${RESET} Detener PostgreSQL"
  echo -e "${BOLD}3)${RESET} Configurar PostgreSQL completo"
  echo -e "${BOLD}4)${RESET} Ver estado"
  echo -e "${BOLD}0)${RESET} Volver al menú principal"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -p "Seleccione una opción: " opcion
  case $opcion in
    1) iniciar_postgres ;;
    2) detener_postgres ;;
    3) setup_postgres ;;
    4)
      echo -n "PostgreSQL: "
      verificar_postgres
      read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      ;;
    0) return ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
}

# Función para mostrar submenú Backend
backend_menu() {
  show_banner
  
  echo -e "\n${YELLOW}Gestión del Backend:${RESET}"
  echo -e "${BOLD}1)${RESET} Iniciar Backend"
  echo -e "${BOLD}2)${RESET} Detener Backend"
  echo -e "${BOLD}3)${RESET} Reiniciar Backend"
  echo -e "${BOLD}4)${RESET} Ver logs"
  echo -e "${BOLD}0)${RESET} Volver al menú principal"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -p "Seleccione una opción: " opcion
  case $opcion in
    1) iniciar_backend ;;
    2) detener_backend ;;
    3) 
      detener_backend
      sleep 2
      iniciar_backend
      ;;
    4) 
      if [ -f "${LOGS_DIR}/backend.log" ]; then
        less "${LOGS_DIR}/backend.log"
      else
        echo -e "${RED}[ERROR]${RESET} No se encontró el archivo de logs del backend."
        read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      fi
      ;;
    0) return ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
}

# Función para mostrar submenú BFF
bff_menu() {
  show_banner
  
  echo -e "\n${YELLOW}Gestión del BFF:${RESET}"
  echo -e "${BOLD}1)${RESET} Iniciar BFF"
  echo -e "${BOLD}2)${RESET} Detener BFF"
  echo -e "${BOLD}3)${RESET} Reiniciar BFF"
  echo -e "${BOLD}4)${RESET} Ver logs"
  echo -e "${BOLD}0)${RESET} Volver al menú principal"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -p "Seleccione una opción: " opcion
  case $opcion in
    1) iniciar_bff ;;
    2) detener_bff ;;
    3) 
      detener_bff
      sleep 2
      iniciar_bff
      ;;
    4) 
      if [ -f "${LOGS_DIR}/bff.log" ]; then
        less "${LOGS_DIR}/bff.log"
      else
        echo -e "${RED}[ERROR]${RESET} No se encontró el archivo de logs del BFF."
        read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      fi
      ;;
    0) return ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
}

# Función para mostrar submenú Frontend
frontend_menu() {
  show_banner
  
  echo -e "\n${YELLOW}Gestión del Frontend:${RESET}"
  echo -e "${BOLD}1)${RESET} Iniciar Frontend"
  echo -e "${BOLD}2)${RESET} Detener Frontend"
  echo -e "${BOLD}3)${RESET} Reiniciar Frontend"
  echo -e "${BOLD}4)${RESET} Ver logs"
  echo -e "${BOLD}0)${RESET} Volver al menú principal"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -p "Seleccione una opción: " opcion
  case $opcion in
    1) iniciar_frontend ;;
    2) detener_frontend ;;
    3) 
      detener_frontend
      sleep 2
      iniciar_frontend
      ;;
    4) 
      if [ -f "${LOGS_DIR}/frontend.log" ]; then
        less "${LOGS_DIR}/frontend.log"
      else
        echo -e "${RED}[ERROR]${RESET} No se encontró el archivo de logs del frontend."
        read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      fi
      ;;
    0) return ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
}

# Función para cambiar entre modos desarrollo y producción
change_mode() {
  show_banner
  
  echo -e "\n${YELLOW}Seleccione el modo de ejecución:${RESET}"
  echo -e "${BOLD}1)${RESET} Modo DESARROLLO"
  echo -e "${BOLD}2)${RESET} Modo PRODUCCIÓN"
  echo -e "${BOLD}0)${RESET} Volver al menú principal"
  echo -e "${BLUE}==============================================================${RESET}"
  
  read -p "Seleccione una opción: " opcion
  case $opcion in
    1) 
      NODE_ENV="development"
      echo -e "${GREEN}[OK]${RESET} Modo cambiado a DESARROLLO"
      read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      ;;
    2) 
      NODE_ENV="production"
      echo -e "${GREEN}[OK]${RESET} Modo cambiado a PRODUCCIÓN"
      read -n 1 -s -r -p "Presione cualquier tecla para continuar..."
      ;;
    0) return ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
}

# Establecer NODE_ENV por defecto
# Si hay variable de entorno ya configurada, respetarla
if [ -z "$NODE_ENV" ]; then
  NODE_ENV="development"
  echo -e "${YELLOW}[CONFIG]${RESET} Variable NODE_ENV no encontrada, estableciendo modo: ${CYAN}desarrollo${RESET}"
else
  echo -e "${YELLOW}[CONFIG]${RESET} Usando modo de entorno existente: ${CYAN}$NODE_ENV${RESET}"
fi

# Función para reparar el contexto de autenticación
repair_auth_context() {
  if [ ! -f "${FRONTEND_DIR}/src/context/AuthContext.jsx" ] || ! grep -q "useAuth" "${FRONTEND_DIR}/src/context/AuthContext.jsx"; then
    echo -e "${YELLOW}[AVISO]${RESET} El archivo AuthContext.jsx no existe o está incompleto. Creando uno básico..."
    
    mkdir -p "${FRONTEND_DIR}/src/context"
    cat > "${FRONTEND_DIR}/src/context/AuthContext.jsx" << 'EOL'
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = async () => {
      const storedUser = localStorage.getItem('@LaMS:user');
      const storedToken = localStorage.getItem('@LaMS:token');
      
      if (storedUser && storedToken) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }
      
      setLoading(false);
    };
    
    loadStoredUser();
  }, []);

  const signIn = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      const { user, token } = response.data;
      
      localStorage.setItem('@LaMS:user', JSON.stringify(user));
      localStorage.setItem('@LaMS:token', token);
      
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error en la autenticación'
      };
    }
  };

  const signOut = () => {
    localStorage.removeItem('@LaMS:user');
    localStorage.removeItem('@LaMS:token');
    api.defaults.headers.Authorization = '';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
EOL
    return 0
  fi
  return 0
}

# Función para verificar la conexión a un servidor
verificar_conexion() {
  local puerto=$1
  local ruta=${2:-"/api/status"}
  local timeout=${3:-2}
  
  # Verificar primero que el puerto esté en uso
  if ! verificar_puerto $puerto > /dev/null; then
    echo -e "${YELLOW}[INFO]${RESET} El puerto $puerto no está en uso todavía"
    return 1
  fi
  
  # Intentar conexión HTTP con timeout
  local respuesta=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $timeout "http://localhost:$puerto$ruta" 2>/dev/null)
  local curl_status=$?
  
  if [ "$respuesta" = "200" ]; then
    echo -e "${GREEN}[OK]${RESET} Servidor en puerto $puerto responde correctamente"
    return 0
  elif [ "$curl_status" -ne 0 ]; then
    echo -e "${YELLOW}[INFO]${RESET} Error de conexión al puerto $puerto (curl error: $curl_status)"
    return 1
  else
    echo -e "${YELLOW}[INFO]${RESET} No se pudo conectar a http://localhost:$puerto$ruta (código HTTP: $respuesta)"
    return 1
  fi
}

# Función para esperar a que un servidor esté disponible
esperar_servidor() {
  local tipo=$1
  local puerto=$2
  local ruta=${3:-"/api/status"}
  local max_intentos=${4:-30}
  local intervalo=${5:-1}
  
  echo -e "${CYAN}[INFO]${RESET} Esperando a que $tipo esté disponible en puerto $puerto..."
  
  # En modo producción, establecer más intentos
  if [ "${NODE_ENV:-development}" = "production" ]; then
    max_intentos=60  # Más tiempo de espera en producción
    intervalo=2      # Intervalo más largo en producción
    echo -e "${YELLOW}[INFO]${RESET} Modo PRODUCCIÓN: Tiempo de espera extendido (hasta ${max_intentos} segundos)"
  fi
  
  for ((i=1; i<=$max_intentos; i++)); do
    echo -ne "${YELLOW}[ESPERA]${RESET} Intento $i/$max_intentos\r"
    
    # Primero verificar si el puerto está en uso
    if ! verificar_puerto $puerto > /dev/null; then
      echo -ne "${YELLOW}[ESPERA]${RESET} Puerto $puerto no está activo todavía\r"
      sleep $intervalo
      continue
    fi
    
    # Si el puerto está activo, verificar si el servicio responde
    if verificar_conexion $puerto "$ruta" 2 > /dev/null; then
      echo -e "\n${GREEN}[ÉXITO]${RESET} $tipo está disponible en http://localhost:$puerto"
      return 0
    fi
    
    sleep $intervalo
  done
  
  echo -e "\n${RED}[ERROR]${RESET} Tiempo de espera agotado para $tipo"
  echo -e "${YELLOW}[SUGERENCIA]${RESET} Revise los logs en ${LOGS_DIR}/${tipo}.log"
  return 1
}

# Función para verificar los puertos y liberarlos si es necesario
verificar_y_liberar_puertos() {
  echo -e "\n${CYAN}[Sistema]${RESET} Verificando puertos necesarios..."
  
  local puertos=("$BACKEND_PORT:backend" "$BFF_PORT:bff" "$FRONTEND_PORT:frontend" "$DB_PORT:postgres")
  local errores=0
  
  for item in "${puertos[@]}"; do
    IFS=':' read -r puerto servicio <<< "$item"
    
    echo -e "${YELLOW}[INFO]${RESET} Verificando puerto $puerto para $servicio..."
    if verificar_puerto $puerto > /dev/null; then
      echo -e "${YELLOW}[AVISO]${RESET} Puerto $puerto para $servicio está en uso."
      echo -e "${YELLOW}[INFO]${RESET} Intentando liberar puerto..."
      if ! liberar_puerto $puerto $servicio; then
        echo -e "${RED}[ERROR]${RESET} No se pudo liberar el puerto $puerto para $servicio."
        ((errores++))
      else
        echo -e "${GREEN}[OK]${RESET} Puerto $puerto liberado correctamente."
      fi
    else
      echo -e "${GREEN}[OK]${RESET} Puerto $puerto para $servicio está disponible."
    fi
  done
  
  if [ $errores -gt 0 ]; then
    echo -e "${RED}[ERROR]${RESET} No se pudieron liberar todos los puertos necesarios."
    return 1
  fi
  
  echo -e "${GREEN}[OK]${RESET} Todos los puertos están disponibles o fueron liberados."
  return 0
}

# Función para preparar el entorno
preparar_entorno() {
  echo -e "\n${CYAN}[Sistema]${RESET} Preparando entorno..."
  
  # Verificar directorios esenciales
  if [ ! -d "${BACKEND_DIR}" ]; then
    echo -e "${RED}[ERROR]${RESET} No se encontró el directorio del backend: $BACKEND_DIR"
    return 1
  fi
  
  if [ ! -d "${BFF_DIR}" ]; then
    echo -e "${RED}[ERROR]${RESET} No se encontró el directorio del BFF: $BFF_DIR"
    return 1
  fi
  
  if [ ! -d "${FRONTEND_DIR}" ]; then
    echo -e "${RED}[ERROR]${RESET} No se encontró el directorio del frontend: $FRONTEND_DIR"
    return 1
  fi
  
  # Verificar directorio de uploads
  if [ ! -d "${BACKEND_DIR}/uploads" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando directorio de uploads..."
    mkdir -p "${BACKEND_DIR}/uploads"
    chmod 755 "${BACKEND_DIR}/uploads"
  fi
  
  # Verificar directorio de logs
  if [ ! -d "${LOGS_DIR}" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Creando directorio de logs..."
    mkdir -p "${LOGS_DIR}"
    chmod 755 "${LOGS_DIR}"
  fi
  
  echo -e "${GREEN}[OK]${RESET} Entorno preparado correctamente."
  return 0
}
# Verificar si se pasa el parámetro --start-produccion para iniciar automáticamente
if [[ "$1" == "--start-produccion" ]]; then
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e "${GREEN}${BOLD}  INICIANDO SISTEMA LA MISERICORDIA 2 EN PRODUCCIÓN  ${RESET}"
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e " ${YELLOW}Fecha:${RESET} $(date '+%d-%m-%Y %H:%M:%S')"
  echo -e " ${YELLOW}Usuario:${RESET} $(whoami)"
  echo -e " ${YELLOW}Directorio:${RESET} ${ROOT_DIR}"
  echo -e "${BLUE}=============================================================${RESET}"
  
  # Cambiar a modo producción
  NODE_ENV="production"
  echo -e "${GREEN}[MODO]${RESET} Establecido en PRODUCCIÓN"
  
  # Iniciar todo el sistema automáticamente en modo no interactivo (1)
  iniciar_todo 1
  
  status=$?
  if [ $status -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}Sistema iniciado exitosamente en modo PRODUCCIÓN${RESET}"
    echo -e "${YELLOW}[INFO]${RESET} Puede acceder al sistema en: ${BOLD}http://localhost:$FRONTEND_PORT${RESET}"
    echo -e "${YELLOW}[INFO]${RESET} Para detener el sistema, ejecute nuevamente este script con: ${BOLD}./gestor_sistema_lm2.sh --stop${RESET}"
  else
    echo -e "\n${RED}${BOLD}Error al iniciar el sistema en modo PRODUCCIÓN${RESET}"
    echo -e "${YELLOW}[INFO]${RESET} Revise los logs para más información:"
    echo -e "${CYAN}- Backend:${RESET} $LOGS_DIR/backend.log"
    echo -e "${CYAN}- BFF:${RESET} $LOGS_DIR/bff.log" 
    echo -e "${CYAN}- Frontend:${RESET} $LOGS_DIR/frontend.log"
  fi
  exit $status
fi

# Verificar si se pasa el parámetro --stop para detener todo
if [[ "$1" == "--stop" ]]; then
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e "${RED}${BOLD}        DETENIENDO SISTEMA LA MISERICORDIA 2         ${RESET}"
  echo -e "${BLUE}=============================================================${RESET}"
  echo -e " ${YELLOW}Fecha:${RESET} $(date '+%d-%m-%Y %H:%M:%S')"
  echo -e "${BLUE}=============================================================${RESET}"
  
  # Detener todo el sistema
  detener_todo 0
  exit 0
fi

# Bucle principal del menú interactivo (si no se pasaron parámetros)
while true; do
  show_menu
  
  read -p "Seleccione una opción: " opcion
  
  case $opcion in
    1) iniciar_todo ;;
    2) detener_todo ;;
    3) postgres_menu ;;
    4) backend_menu ;;
    5) bff_menu ;;
    6) frontend_menu ;;
    7) verificar_sistema ;;
    8) fix_paths ;;
    9) change_mode ;;
    0) 
      echo -e "${GREEN}${BOLD}¡Adiós!${RESET}"
      exit 0
      ;;
    *) echo -e "${RED}Opción inválida${RESET}" ;;
  esac
done
