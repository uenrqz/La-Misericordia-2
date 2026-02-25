#!/bin/bash
# Script simplificado para detener el sistema La Misericordia 2
# Detiene Frontend, BFF, Backend y PostgreSQL

echo "===== DETENIENDO SISTEMA LA MISERICORDIA 2 ====="
echo "Fecha: $(date '+%d-%m-%Y %H:%M:%S')"
echo "Usuario: $(whoami)"
echo "====================================="

# Puertos para verificación
BACKEND_PORT=3000
BFF_PORT=4000
FRONTEND_PORT=5174

# 1. Detener Frontend
echo "1. Deteniendo Frontend..."
if lsof -i:$FRONTEND_PORT -sTCP:LISTEN &>/dev/null; then
    PID=$(lsof -i:$FRONTEND_PORT -sTCP:LISTEN -t)
    echo "Deteniendo proceso Frontend (PID: $PID)"
    kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    sleep 2
    echo "Frontend detenido"
else
    echo "Frontend no estaba en ejecución"
fi

# 2. Detener BFF
echo "2. Deteniendo BFF..."
if lsof -i:$BFF_PORT -sTCP:LISTEN &>/dev/null; then
    PID=$(lsof -i:$BFF_PORT -sTCP:LISTEN -t)
    echo "Deteniendo proceso BFF (PID: $PID)"
    kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    sleep 2
    echo "BFF detenido"
else
    echo "BFF no estaba en ejecución"
fi

# 3. Detener Backend
echo "3. Deteniendo Backend..."
if lsof -i:$BACKEND_PORT -sTCP:LISTEN &>/dev/null; then
    PID=$(lsof -i:$BACKEND_PORT -sTCP:LISTEN -t)
    echo "Deteniendo proceso Backend (PID: $PID)"
    kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    sleep 2
    echo "Backend detenido"
else
    echo "Backend no estaba en ejecución"
fi

# 4. Detener PostgreSQL (opcional, comenta si no quieres detenerlo)
echo "4. ¿Desea detener PostgreSQL también? (s/n)"
read -r STOP_POSTGRES
if [[ $STOP_POSTGRES == "s" || $STOP_POSTGRES == "S" ]]; then
    echo "Deteniendo PostgreSQL..."
    brew services stop postgresql &>/dev/null
    echo "PostgreSQL detenido"
else
    echo "PostgreSQL se mantiene en ejecución"
fi

echo ""
echo "===== SISTEMA LA MISERICORDIA 2 DETENIDO ====="
echo "====================================="
