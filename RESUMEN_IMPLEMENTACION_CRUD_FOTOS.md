# Sistema CRUD LA MISERICORDIA 2 con gestión de fotos

## Resumen de implementación

Este documento resume la implementación del sistema CRUD para La Misericordia 2, con la adición de funcionalidad para subir, actualizar y eliminar fotos de residentes.

## Componentes implementados

### 1. Base de datos
- Tabla `ancianos` actualizada con el campo `foto_url VARCHAR(255)`
- Script de migración para agregar el campo a la tabla existente

### 2. Backend
- Middleware para manejo de archivos utilizando multer
- APIs RESTful para gestión de fotos
- Configuración de carpeta `uploads` para almacenamiento
- Implementación de eliminación de fotos antiguas al actualizarlas

### 3. BFF (Backend for Frontend)
- Servicio para manejo de fotos desde el frontend
- Transformación de datos y formato para API

### 4. Frontend
- Componentes para visualizar fotos de residentes
- Interfaz de usuario para carga y gestión de fotos
- Validación de formatos y tamaños de archivo

### 5. Sistema de inicio unificado
- Script para validar todos los componentes
- Inicialización de la base de datos con migración para fotos
- Verificación de permisos de directorio `uploads`

## Detalles técnicos

### Endpoints implementados
- `POST /api/residentes/:id/foto` - Subir/actualizar foto
- `DELETE /api/residentes/:id/foto` - Eliminar foto
- `GET /api/residentes/:id` - Obtener datos del residente (incluye foto_url)
- `GET /api/residentes` - Listar residentes (incluye foto_url)

### Servicios BFF
- `POST /api/bff/residentes/:id/foto` - Proxy para la API del backend
- `DELETE /api/bff/residentes/:id/foto` - Proxy para la API del backend

### Validaciones implementadas
- Solo se aceptan archivos de imagen (jpg, png, gif, webp)
- Tamaño máximo de archivo: 5MB
- Solo usuarios con roles 'admin' o 'secretaria' pueden gestionar fotos

## Funcionamiento del sistema de archivos

- Las fotos se almacenan en `hogar-ancianos-backend/uploads/`
- Los nombres de archivo se generan automáticamente para evitar colisiones
- Las fotos antiguas se eliminan automáticamente al actualizarlas
- Las URLs de las fotos son relativas al servidor para portabilidad

## Mejoras realizadas al script de inicio del sistema

1. **Verificación mejorada de dependencias**:
   - Docker y su funcionamiento
   - PostgreSQL en contenedor
   - Puertos necesarios

2. **Gestión automática de migraciones**:
   - Aplicación del script para campo foto_url
   - Manejo de errores si la columna ya existe

3. **Verificación de directorio uploads**:
   - Creación automática si no existe
   - Verificación de permisos de escritura
   - Corrección automática de permisos

4. **Gestión mejorada de errores**:
   - Mensajes claros y descriptivos
   - Códigos de salida adecuados
   - Instrucciones para corrección manual en caso necesario

## Pruebas realizadas

- Subida de fotos de diferentes formatos y tamaños
- Actualización de fotos existentes
- Eliminación de fotos
- Visualización correcta en el frontend
- Persistencia después de reiniciar el sistema
- Control de acceso según roles de usuario

## Notas importantes

1. **Directorio uploads**: Debe tener permisos de escritura para el usuario que ejecuta el backend.
2. **Base de datos**: La migración se aplica automáticamente si es necesaria.
3. **Configuración**: El tamaño máximo de foto se puede ajustar en `upload.middleware.js`.

## Próximos pasos sugeridos

1. Implementar optimización de imágenes (redimensionamiento automático)
2. Añadir validación adicional de tipos MIME para mayor seguridad
3. Considerar almacenamiento en la nube para escalabilidad futura

---

Implementación completada el 27 de mayo de 2025
