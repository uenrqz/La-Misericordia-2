# Optimización de Recursos del Proyecto "La Misericordia 2"

Este documento proporciona instrucciones para optimizar el uso de recursos y espacio en disco del proyecto.

## Resumen de las carpetas no esenciales

El proyecto contiene varias carpetas que no son esenciales para su funcionamiento:

- `/UMG/5to` 
- `/semestre/PROGRA`
- `/ASILO/LA`
- `/MISERICORDIA`
- `/2/logs`
- `/3/APP`

Estas carpetas parecen ser artefactos de la estructura de directorios universitarios y no contienen código relevante para el proyecto.

## Scripts de Mantenimiento

### 1. Limpieza de Carpetas Vacías

Ejecuta el siguiente script para eliminar carpetas vacías y no esenciales:

```bash
./limpiar_carpetas_vacias.sh
```

### 2. Limpieza de Caché de VS Code

Para optimizar el uso de memoria de VS Code:

```bash
./limpiar_cache_vscode.sh
```

## Optimizaciones Adicionales

### Optimizar Node Modules

Para cada uno de los tres proyectos (backend, bff, frontend), puedes reducir el tamaño de las dependencias:

```bash
# En cada carpeta del proyecto (después del desarrollo)
npm prune --production
```

### Optimizar Git

Para reducir el tamaño del historial de Git:

```bash
git gc --aggressive
```

### Configuraciones de VS Code Recomendadas

Para reducir el uso de memoria de VS Code, añade esta configuración a tu `settings.json`:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/logs/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true
  },
  "editor.formatOnSave": false,
  "window.memoryLimit": 2048
}
```

## Impacto Esperado

La eliminación de carpetas innecesarias y la limpieza de caché de VS Code debería resultar en:

1. Reducción moderada del espacio en disco (~5-20 MB)
2. Mejora en la claridad de la estructura del proyecto
3. Reducción significativa del uso de memoria de VS Code
4. Mejor rendimiento general durante el desarrollo

## Consideraciones

Antes de eliminar cualquier carpeta, asegúrate de que:

1. No hay referencias a estas carpetas en el código
2. No se utilizan en procesos de CI/CD o despliegue
3. Se ha creado un respaldo reciente del proyecto

Si tienes dudas sobre alguna carpeta específica, es mejor mantenerla hasta confirmar que es seguro eliminarla.
