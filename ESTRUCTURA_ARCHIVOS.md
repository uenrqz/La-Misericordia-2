# Estructura de Archivos del Sistema La Misericordia 2

## Archivos Principales

### Backend
- `backend-server.js` - Punto de entrada principal del backend (anteriormente app.js)
- Iniciado con: `npm start` o `npm run dev` desde /hogar-ancianos-backend

### BFF (Backend For Frontend)
- `src/bff-server.js` - Punto de entrada principal del BFF (anteriormente app.js)
- Iniciado con: `npm start` o `npm run dev` desde /hogar-ancianos-bff

### Frontend
- `src/App.jsx` - Componente principal de React
- Iniciado con: `npm start` o `npm run dev` desde /hogar-ancianos-frontend

## Cambios Recientes

Se han renombrado los archivos `app.js` para evitar confusiones:
- El archivo `app.js` del backend es ahora `backend-server.js`
- El archivo `app.js` del BFF es ahora `bff-server.js`
- El archivo `App.jsx` del frontend mantiene su nombre por convención de React

## Estructura por Componente

### Backend (/hogar-ancianos-backend)
- `backend-server.js` - Servidor Express, configuración y middlewares
- `src/controllers/` - Controladores para las operaciones CRUD
- `src/routes/` - Definiciones de rutas API
- `src/middlewares/` - Middlewares personalizados
- `src/config/` - Configuración de la base de datos y otros servicios

### BFF (/hogar-ancianos-bff)
- `src/bff-server.js` - Servidor Express, configuración y middlewares
- `src/routes/` - Definiciones de rutas API
- `src/services/` - Servicios para comunicación con el backend
- `src/middleware/` - Middlewares personalizados
- `src/config/` - Configuración de la comunicación con el backend

### Frontend (/hogar-ancianos-frontend)
- `src/App.jsx` - Componente principal de React
- `src/components/` - Componentes reutilizables
- `src/pages/` - Páginas o vistas de la aplicación
- `src/services/` - Servicios para comunicación con el BFF
- `src/contexts/` - Contextos de React para manejo de estado global
- `src/assets/` - Recursos estáticos (imágenes, iconos, etc.)
