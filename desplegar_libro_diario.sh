#!/bin/bash

# Script para desplegar el Sistema de Libro Diario Financiero
# Proyecto: La Misericordia 2

echo "🚀 Desplegando Sistema de Libro Diario Financiero..."
echo "=================================================="

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Paso 1: Verificar que estamos en el directorio correcto
print_step "Verificando directorio del proyecto..."
if [ ! -f "package.json" ]; then
    print_error "No se encuentra package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi
print_success "Directorio verificado"

# Paso 2: Hacer commit de los cambios
print_step "Haciendo commit de los cambios..."
git add .
git commit -m "feat: Sistema de Libro Diario Financiero con predicciones inteligentes y calendario de pagos

- Esquema de base de datos con 6 tablas
- Controladores backend para transacciones y pagos
- Sistema de predicciones basado en historial
- Calendario de pagos con recordatorios
- Rutas en BFF y servicios frontend
- Documentación completa de implementación"

if [ $? -eq 0 ]; then
    print_success "Cambios commiteados"
else
    print_warning "No hay cambios nuevos o ya fueron commiteados"
fi

# Paso 3: Push a GitHub
print_step "Subiendo cambios a GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Código subido a GitHub"
else
    print_error "Error al subir código. Verifica tu conexión y credenciales."
    exit 1
fi

# Paso 4: Aplicar migraciones en base de datos
print_step "Aplicando esquema de base de datos..."
print_warning "IMPORTANTE: Este paso requiere conexión a la base de datos de Render"

read -p "¿Deseas aplicar el esquema de BD ahora? (s/n): " apply_schema

if [ "$apply_schema" == "s" ]; then
    if [ -z "$DATABASE_URL" ]; then
        print_error "La variable DATABASE_URL no está definida."
        print_warning "Por favor, ejecuta manualmente:"
        echo "  psql \$DATABASE_URL -f hogar-ancianos-backend/scripts/libro_diario_financiero.sql"
    else
        print_step "Aplicando script SQL..."
        psql $DATABASE_URL -f hogar-ancianos-backend/scripts/libro_diario_financiero.sql
        
        if [ $? -eq 0 ]; then
            print_success "Esquema de base de datos aplicado correctamente"
        else
            print_error "Error al aplicar esquema. Verifica la conexión a la BD."
        fi
    fi
else
    print_warning "Esquema no aplicado. Recuerda aplicarlo manualmente:"
    echo "  psql \$DATABASE_URL -f hogar-ancianos-backend/scripts/libro_diario_financiero.sql"
fi

# Paso 5: Verificar despliegue en Render
echo ""
print_step "Verificando despliegue automático en Render..."
print_warning "Los servicios en Render se actualizarán automáticamente con el push a GitHub:"
echo "  - Backend: https://hogar-ancianos-backend.onrender.com"
echo "  - BFF: https://hogar-ancianos-bff.onrender.com"
echo "  - Frontend: https://lamisericordiaapp.vercel.app (Vercel - despliegue automático)"
echo ""
print_warning "Monitorea los logs en:"
echo "  Backend: https://dashboard.render.com/web/srv-XXXXX/logs"
echo "  BFF: https://dashboard.render.com/web/srv-XXXXX/logs"
echo ""

# Paso 6: Resumen y próximos pasos
echo ""
echo "=================================================="
print_success "Despliegue iniciado correctamente"
echo "=================================================="
echo ""
print_warning "PRÓXIMOS PASOS:"
echo ""
echo "1. 📊 Aplicar esquema de BD (si no se hizo arriba):"
echo "   psql \$DATABASE_URL -f hogar-ancianos-backend/scripts/libro_diario_financiero.sql"
echo ""
echo "2. 🖥️  Crear componentes React (ver LIBRO_DIARIO_FINANCIERO_IMPLEMENTACION.md):"
echo "   - LibroDiario.jsx"
echo "   - CalendarioPagos.jsx"
echo "   - FormTransaccion.jsx"
echo "   - FormPagoProgramado.jsx"
echo ""
echo "3. 🔗 Integrar en dashboard admin"
echo ""
echo "4. 🧪 Probar las funcionalidades:"
echo "   - Crear transacciones de prueba"
echo "   - Configurar pagos programados"
echo "   - Verificar predicciones"
echo ""
echo "5. 📝 Revisar documentación completa:"
echo "   - LIBRO_DIARIO_FINANCIERO_IMPLEMENTACION.md"
echo ""
print_success "¡Sistema de Libro Diario Financiero listo para usar!"
echo ""
