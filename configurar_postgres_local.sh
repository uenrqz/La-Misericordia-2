#!/bin/bash

# Colores para la salida
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BLUE}==============================================================${RESET}"
echo -e "${GREEN}    CONFIGURACIÓN DE POSTGRESQL LOCAL PARA LA MISERICORDIA 2    ${RESET}"
echo -e "${BLUE}==============================================================${RESET}"

# 1. Verificar si PostgreSQL está instalado
if ! command -v postgres &> /dev/null; then
    echo -e "${YELLOW}[INFO]${RESET} PostgreSQL no está instalado. Instalando con Homebrew..."
    brew install postgresql@14
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${RESET} Falló la instalación de PostgreSQL."
        echo -e "Intenta instalarlo manualmente con: brew install postgresql@14"
        exit 1
    fi
else
    echo -e "${GREEN}[OK]${RESET} PostgreSQL ya está instalado."
fi

# 2. Iniciar el servicio de PostgreSQL
echo -e "${YELLOW}[INFO]${RESET} Iniciando el servicio de PostgreSQL..."
brew services start postgresql

# 3. Esperar a que PostgreSQL inicie
echo -e "${YELLOW}[INFO]${RESET} Esperando a que PostgreSQL esté listo..."
sleep 5

# 4. Crear usuario y base de datos
echo -e "${YELLOW}[INFO]${RESET} Creando usuario y base de datos..."

# Verificar si el usuario ya existe
if psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='hogar_user'" | grep -q 1; then
    echo -e "${GREEN}[OK]${RESET} El usuario 'hogar_user' ya existe."
else
    # Crear el usuario
    createuser -d hogar_user

    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[AVISO]${RESET} No se pudo crear el usuario con createuser, intentando con psql..."
        psql -U $(whoami) -d postgres -c "CREATE ROLE hogar_user WITH LOGIN CREATEDB PASSWORD 'securepass';"
    fi
    
    echo -e "${GREEN}[OK]${RESET} Usuario 'hogar_user' creado."
fi

# Verificar si la base de datos ya existe
if psql -U $(whoami) -lqt | cut -d \| -f 1 | grep -qw hogar_db; then
    echo -e "${GREEN}[OK]${RESET} La base de datos 'hogar_db' ya existe."
else
    # Crear la base de datos
    createdb -O hogar_user hogar_db
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[AVISO]${RESET} No se pudo crear la base de datos con createdb, intentando con psql..."
        psql -U $(whoami) -d postgres -c "CREATE DATABASE hogar_db OWNER hogar_user;"
    fi
    
    echo -e "${GREEN}[OK]${RESET} Base de datos 'hogar_db' creada."
fi

# 5. Establecer la contraseña para el usuario
echo -e "${YELLOW}[INFO]${RESET} Estableciendo contraseña para el usuario 'hogar_user'..."
psql -U $(whoami) -d postgres -c "ALTER USER hogar_user WITH PASSWORD 'securepass';"

# 6. Aplicar el esquema inicial de la base de datos
echo -e "${YELLOW}[INFO]${RESET} Aplicando esquema inicial de la base de datos..."
psql -U hogar_user -d hogar_db -f ./hogar-ancianos-backend/scripts/init_db.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${RESET} Esquema inicial aplicado correctamente."
else
    echo -e "${YELLOW}[AVISO]${RESET} Hubo errores al aplicar el esquema. Esto puede ser normal si las tablas ya existen."
fi

# 7. Crear usuario administrador
echo -e "${YELLOW}[INFO]${RESET} Creando usuario administrador predeterminado..."
node ./hogar-ancianos-backend/scripts/crear_usuarios_admin.js

echo -e "${BLUE}==============================================================${RESET}"
echo -e "${GREEN}    POSTGRESQL LOCAL CONFIGURADO CORRECTAMENTE     ${RESET}"
echo -e "${BLUE}==============================================================${RESET}"
echo -e "Base de datos: ${YELLOW}hogar_db${RESET}"
echo -e "Usuario: ${YELLOW}hogar_user${RESET}"
echo -e "Contraseña: ${YELLOW}securepass${RESET}"
echo -e "URL de conexión: ${YELLOW}postgresql://localhost:5432/hogar_db${RESET}"
echo -e "${BLUE}==============================================================${RESET}"
