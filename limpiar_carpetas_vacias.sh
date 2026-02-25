#!/bin/bash

# Script para limpiar carpetas vacías y optimizar el proyecto
# Creado: 19 de junio de 2025

echo "=== Limpiando carpetas vacías del proyecto ==="

# Carpetas de estructura universitaria que no afectan al código
echo "Eliminando carpetas de estructura de directorios no utilizadas..."
rm -rf "./UMG"
rm -rf "./semestre"
rm -rf "./ASILO"
rm -rf "./MISERICORDIA"
rm -rf "./2"
rm -rf "./3"

# Carpetas técnicas vacías
echo "Limpiando carpetas técnicas vacías..."
if [ -d "./hogar-ancianos-frontend/src/hooks" ] && [ -z "$(ls -A ./hogar-ancianos-frontend/src/hooks)" ]; then
  rm -rf "./hogar-ancianos-frontend/src/hooks"
  echo "- hooks eliminado (vacío)"
fi

if [ -d "./hogar-ancianos-backend/src/models" ] && [ -z "$(ls -A ./hogar-ancianos-backend/src/models)" ]; then
  rm -rf "./hogar-ancianos-backend/src/models"
  echo "- models eliminado (vacío)"
else
  echo "- models no está vacío, se mantiene"
fi

if [ -d "./hogar-ancianos-backend/uploads" ] && [ -z "$(ls -A ./hogar-ancianos-backend/uploads)" ]; then
  # Es mejor mantener el directorio uploads aunque esté vacío
  echo "- uploads se mantiene para almacenamiento futuro"
fi

echo ""
echo "=== Optimización de node_modules ==="
echo "NOTA: Para optimizar completamente node_modules, considera ejecutar:"
echo "      npm prune --production"
echo "      en cada proyecto después de terminar el desarrollo"

echo ""
echo "=== Proceso completado ==="
echo "Carpetas vacías eliminadas. Si necesitas recrear alguna estructura, consulta la documentación del proyecto."
