# 🚨 Solución Error 500 en Login - Render

## Estado Actual
✅ Frontend → BFF: **FUNCIONANDO** (conectándose correctamente a Render)
❌ BFF → Backend: **FALLANDO** (Error 500 en `/auth/login`)

El BFF no puede comunicarse con el backend. Esto se debe a una de estas causas:

## 🔍 PASO 1: Verificar Logs del BFF en Render

### Ver los Logs del BFF
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio **hogar-ancianos-bff**
3. Click en la pestaña **Logs** (en el menú superior)
4. Busca errores como:
   ```
   Error ECONNREFUSED
   ETIMEDOUT
   Error al conectar con el backend
   No se recibió respuesta del backend
   ```

### Posibles Errores en los Logs

#### Error: "ECONNREFUSED" o "connect ECONNREFUSED"
**Causa**: El BFF no puede conectarse al backend
**Solución**: La variable `API_URL` está mal configurada o el backend está caído

#### Error: "ETIMEDOUT" o "timeout"
**Causa**: El backend tarda demasiado en responder (supera los 10 segundos)
**Solución**: El backend puede estar iniciándose (servicios gratuitos de Render se suspenden tras 15 min)

#### Error: "Cannot read property 'data' of undefined"
**Causa**: El backend responde pero no en el formato esperado
**Solución**: Problema en la ruta del backend `/api/auth/login`

## 🔧 PASO 2: Verificar Variables de Entorno en Render

### Variables del BFF (hogar-ancianos-bff)

1. En Render, ve a tu servicio **hogar-ancianos-bff**
2. Click en **Environment** (menú izquierdo)
3. Verifica que existan estas variables:

```bash
# CRÍTICAS - Sin estas el BFF no funciona
NODE_ENV=production
API_URL=https://tu-backend.onrender.com  # ⚠️ SIN /api al final
JWT_SECRET=el_mismo_secret_que_el_backend

# IMPORTANTES
FRONTEND_URL=https://lamisericordiaapp.vercel.app
PORT=4000
API_TIMEOUT=30000
```

**⚠️ IMPORTANTE: `API_URL`**
- Debe apuntar a la URL del BACKEND (no del BFF)
- NO debe incluir `/api` al final
- Ejemplo correcto: `https://hogar-ancianos-backend.onrender.com`
- Ejemplo incorrecto: `https://hogar-ancianos-backend.onrender.com/api`

### Variables del Backend (hogar-ancianos-backend)

1. Ve al servicio del **backend** en Render
2. Click en **Environment**
3. Verifica estas variables:

```bash
NODE_ENV=production
PORT=3000

# Base de datos PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# O separadas:
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...

# JWT (debe ser el MISMO que en el BFF)
JWT_SECRET=el_mismo_secret_que_el_bff
JWT_EXPIRATION=8h

# CORS (incluir el dominio del BFF)
CORS_ORIGIN=https://hogar-ancianos-bff.onrender.com
```

## 🚀 PASO 3: Verificar Estado de los Servicios

### Verificar que el Backend esté Activo

#### Opción A: Desde el navegador
Abre en otra pestaña:
```
https://tu-backend.onrender.com/health
```

**Respuesta esperada:**
```json
{"status": "UP", "service": "Backend - La Misericordia"}
```

**Si no responde:**
- El backend está suspendido (servicios gratuitos se suspenden)
- Espera 30-60 segundos a que se active
- Refresca la página

#### Opción B: Desde los logs de Render
1. Ve al servicio del **backend**
2. Mira los **Logs**
3. Si ves "Sleeping..." o no hay logs recientes → está suspendido
4. Cualquier petición lo activará (toma ~30 segundos)

### Verificar que el BFF esté Activo

Abre en otra pestaña:
```
https://hogar-ancianos-bff.onrender.com/api/bff/status
```

**Respuesta esperada:**
```json
{
  "status": "UP",
  "service": "BFF - La Misericordia",
  "backend": {"status": "UP"},
  "timestamp": "..."
}
```

## ⚡ PASO 4: Soluciones Rápidas

### Si el backend está suspendido:
1. Actívalo accediendo a: `https://tu-backend.onrender.com/health`
2. Espera 30-60 segundos
3. Intenta el login nuevamente

### Si la variable API_URL está mal:
1. Corrígela en Render (BFF → Environment)
2. El servicio se redespliegará automáticamente (~2-3 minutos)
3. Espera a que termine el despliegue
4. Intenta el login nuevamente

### Si JWT_SECRET no coincide:
1. Usa el mismo secret en BFF y Backend
2. Redesplíega ambos servicios
3. Intenta el login nuevamente

## 📝 Checklist Final

Antes de intentar nuevamente el login, verifica:

- [ ] El backend responde en `/health`
- [ ] El BFF responde en `/api/bff/status`
- [ ] `API_URL` en BFF apunta al backend correcto (sin `/api`)
- [ ] `JWT_SECRET` es el mismo en BFF y Backend
- [ ] Ambos servicios están "Live" (no "Building" o "Suspended")
- [ ] Los logs del BFF no muestran errores de conexión

## 🆘 Si Nada Funciona

Comparte los logs del BFF (últimas 50 líneas) cuando intentas hacer login para que pueda ayudarte mejor.

Específicamente busca líneas que contengan:
- `[BFF Auth] Enviando solicitud`
- `[BFF API] Error`
- `ECONNREFUSED`
- `Error 500`
