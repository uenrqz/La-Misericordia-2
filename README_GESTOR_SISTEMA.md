# Resumen de cambios en el sistema La Misericordia 2

## Script unificado de gestión

Se ha creado un nuevo script unificado llamado `gestor_sistema_lm2.sh` que simplifica la administración del sistema La Misericordia 2. Este script reemplaza a todos los scripts de inicio anteriores y proporciona una interfaz interactiva para gestionar todos los componentes del sistema.

## Características principales

- **Interfaz interactiva** con menú de opciones.
- **Gestión completa de PostgreSQL local** (iniciar, detener, configurar).
- **Gestión del Backend, BFF y Frontend** (iniciar, detener, reiniciar, ver logs).
- **Diagnóstico del sistema** para verificar el estado de los servicios y componentes.
- **Reparación de problemas comunes** (rutas, permisos, archivos de configuración).
- **Soporte para modos de desarrollo y producción**.
- **Detección y gestión automática de dependencias y servicios**.
- **Gestión de puertos e inicios de servicios en el orden correcto**.
- **Corrección automática de problemas del frontend** (AuthContext).

## Uso del script

1. Ejecute `./gestor_sistema_lm2.sh` desde la carpeta raíz del proyecto.
2. Seleccione una opción del menú interactivo:
   - Opción 1: Iniciar todo el sistema (PostgreSQL, Backend, BFF, Frontend)
   - Opción 2: Detener todos los servicios
   - Opciones 3-6: Gestionar cada componente individualmente
   - Opción 7: Ejecutar diagnóstico del sistema
   - Opción 8: Reparar problemas de rutas y configuración
   - Opción 9: Cambiar entre modo desarrollo y producción

## Beneficios

- Simplifica la administración del sistema.
- Reduce los errores al gestionar múltiples componentes.
- Mejora la experiencia de desarrollo y despliegue.
- Soluciona automáticamente problemas comunes.
- Proporciona información clara sobre el estado del sistema.
- Facilita la transición entre entornos de desarrollo y producción.

---

*Nota: Este script está diseñado para macOS y utiliza PostgreSQL local en lugar de Docker.*
