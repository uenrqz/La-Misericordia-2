# Migración de PostgreSQL en Docker a PostgreSQL Local

## Resumen de Cambios

Se ha migrado el proyecto "La Misericordia 2" para utilizar PostgreSQL instalado localmente en macOS en lugar de depender de Docker. Se han realizado las siguientes modificaciones:

### 1. Scripts Modificados

- **iniciar-todo.sh**: Actualizado para usar PostgreSQL local en lugar de iniciar un contenedor Docker.
- **iniciar_sistema_unificado.sh**: Modificado para verificar y gestionar PostgreSQL local.
- **app.js** (Backend): Mejorada la gestión de conexiones a PostgreSQL y añadido cierre gracioso de conexiones.

### 2. Nuevos Scripts Creados

- **verificar_postgres_local.sh**: Verifica la correcta conexión a PostgreSQL local desde varios puntos.
- **preparar_railway.sh**: Prepara el proyecto para despliegue en la plataforma Railway.
- **RAILWAY_CONFIG.md**: Documentación para el despliegue en Railway.

### 3. Mejoras Implementadas

- **Gestión de conexiones**: Se ha mejorado el manejo de conexiones a PostgreSQL local.
- **Verificación de salud**: Se han mejorado los endpoints de health/status para verificar la conexión a la base de datos.
- **Cierre gracioso**: Se ha añadido manejo de señales SIGINT para cerrar conexiones a la base de datos adecuadamente.
- **Preparación para Railway**: Se han generado archivos de configuración y scripts para facilitar el despliegue en Railway.

## Instrucciones para Usar PostgreSQL Local

1. Ejecuta `./configurar_postgres_local.sh` para instalar y configurar PostgreSQL local (si aún no lo has hecho).
2. Usa `./verificar_postgres_local.sh` para comprobar que la conexión a PostgreSQL funciona correctamente.
3. Inicia el sistema con `./iniciar-todo.sh` o `./iniciar_sistema_unificado.sh`.

## Instrucciones para Despliegue en Railway

1. Ejecuta `./preparar_railway.sh` para preparar los tres componentes para Railway.
2. Sigue las instrucciones en `RAILWAY_CONFIG.md` para realizar el despliegue.
3. Asegúrate de configurar correctamente las variables de entorno en Railway según la documentación.

---

Todos los componentes del sistema (Backend, BFF y Frontend) están ahora configurados para trabajar con PostgreSQL local, y preparados para un eventual despliegue en Railway.
