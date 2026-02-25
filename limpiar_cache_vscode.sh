#!/bin/bash
# Script para limpiar caché de VS Code y reducir uso de memoria
# Creado el 19 de junio de 2025

echo "Limpiando caché de VS Code..."

# Cierra VS Code si está abierto
osascript -e 'quit app "Visual Studio Code"' 2>/dev/null

# Espera a que VS Code se cierre completamente
sleep 2

# Limpia directorios de caché
rm -rf ~/Library/Application\ Support/Code/Cache/*
rm -rf ~/Library/Application\ Support/Code/CachedData/*
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*/workspace.json

echo "Caché de VS Code limpiada. Reiniciando VS Code con uso reducido de memoria..."

# Reinicia VS Code con parámetros de optimización de memoria
code --max-memory=4096 --disable-gpu-driver-bug-workarounds &

echo "¡Listo! VS Code debería usar menos memoria ahora."
