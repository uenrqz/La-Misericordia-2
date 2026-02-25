# Configuración de Variables de Entorno en Vercel

## Problema Resuelto
El error 405 (Method Not Allowed) se debía a que el frontend intentaba hacer peticiones a rutas relativas en Vercel (`/api/bff/*`) en lugar de apuntar directamente al BFF en Render.

## Solución Implementada
Se corrigieron todos los archivos para usar la variable `VITE_BFF_URL` que apunta directamente a tu BFF en Render.

## ⚠️ PASO CRÍTICO: Configurar Variable de Entorno en Vercel

**Debes hacer esto ANTES de que Vercel despliegue los nuevos cambios:**

### 1. Ir al Dashboard de Vercel
- Ve a https://vercel.com/dashboard
- Selecciona tu proyecto (lamisericordiaapp)

### 2. Configurar la Variable de Entorno
- Ve a **Settings** → **Environment Variables**
- Agrega una nueva variable:
  ```
  Nombre: VITE_BFF_URL
  Valor: https://hogar-ancianos-bff.onrender.com
  ```
  (Reemplaza con la URL real de tu BFF en Render)
  
- Selecciona los entornos: **Production**, **Preview**, **Development**
- Haz clic en **Save**

### 3. Re-desplegar el Proyecto
Después de configurar la variable, necesitas forzar un nuevo despliegue:

**Opción A - Desde el Dashboard de Vercel:**
- Ve a **Deployments**
- Encuentra el último despliegue
- Haz clic en los 3 puntos → **Redeploy**

**Opción B - Desde Git:**
```bash
git commit --allow-empty -m "Trigger Vercel redeploy with env vars"
git push
```

## Variables de Entorno en Render (BFF)

Verifica que tu BFF en Render tenga estas variables:

```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://lamisericordiaapp.vercel.app
BACKEND_URL=https://tu-backend.onrender.com
JWT_SECRET=tu_secret_aqui
```

## Verificación

Una vez redespliegues, verifica en la consola del navegador:
1. Deberías ver: `🔧 API Service - URL configurada: https://hogar-ancianos-bff.onrender.com/api/bff`
2. Las peticiones deberían ir a `hogar-ancianos-bff.onrender.com` NO a `lamisericordiaapp.vercel.app`

## Archivos Corregidos

- ✅ `src/services/api.service.js` - Servicio principal de API
- ✅ `src/utils/errorHandler.js` - Manejo de errores
- ✅ `src/contexts/SystemContext.jsx` - Contexto del sistema
- ✅ `src/components/SystemDiagnosticAdvanced.jsx` - Diagnóstico del sistema
- ✅ `vercel.json` - Headers CORS
- ✅ `hogar-ancianos-bff/src/app.js` - CORS del BFF

## Notas Importantes

⚠️ **Las variables VITE_* solo funcionan en tiempo de BUILD, no en tiempo de ejecución**
   - Por eso es crítico configurarlas en Vercel ANTES de desplegar
   - Si agregas/cambias variables de entorno, SIEMPRE re-despliega el proyecto

⚠️ **URLs de Render**
   - Asegúrate de usar la URL correcta de tu servicio en Render
   - Verifica que el servicio esté activo (los servicios gratuitos de Render se suspenden tras 15 min de inactividad)
