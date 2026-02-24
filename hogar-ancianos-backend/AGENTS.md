# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Backend system for "Hogar de Ancianos La Misericordia" (elderly care home) in Quetzaltenango, Guatemala. This is a REST API built with Express.js and PostgreSQL that manages residents, medical records, vital signs, medications, donations, and user access control.

## Common Commands

### Development
```bash
npm install                 # Install dependencies
npm run dev                 # Start development server with nodemon
npm start                   # Start production server
```

### Database
```bash
npm run db:setup           # Create PostgreSQL user and database locally
npm run migrate            # Run database migrations (executes scripts/run-migrations.js)
npm run seed               # Load test data (executes scripts/seed_data.js)
npm run setup              # Run migrations and seed data together
npm run db:backup          # Backup database (runs ../backup_database.sh)
```

### Testing
Note: No test framework is currently configured. The `npm test` command will fail with "Error: no test specified".

## Architecture

### Database Layer
- **Two connection methods coexist:**
  - `src/config/database.js` - Sequelize ORM connection (mainly for initialization)
  - `src/config/db.js` - Raw pg Pool connection (used by most controllers)
- **Environment-aware configuration:** Development uses local PostgreSQL (`hogar_db`), production uses Railway with SSL support
- **Migration system:** Custom migration tracker in `scripts/run-migrations.js` maintains a `migraciones` table to prevent duplicate schema applications

### Authentication & Authorization
- **JWT-based authentication** with 8-hour token expiration
- **Middleware:** `src/middlewares/auth.middleware.js` provides:
  - `authenticate(roles)` - Validates JWT and optionally checks roles
  - `hasRole(allowedRoles)` - Standalone role verification
  - `generateToken(userData)` - Creates JWT tokens
- **Roles:** admin, medico, enfermera, cuidador, secretaria, contador
- **Token format:** `Bearer <token>` in Authorization header
- **User payload includes:** id, username, nombre, apellido, rol, email

### Route Structure
Routes are mounted in `backend-server.js` with different base paths:
- `/api/auth` → auth.routes.js
- `/api/residentes` → residentes.routes.js (also mounts signos-vitales, evoluciones, ordenes-medicas as sub-routes)
- `/api/usuarios` → usuarios.routes.js
- `/api/donaciones` → donaciones.routes.js
- `/api/finanzas` → finanzas.routes.js
- `/api/medicamentos` → medicamentos.routes.js
- `/api/actividades` → actividades.routes.js
- `/api/historial-medico` → historial-medico.routes.js

Note: Some routes like signos-vitales, evoluciones, and ordenes-medicas are mounted under `/api/residentes` and typically use `:id` params for resident-specific operations.

### Controller Pattern
Controllers use raw SQL queries with the pg Pool from `src/config/db.js`. They follow this pattern:
- Destructure parameters from req.body, req.params, req.query
- Validate input
- Execute parameterized queries to prevent SQL injection
- Return JSON responses with appropriate status codes
- Handle errors with try/catch and return appropriate error messages

### File Uploads
- **Middleware:** `src/middlewares/upload.middleware.js` handles file uploads
- **Configuration:** 5MB file size limit, stored in `uploads/` directory
- **Accessible via:** Static route `/uploads` configured in backend-server.js

### Startup Sequence
On server start (backend-server.js):
1. Verify database connection
2. Initialize admin users (scripts/crear_usuarios_admin.js)
3. Synchronize roles (scripts/sincronizar_roles.js)
4. In production: Apply additional configuration (src/utils/admin-produccion.js)
5. Start Express server on PORT (default 3000)

### Health Monitoring
- `/health` - Returns service status and database connectivity
- `/api/status` - BFF-specific status endpoint with environment info

## Important Patterns

### Environment Variables
Required in `.env`:
- `PORT` - Server port (default 3000)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL credentials
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Token expiration (default 8h)
- `NODE_ENV` - Set to 'production' for Railway deployment

### Deployment
- **Railway:** Detects PostgreSQL environment variables automatically. Set `NODE_ENV=production` to enable SSL and production configuration
- **Local:** Uses PostgreSQL without SSL, configured via setup scripts in parent directory

### Role-Based Access
When adding protected routes, use the authenticate middleware with allowed roles:
```javascript
router.get('/endpoint', authenticate(['admin', 'medico']), controller.method);
```

### Query Pattern
Most controllers query the database using this pattern:
```javascript
const { pool } = require('../config/db');
const result = await pool.query('SELECT * FROM table WHERE id = $1', [id]);
```

## Key Files
- `backend-server.js` - Application entry point
- `src/config/database.js` - Sequelize configuration (dual-environment)
- `src/config/db.js` - Raw PostgreSQL pool (primary data access)
- `scripts/run-migrations.js` - Custom migration runner with tracking
- `scripts/crear_usuarios_admin.js` - Admin user initialization
- `scripts/sincronizar_roles.js` - Role synchronization utility
