#!/bin/bash

# Obtener la dirección IP local de la máquina
IP_LOCAL=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

if [ -z "$IP_LOCAL" ]; then
  echo "No se pudo detectar la dirección IP local. Usando 127.0.0.1"
  IP_LOCAL="127.0.0.1"
fi

echo "====================================================="
echo "  INICIANDO FRONTEND PARA ACCESO DESDE DISPOSITIVOS  "
echo "====================================================="
echo ""
echo "IP detectada: $IP_LOCAL"
echo ""
echo "Para acceder desde tu celular, usa: http://$IP_LOCAL:5174"
echo ""
echo "Asegúrate que tu celular esté conectado a la misma red WiFi."
echo ""
echo "====================================================="

cd hogar-ancianos-frontend
npm run dev -- --host
