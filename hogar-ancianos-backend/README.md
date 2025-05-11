# Hogar de Ancianos "La Misericordia" - Backend

Backend para el sistema de gestión del Hogar de Ancianos "La Misericordia" en Quetzaltenango. Este sistema permite administrar residentes, registrar signos vitales, controlar medicamentos, gestionar donaciones y más.

## Características principales

- Gestión completa de residentes (ancianos)
- Registro de signos vitales y monitoreo de salud
- Control de medicamentos y órdenes médicas
- Seguimiento de evoluciones médicas
- Gestión de donaciones (monetarias y en especie)
- Generación de reportes para SAT
- Autenticación y control de acceso basado en roles

## Requisitos

- Node.js (v14 o superior)
- PostgreSQL (v13 o superior)
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/uenrqz/La-Misericordia-2
cd hogar-ancianos-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
# Puerto del servidor
PORT=3000

# Configuración de base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=hogar_user
DB_PASSWORD=securepass
DB_NAME=hogar_db

# JWT Secret para autenticación
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRATION=8h

# Otras configuraciones
NODE_ENV=development
```

### 4. Crear la base de datos

Puedes usar Docker para crear una instancia de PostgreSQL:

```bash
docker compose up -d
```

O ejecutar manualmente el script SQL:

```bash
psql -U postgres -f scripts/init_db.sql
```

### 5. Ejecutar migraciones

```bash
node scripts/run-migrations.js
```

### 6. Cargar datos de prueba (opcional)

```bash
node scripts/seed_data.js
```

### 7. Iniciar el servidor

```bash
npm start
```

Para desarrollo:

```bash
npm run dev
```

## Uso de APIs con Postman

El backend está diseñado como un conjunto de APIs RESTful que pueden ser consumidas por cualquier cliente (frontend web, aplicación móvil, etc.). Se incluye una colección de Postman para facilitar las pruebas.

### Importar colección en Postman

1. Abre Postman
2. Haz clic en "Import" (botón en la parte superior)
3. Selecciona el archivo `postman_collection.json` ubicado en la raíz del proyecto
4. Una vez importada, verás la colección "Hogar de Ancianos La Misericordia" en el panel izquierdo

### Configuración de variables

La colección utiliza dos variables principales:
- `base_url`: URL base del servidor (por defecto: http://localhost:3000)
- `token`: Token JWT obtenido después del login

Para configurar estas variables:
1. Haz clic en el nombre de la colección
2. Ve a la pestaña "Variables"
3. Asegúrate que `base_url` esté configurado correctamente según tu entorno

### Autenticación

1. Primero ejecuta la solicitud "Login" en la carpeta "Autenticación" usando las credenciales:
   - Email: admin@lamisericordia.org
   - Password: admin123

2. El servidor responderá con un token JWT. Postman automáticamente guardará este token en la variable `{{token}}` gracias a los scripts de prueba incluidos.

3. Todas las demás solicitudes utilizarán automáticamente este token en sus cabeceras.

### Probar APIs

Las APIs están organizadas en carpetas según su funcionalidad:

- **Residentes**: Gestión de información de ancianos
- **Signos Vitales**: Registro y consulta de signos vitales
- **Órdenes Médicas**: Gestión de medicamentos y tratamientos
- **Evoluciones**: Seguimiento médico y notas de evolución
- **Donaciones**: Registro y gestión de donaciones

Cada solicitud incluye:
- Ejemplo de cuerpo de la solicitud (para POST/PUT)
- Descripción de su función
- Parámetros necesarios

## Roles y permisos

El sistema implementa los siguientes roles:

- **admin**: Acceso completo a todas las funcionalidades
- **medico**: Acceso a expedientes, signos vitales, evoluciones y órdenes médicas
- **enfermera**: Registro de signos vitales y administración de medicamentos
- **administrativo**: Gestión de residentes e información general
- **contador**: Acceso a donaciones y reportes financieros

## Estructura de carpetas

```
├── app.js                # Punto de entrada de la aplicación
├── docker-compose.yml    # Configuración de Docker
├── package.json          # Dependencias y scripts
├── scripts/              # Scripts de inicialización y migraciones
│   ├── init_db.sql       # Esquema inicial de base de datos
│   ├── run-migrations.js # Script para ejecutar migraciones
│   ├── schema_updates.sql# Actualizaciones del esquema
│   └── seed_data.js      # Datos iniciales de prueba
└── src/
    ├── config/           # Configuraciones generales
    ├── controllers/      # Controladores de rutas
    ├── middlewares/      # Middlewares (auth, validación)
    ├── models/           # Modelos de datos
    ├── routes/           # Definición de rutas
    └── services/         # Lógica de negocio
```

## Endpoints principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Residentes
- `GET /api/residentes` - Listar residentes
- `GET /api/residentes/:id` - Obtener residente por ID
- `POST /api/residentes` - Crear nuevo residente
- `PUT /api/residentes/:id` - Actualizar residente

### Signos Vitales
- `GET /api/residentes/:id/signos-vitales` - Obtener historial de signos
- `POST /api/residentes/:id/signos-vitales` - Registrar nuevos signos
- `GET /api/residentes/:id/signos-vitales/estadisticas` - Obtener estadísticas

### Donaciones
- `GET /api/donaciones` - Listar donaciones
- `POST /api/donaciones` - Registrar nueva donación
- `GET /api/donaciones/informe-sat` - Generar informe para SAT

## Desarrollo

### Ejecutar pruebas

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Licencia

Este proyecto es privado y pertenece al Hogar de Ancianos "La Misericordia" de Quetzaltenango.