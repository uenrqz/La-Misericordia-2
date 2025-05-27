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

- **Usuario administrador**: admin
- **Contraseña**: Admin2025!

## Solución de problemas

Si encuentra algún problema al iniciar el sistema:

1. **Verificar que Docker esté en ejecución**
2. **Comprobar puertos disponibles**: 3000 (backend), 4000 (BFF), 5174 (frontend)
3. **Verificar logs**: Los logs detallados aparecen en la consola durante el inicio

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

## Notas importantes para administración

- El sistema ahora está configurado para un entorno de producción 
- La información de diagnóstico solo está disponible para usuarios administradores
- Los usuarios de prueba han sido eliminados, deben crearse usuarios reales a través de la interfaz de administración
- Los archivos de configuración .env.production contienen los ajustes para el entorno de producción
