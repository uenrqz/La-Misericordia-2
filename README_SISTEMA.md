# Sistema de Gestión LA MISERICORDIA 2

## Sistema CRUD completo con gestión de fotos para residentes

Este sistema permite la administración completa del hogar de ancianos LA MISERICORDIA 2, incluyendo la gestión de residentes, usuarios, historiales médicos y más. Se ha implementado un sistema CRUD completo con la capacidad de subir, actualizar y eliminar fotos de los residentes.

## Requisitos del sistema

- **Node.js** (v16.x o superior)
- **Docker** (última versión)
- Sistema operativo: MacOS, Linux o Windows con WSL
- 4GB de RAM libre (mínimo)
- 1GB de espacio en disco (mínimo)

## Componentes del sistema

1. **Backend**: API RESTful con Node.js y Express
   - Puerto: 3000
   - Gestión de bases de datos PostgreSQL
   - Manejo de archivos y fotos
   - Autenticación y autorización

2. **BFF (Backend for Frontend)**: Capa intermedia para el frontend
   - Puerto: 4000
   - Transformación de datos
   - Gestión de sesiones
   - Enrutamiento de peticiones

3. **Frontend**: Interfaz de usuario con React
   - Puerto: 5174
   - Interfaz responsiva
   - Gestión de residentes con fotos
   - Panel de administración

4. **Base de datos**: PostgreSQL en contenedor Docker
   - Puerto: 5432

## Iniciar el sistema

El sistema cuenta con un script unificado que verifica, inicializa y ejecuta todos los componentes en el orden correcto:

```bash
./iniciar-sistema.sh
```

Este comando realizará las siguientes acciones:

1. Verificar que Docker esté instalado y en ejecución
2. Iniciar o verificar el contenedor de PostgreSQL
3. Aplicar migraciones necesarias a la base de datos
4. Iniciar el backend en modo desarrollo
5. Iniciar el BFF en modo desarrollo
6. Iniciar el frontend en modo desarrollo
7. Mostrar las URLs de acceso a cada componente

## Credenciales por defecto

Una vez iniciado el sistema, puede acceder con las siguientes credenciales:

- **Usuario**: admin
- **Contraseña**: Admin2025!

## Funcionalidades principales

### Gestión de residentes
- Crear, editar, eliminar y ver residentes
- Subir, actualizar y eliminar fotos de residentes
- Filtrar residentes por edad o nombre

### Gestión de usuarios
- Administración de roles (admin, médico, cuidador, secretaria)
- Control de acceso según rol

### Historiales médicos
- Registro de signos vitales
- Órdenes médicas
- Evoluciones médicas

### Gestión financiera
- Control de donaciones
- Reporte de finanzas

## Solución de problemas comunes

### Error al iniciar Docker
Si Docker no se inicia automáticamente, inténtelo manualmente:
```bash
open -a Docker
```

### Error de puertos ocupados
El sistema intentará liberar los puertos necesarios automáticamente. Si esto falla:
```bash
lsof -i:3000 -i:4000 -i:5174 -i:5432
```
Luego cierre las aplicaciones que estén usando esos puertos.

### Error de conexión a la base de datos
Si hay problemas con la conexión a PostgreSQL, intente reiniciar el contenedor:
```bash
docker restart hogar-ancianos-backend-db-1
```

## Desarrollo y mantenimiento

Para contribuir al desarrollo de este sistema:
1. Clone el repositorio
2. Instale las dependencias en cada proyecto
3. Siga las directrices de estilo y arquitectura en cada subdirectorio

## Estructura del proyecto
```
LA MISERICORDIA 2/
├── iniciar-sistema.sh           # Script de inicio único
├── iniciar-sistema.js           # Script de Node.js para inicialización
├── hogar-ancianos-backend/      # Backend del sistema
│   ├── app.js                   # Entrada principal del backend
│   ├── docker-compose.yml       # Configuración del contenedor PostgreSQL
│   ├── scripts/                 # Scripts de migraciones y semillas
│   │   └── add_photo_field.sql  # Migración para el campo de foto
│   ├── src/                     # Código fuente del backend
│   │   ├── controllers/         # Controladores (MVC)
│   │   ├── middlewares/         # Middlewares (auth, upload, etc.)
│   │   ├── routes/              # Definición de rutas API 
│   │   └── config/              # Configuraciones
│   └── uploads/                 # Directorio para almacenar fotos
├── hogar-ancianos-bff/          # Capa BFF
│   ├── src/                     # Código fuente del BFF
│   │   ├── services/            # Servicios para comunicarse con backend
│   │   └── routes/              # Rutas BFF
└── hogar-ancianos-frontend/     # Frontend del sistema
    └── src/                     # Código fuente del frontend
        ├── components/          # Componentes React
        ├── pages/               # Páginas del sistema
        └── services/            # Servicios API
```

## Licencia
Este software es propiedad de La Misericordia 2 y no está disponible para distribución pública.

## Soporte
Para soporte técnico, contacte a:
- Soporte: soporte@lamisericordia2.org
- Teléfono: (555) 123-4567

---

Desarrollado por el equipo de La Misericordia 2 - © 2025
