# Guía de Verificación del Sistema La Misericordia 2

## Resumen de Cambios

Se ha actualizado el script `gestor_sistema_lm2.sh` para asegurar el correcto funcionamiento en modo producción:

1. Corregidas inconsistencias en los nombres de funciones
   - Estandarizado a español (`iniciar_xxx`, `detener_xxx`, `verificar_xxx`) 
   - Eliminados restos de código JavaScript mezclado con bash

2. Mejorada la estructura del script
   - Función `iniciar_todo` optimizada para modo producción
   - Función `detener_todo` para parar todos los servicios correctamente

3. Agregado manejo robusto de errores 
   - Verificación avanzada de disponibilidad de servicios
   - Tiempos de espera extendidos en modo producción

4. Optimizado el inicio de componentes en modo producción
   - Frontend: build correcto antes de servir
   - Backend y BFF: configuración correcta de NODE_ENV

## Instrucciones para Verificar el Sistema

### Verificación Básica (Recomendada tras cambios)

1. Detener todos los servicios activos:
   ```bash
   ./gestor_sistema_lm2.sh --stop
   ```

2. Iniciar en modo producción:
   ```bash
   ./gestor_sistema_lm2.sh --start-produccion
   ```

3. Verificar que todos los componentes están ejecutándose:
   - PostgreSQL en puerto 5432
   - Backend en puerto 3000
   - BFF en puerto 4000
   - Frontend en puerto 5174

4. Acceder a la interfaz web: http://localhost:5174

### Verificación Avanzada

Para un diagnóstico profundo del sistema, ejecutar:

1. Iniciar el menú interactivo:
   ```bash
   ./gestor_sistema_lm2.sh
   ```

2. Seleccionar la opción 7 (Ejecutar diagnóstico del sistema)

3. Revisar el estado de cada componente y las rutas críticas

## Solución de Problemas

Si algún componente no inicia correctamente:

1. Verificar los logs en el directorio `logs/`:
   - `backend.log` - Mensajes del servidor API
   - `bff.log` - Mensajes del BFF
   - `frontend.log` - Mensajes del frontend

2. Puertos bloqueados: Use la opción de menú "Reparar problemas de rutas" (opción 8)

3. Problemas de base de datos: Use la opción "Gestionar PostgreSQL" (opción 3)
