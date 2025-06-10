# Configuración de Railway para La Misericordia 2

## Configuración de Servicios

Este archivo contiene la información necesaria para desplegar el sistema en Railway.

### 1. Servicios a Desplegar

- **Backend**: API REST que gestiona la lógica principal y conexión a la base de datos
- **BFF**: Backend-for-Frontend que sirve de intermediario entre el frontend y el backend
- **Frontend**: Interfaz de usuario construida con React y Tailwind CSS

### 2. Variables de Entorno para Railway

#### Backend
```
DB_HOST=${PGHOST}
DB_PORT=${PGPORT}
DB_USER=${PGUSER}
DB_PASSWORD=${PGPASSWORD}
DB_NAME=${PGDATABASE}
DB_SSL=true
NODE_ENV=production
PORT=${PORT}
CORS_ORIGIN=*
JWT_SECRET=hogar_misericordia_jwt_secret_2025
```

#### BFF
```
PORT=${PORT}
API_URL=${BACKEND_URL}
NODE_ENV=production
API_TIMEOUT=30000
```

#### Frontend
```
VITE_API_URL=${BFF_URL}
VITE_NODE_ENV=production
```

### 3. Comando de Despliegue

Para cada servicio en Railway, utiliza el siguiente comando de inicio:

- **Backend**: `npm run railway`
- **BFF**: `npm run railway`
- **Frontend**: `npm run railway`

### 4. Base de Datos

Utiliza el plugin de PostgreSQL proporcionado por Railway. Las variables de entorno se configurarán automáticamente.

### 5. Ramas y Despliegues

Se recomienda configurar los despliegues automáticos desde la rama principal de cada repositorio.

### 6. Orden de Despliegue

1. Desplegar la base de datos (plugin PostgreSQL)
2. Desplegar el Backend
3. Desplegar el BFF (usando la URL del Backend)
4. Desplegar el Frontend (usando la URL del BFF)

### 7. Dominios Personalizados

Después de verificar que todo funciona correctamente, configura dominios personalizados para cada servicio según sea necesario.

---

Para más información sobre Railway, consulta [la documentación oficial](https://docs.railway.app/).
