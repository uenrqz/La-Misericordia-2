# Guía de Despliegue - Sistema LA MISERICORDIA 2 (Producción)

## Requisitos previos

1. **Software necesario**:
   - Node.js v18 o superior
   - Docker y Docker Compose
   - PostgreSQL (a través de Docker)

2. **Configuración completada**:
   - El sistema está completamente configurado para modo producción
   - Base de datos PostgreSQL configurada y lista para usar
   - Autenticación preparada con credenciales de administrador seguras

## Instrucciones de inicio

### Método 1: Script automatizado (Recomendado)

1. **Ejecutar el script de inicio en modo producción**:
   ```bash
   ./iniciar_produccion.sh
   ```
   Este script realizará automáticamente:
   - Verificar que Docker esté en ejecución
   - Iniciar el contenedor de PostgreSQL
   - Ejecutar las migraciones necesarias
   - Iniciar todos los componentes del sistema en modo producción

2. **Acceder al sistema**:
   Una vez iniciado, acceda a través de un navegador web:
   - URL: `http://localhost:5174`
   - Usuario: `admin`
   - Contraseña: `Admin2025!`

### Método 2: Inicio manual

1. **Iniciar PostgreSQL**:
   ```bash
   cd hogar-ancianos-backend
   docker-compose up -d
   ```

2. **Ejecutar migraciones**:
   ```bash
   cd hogar-ancianos-backend
   node scripts/run-migrations.js
   ```

3. **Iniciar el sistema completo**:
   ```bash
   NODE_ENV=production node iniciar-sistema.js
   ```

## Credenciales de acceso

- **Usuario administrador**: 
- **Contraseña**:

## Solución de problemas

Si encuentra algún problema al iniciar el sistema:

1. **Verificar que Docker esté en ejecución**
2. **Comprobar puertos disponibles**: 3000 (backend), 4000 (BFF), 5174 (frontend)
3. **Verificar logs**: Los logs detallados aparecen en la consola durante el inicio
4. **Ejecutar script de verificación**: Para verificar que la estructura de directorios es correcta:
   ```bash
   ./scripts-respaldo/verificar-reorganizacion.sh
   ```
5. **Completar la reorganización**: Si aún hay archivos pendientes por reorganizar:
   ```bash
   ./scripts-respaldo/completar-reorganizacion.sh
   ```

## Usuario administrador para producción

- **Usuario**: admin
- **Contraseña**: Admin2025!

## Cómo iniciar el sistema

1. Ejecutar el script de inicio:
   ```
   ./iniciar_sistema.sh
   ```

2. Una vez iniciado, acceder a la interfaz web:
   - URL: http://localhost:5173
   - Usar las credenciales de administrador mencionadas arriba

3. Antes de iniciar el sistema por primera vez en producción:
   - Ejecutar el script SQL de creación de administrador:
   ```
   psql -U su_usuario -d nombre_db -f hogar-ancianos-backend/scripts/admin_produccion.sql
   ```

## Estructura de directorios del proyecto

La estructura del proyecto ha sido reorganizada para mayor claridad:

```
/
├── iniciar-sistema.js         # Script principal de inicio
├── iniciar-sistema.sh         # Script de shell para iniciar sistema
├── README.md                  # Este archivo
├── README_SISTEMA.md          # Documentación general del sistema
├── produccion/                # Archivos específicos para producción
│   └── iniciar_produccion.sh  # Script de inicio para producción
└── scripts-respaldo/          # Scripts y archivos auxiliares
    ├── admin_tools/           # Herramientas de administración
    ├── debug_tools/           # Herramientas de depuración
    ├── documentacion/         # Archivos de documentación
    ├── html_auxiliares/       # Archivos HTML auxiliares
    ├── pruebas/               # Scripts de prueba
    └── scripts-verificacion/  # Scripts de verificación del sistema
```

> **Nota**: Los enlaces simbólicos a `GUIA_VERIFICACION_SISTEMA.md` e `iniciar_produccion.sh` están disponibles en el directorio raíz para facilitar el acceso.

Para una explicación detallada sobre la estructura de directorios y el propósito de cada carpeta, consulte el archivo:
[`scripts-respaldo/documentacion/ESTRUCTURA_DIRECTORIOS.md`](./scripts-respaldo/documentacion/ESTRUCTURA_DIRECTORIOS.md)

## Notas importantes para administración

- El sistema ahora está configurado para un entorno de producción 
- La información de diagnóstico solo está disponible para usuarios administradores
- Los usuarios de prueba han sido eliminados, deben crearse usuarios reales a través de la interfaz de administración
- Los archivos de configuración .env.production contienen los ajustes para el entorno de producción