#!/bin/bash
# ============================================================================
# SCRIPT PARA BACKUP DE POSTGRESQL LOCAL - LA MISERICORDIA 2
# ============================================================================
# Este script realiza un respaldo de la base de datos local
# para preservar los datos antes de hacer despliegues en Railway
# 
# Acciones:
# 1. Verifica que PostgreSQL esté en ejecución
# 2. Crea un directorio para los backups si no existe
# 3. Realiza un dump completo de la base de datos
# 4. Genera un archivo con la estructura (schema) por separado
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
BACKUP_DIR="$(pwd)/database_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}=============================================================${RESET}"
echo -e "${GREEN}${BOLD}         BACKUP DE BASE DE DATOS - LA MISERICORDIA 2      ${RESET}"
echo -e "${BLUE}=============================================================${RESET}"

# 1. Verificar PostgreSQL
echo -e "\n${YELLOW}[1/4]${RESET} Verificando PostgreSQL..."

if ! brew services list | grep -q "postgresql.*started"; then
    echo -e "${RED}[ERROR]${RESET} PostgreSQL no está en ejecución. Iniciando..."
    brew services start postgresql
    sleep 3
    
    if ! brew services list | grep -q "postgresql.*started"; then
        echo -e "${RED}[ERROR]${RESET} No se pudo iniciar PostgreSQL. Abortando."
        exit 1
    fi
fi

echo -e "${GREEN}[OK]${RESET} PostgreSQL está en ejecución."

# 2. Crear directorio para backups
echo -e "\n${YELLOW}[2/4]${RESET} Preparando directorio para backups..."

mkdir -p $BACKUP_DIR
echo -e "${GREEN}[OK]${RESET} Directorio para backups: $BACKUP_DIR"

# 3. Realizar dump completo
echo -e "\n${YELLOW}[3/4]${RESET} Creando backup completo de la base de datos..."

FULL_BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_full_$TIMESTAMP.sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME -f $FULL_BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${RESET} Backup completo creado en: $FULL_BACKUP_FILE"
else
    echo -e "${RED}[ERROR]${RESET} Error al crear el backup completo."
    echo "Verifica las credenciales y que la base de datos exista."
    exit 1
fi

# 4. Crear dump de schema
echo -e "\n${YELLOW}[4/4]${RESET} Creando backup de estructura (schema)..."

SCHEMA_BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_schema_$TIMESTAMP.sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME --schema-only -f $SCHEMA_BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${RESET} Backup de estructura creado en: $SCHEMA_BACKUP_FILE"
else
    echo -e "${RED}[ERROR]${RESET} Error al crear el backup de estructura."
    exit 1
fi

# Resumen final
echo -e "\n${GREEN}${BOLD}¡BACKUP COMPLETADO EXITOSAMENTE!${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "Backup completo: ${GREEN}$(basename $FULL_BACKUP_FILE)${RESET}"
echo -e "Tamaño: ${GREEN}$(du -h $FULL_BACKUP_FILE | cut -f1)${RESET}"
echo -e ""
echo -e "Backup de estructura: ${GREEN}$(basename $SCHEMA_BACKUP_FILE)${RESET}"
echo -e "Tamaño: ${GREEN}$(du -h $SCHEMA_BACKUP_FILE | cut -f1)${RESET}"
echo -e "${BLUE}=============================================================${RESET}"
echo -e "\nPara restaurar el backup completo:"
echo -e "${YELLOW}PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f $FULL_BACKUP_FILE${RESET}"
echo -e "\nPara restaurar solo la estructura:"
echo -e "${YELLOW}PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f $SCHEMA_BACKUP_FILE${RESET}"
