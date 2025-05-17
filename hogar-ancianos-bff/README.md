# BFF para La Misericordia

Este Backend For Frontend (BFF) sirve como capa intermedia entre el frontend de La Misericordia y su backend, optimizando las llamadas a la API y agregando una capa adicional de seguridad.

## Características

- Autenticación mediante token JWT
- Optimización de múltiples llamadas al backend en una sola respuesta
- Manejo de roles y permisos
- Proxy para APIs no específicas del BFF

## Requisitos

- Node.js 16.x o superior
- NPM 8.x o superior

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto (o modifica el existente):

```
# Puerto donde se ejecutará el BFF
PORT=4000

# URL del backend
API_URL=http://localhost:3000

# Clave secreta para los tokens JWT
JWT_SECRET=tu_clave_secreta

# Tiempo de expiración de tokens
JWT_EXPIRATION=8h
```

## Ejecución

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

## Arquitectura

El BFF está estructurado en las siguientes carpetas:

- **src/config**: Configuración de conexiones y servicios
- **src/middleware**: Middlewares de Express (autenticación, logging, etc.)
- **src/routes**: Endpoints del BFF
- **src/services**: Lógica de negocio y comunicación con el backend

## Flujo de Autenticación

1. El cliente envía credenciales al BFF
2. El BFF reenvía estas credenciales al backend
3. Si son válidas, el backend devuelve un token
4. El BFF genera un nuevo token (token BFF) que encapsula el token del backend
5. El cliente usa este token BFF para las siguientes solicitudes

## Endpoints Principales

- **POST /api/bff/auth/login**: Autenticación de usuarios
- **GET /api/bff/auth/verify**: Verificación de token
- **GET /api/bff/dashboard**: Datos consolidados para el dashboard
- **GET /api/bff/residentes**: Lista de residentes
- **GET /api/bff/residentes/:id**: Datos completos de un residente
