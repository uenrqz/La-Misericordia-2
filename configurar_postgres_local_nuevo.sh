#!/bin/bash
# ============================================================================
# SCRIPT PARA CONFIGURAR POSTGRESQL LOCAL PARA LA MISERICORDIA 2
# ============================================================================
# Este script configura PostgreSQL local para ser usado con el sistema
# La Misericordia 2 sin necesidad de Docker.
#
# Acciones:
# 1. Verifica si PostgreSQL está instalado localmente
# 2. Inicia el servicio de PostgreSQL si no está en ejecución
# 3. Crea el usuario 'hogar_user' y la base de datos 'hogar_db'
# 4. Configura los permisos necesarios
# 5. Ejecuta el script de inicialización de la base de datos
# ============================================================================

# Colores para la salida
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"
BOLD="\033[1m"

# Configuración
DB_USER="hogar_user"
DB_PASSWORD="securepass"
DB_NAME="hogar_db"
BACKEND_DIR="$(pwd)/hogar-ancianos-backend"

echo -e "${BLUE}=============================================================${RESET}"
echo -e "${GREEN}${BOLD}   CONFIGURACIÓN DE POSTGRESQL LOCAL - LA MISERICORDIA 2   ${RESET}"
echo -e "${BLUE}=============================================================${RESET}"

# 1. Verificar si PostgreSQL está instalado
echo -e "\n${YELLOW}[1/5]${RESET} Verificando instalación de PostgreSQL..."

if ! command -v postgres &> /dev/null; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está instalado. Instalando con Homebrew..."
    brew install postgresql@14
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${RESET} Falló la instalación de PostgreSQL."
        echo "Intenta instalarlo manualmente con: brew install postgresql@14"
        exit 1
    fi
else
    echo -e "${GREEN}[OK]${RESET} PostgreSQL está instalado."
fi

# 2. Iniciar el servicio de PostgreSQL
echo -e "\n${YELLOW}[2/5]${RESET} Verificando servicio PostgreSQL..."

if ! brew services list | grep -q "postgresql.*started"; then
    echo -e "${YELLOW}[INFO]${RESET} Iniciando servicio PostgreSQL..."
    brew services start postgresql
    sleep 3
else
    echo -e "${GREEN}[OK]${RESET} El servicio PostgreSQL ya está en ejecución."
fi

# Verificar que el servicio esté activo
if ! brew services list | grep -q "postgresql.*started"; then
    echo -e "${RED}[ERROR]${RESET} No se pudo iniciar el servicio PostgreSQL."
    exit 1
fi

# 3. Crear usuario y base de datos
echo -e "\n${YELLOW}[3/5]${RESET} Configurando usuario y base de datos..."

# Verificar si el usuario ya existe
if psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}[OK]${RESET} El usuario '$DB_USER' ya existe."
else
    # Intentar crear el usuario
    echo -e "${YELLOW}[INFO]${RESET} Creando usuario '$DB_USER'..."
    
    if createuser -d $DB_USER 2>/dev/null; then
        echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' creado correctamente."
    else
        echo -e "${YELLOW}[INFO]${RESET} Intentando crear usuario con psql..."
        if psql -U $(whoami) -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN CREATEDB PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
            echo -e "${GREEN}[OK]${RESET} Usuario '$DB_USER' creado correctamente."
        else
            echo -e "${RED}[ERROR]${RESET} No se pudo crear el usuario '$DB_USER'."
            echo "Intenta ejecutar manualmente: createuser -d $DB_USER"
            exit 1
        fi
    fi
fi

# Configurar contraseña si no está establecida
echo -e "${YELLOW}[INFO]${RESET} Configurando contraseña para '$DB_USER'..."
psql -U $(whoami) -d postgres -c "ALTER ROLE $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null

# Verificar si la base de datos existe
if psql -U $(whoami) -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}[OK]${RESET} La base de datos '$DB_NAME' ya existe."
else
    echo -e "${YELLOW}[INFO]${RESET} Creando base de datos '$DB_NAME'..."
    createdb -U $(whoami) -O $DB_USER $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK]${RESET} Base de datos '$DB_NAME' creada correctamente."
    else
        echo -e "${RED}[ERROR]${RESET} No se pudo crear la base de datos '$DB_NAME'."
        exit 1
    fi
fi

# 4. Configurar permisos
echo -e "\n${YELLOW}[4/5]${RESET} Configurando permisos..."

psql -U $(whoami) -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -U $(whoami) -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
psql -U $(whoami) -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

echo -e "${GREEN}[OK]${RESET} Permisos configurados para el usuario '$DB_USER'."

# 5. Ejecutar script de inicialización
echo -e "\n${YELLOW}[5/5]${RESET} Inicializando la base de datos..."

if [ -f "$BACKEND_DIR/scripts/init_simplified.sql" ]; then
    echo -e "${YELLOW}[INFO]${RESET} Ejecutando script de inicialización..."
    psql -U $DB_USER -d $DB_NAME -f "$BACKEND_DIR/scripts/init_simplified.sql"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK]${RESET} Base de datos inicializada correctamente."
    else
        echo -e "${RED}[ERROR]${RESET} Error al ejecutar el script de inicialización."
        exit 1
    fi
else
    echo -e "${YELLOW}[AVISO]${RESET} No se encontró el script de inicialización."
    echo "La estructura de la base de datos se creará al iniciar la aplicación."
fi

# Verificación final
echo -e "\n${YELLOW}[INFO]${RESET} Verificando conexión a la base de datos..."

if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "\conninfo" > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${RESET} Conexión exitosa a la base de datos con el usuario '$DB_USER'."
else
    echo -e "${RED}[ERROR]${RESET} No se pudo conectar a la base de datos."
    echo "Verifica la configuración e intenta nuevamente."
    exit 1
fi

echo -e "\n${GREEN}${BOLD}¡POSTGRESQL CONFIGURADO EXITOSAMENTE!${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "Usuario: ${GREEN}$DB_USER${RESET}"
echo -e "Contraseña: ${GREEN}$DB_PASSWORD${RESET}"
echo -e "Base de datos: ${GREEN}$DB_NAME${RESET}"
echo -e "Host: ${GREEN}localhost${RESET}"
echo -e "Puerto: ${GREEN}5432${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "\n${YELLOW}Ahora puedes iniciar el sistema con:${RESET} ./iniciar_sistema_simple.sh"
