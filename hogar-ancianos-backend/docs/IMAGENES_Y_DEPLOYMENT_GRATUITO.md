# 📸 MANEJO DE IMÁGENES Y 🚀 DEPLOYMENT GRATUITO

## Hogar de Ancianos "La Misericordia"

---

## 📸 PARTE 1: MANEJO DE IMÁGENES

### 🎯 OPCIONES PARA ALMACENAR IMÁGENES

#### ❌ **OPCIÓN 1: Base de Datos (NO RECOMENDADO)**
```sql
-- NO HACER ESTO
ALTER TABLE ancianos ADD COLUMN foto BYTEA;
```

**Desventajas:**
- ❌ Base de datos muy pesada
- ❌ Backups lentos
- ❌ Consultas lentas
- ❌ Difícil de escalar
- ❌ Costo de almacenamiento alto

---

#### ✅ **OPCIÓN 2: Almacenamiento en Servidor (ACTUAL - TEMPORAL)**

**Estado actual:**
```javascript
// backend-server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**Estructura:**
```
hogar-ancianos-backend/
└── uploads/
    └── residentes/
        ├── resident-1234567890-image.jpg
        ├── resident-1234567891-image.png
        └── ...
```

**Ventajas:**
- ✅ Simple de implementar
- ✅ Sin costos externos
- ✅ Control total

**Desventajas:**
- ❌ No escalable
- ❌ Se pierde si el servidor falla
- ❌ Ocupa espacio del servidor
- ❌ No hay CDN (carga lenta para usuarios lejanos)

---

#### ⭐ **OPCIÓN 3: Cloudinary (RECOMENDADO - GRATUITO)**

**Plan Gratuito:**
- ✅ 25 GB almacenamiento
- ✅ 25 GB ancho de banda/mes
- ✅ 25,000 transformaciones/mes
- ✅ CDN global (carga rápida)
- ✅ Optimización automática
- ✅ Redimensionamiento automático
- ✅ Respaldo automático

**Implementación:**

##### 1. **Registrarse en Cloudinary**
```
https://cloudinary.com/users/register/free
```

##### 2. **Instalar dependencias**
```bash
npm install cloudinary multer-storage-cloudinary
```

##### 3. **Configurar Cloudinary**
```javascript
// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'misericordia/residentes',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

module.exports = { cloudinary, storage };
```

##### 4. **Actualizar middleware de upload**
```javascript
// src/middlewares/upload.middleware.js
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
```

##### 5. **Actualizar controlador**
```javascript
// src/controllers/residentes.controller.js
exports.uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó imagen' });
    }

    // Cloudinary ya subió la imagen, solo guardamos la URL
    const fotoUrl = req.file.path; // URL de Cloudinary
    
    await db.query(
      'UPDATE ancianos SET foto_url = $1 WHERE id = $2',
      [fotoUrl, id]
    );

    res.json({ 
      message: 'Foto actualizada',
      url: fotoUrl
    });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ message: 'Error al subir foto' });
  }
};
```

##### 6. **Variables de entorno**
```bash
# .env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

#### ⭐ **OPCIÓN 4: Supabase Storage (ALTERNATIVA GRATUITA)**

**Plan Gratuito:**
- ✅ 1 GB almacenamiento
- ✅ 2 GB ancho de banda/mes
- ✅ CDN global
- ✅ PostgreSQL incluido (podrías migrar toda la DB)

**Implementación:**
```bash
npm install @supabase/supabase-js
```

```javascript
// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function uploadImage(file, residentId) {
  const fileName = `residentes/${residentId}-${Date.now()}.${file.mimetype.split('/')[1]}`;
  
  const { data, error } = await supabase.storage
    .from('fotos-residentes')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('fotos-residentes')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

module.exports = { supabase, uploadImage };
```

---

### 📊 COMPARACIÓN DE OPCIONES

| Característica | Local | Cloudinary | Supabase |
|---------------|-------|------------|----------|
| **Costo** | $0 | $0 (25GB) | $0 (1GB) |
| **Almacenamiento** | Limitado | 25 GB | 1 GB |
| **CDN Global** | ❌ | ✅ | ✅ |
| **Optimización** | Manual | Automática | Manual |
| **Redimensionar** | Manual | Automático | Manual |
| **Respaldo** | Manual | Automático | Automático |
| **Escalabilidad** | ❌ | ✅ | ✅ |
| **Facilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### 🏆 RECOMENDACIÓN: **Cloudinary**
- Más generoso en espacio (25GB vs 1GB)
- Transformaciones automáticas
- Optimización de imágenes
- CDN global incluido
- Perfecto para fotos de residentes

---

## 🚀 PARTE 2: DEPLOYMENT GRATUITO

### 🎯 ARQUITECTURA DE DEPLOYMENT

```
┌─────────────────────────────────────────────────┐
│                  INTERNET                        │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐           ┌──────────────────┐
│   FRONTEND   │           │      BFF         │
│   (Vercel)   │───────────│   (Railway)      │
│              │  https    │                  │
└──────────────┘           └──────────────────┘
    GRATIS                          │
    Ilimitado                       │ https
                                    ▼
                           ┌──────────────────┐
                           │    BACKEND       │
                           │   (Railway)      │
                           │                  │
                           └──────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │   PostgreSQL     │
                           │   (Railway)      │
                           │                  │
                           └──────────────────┘
                           GRATIS hasta $5/mes
```

---

### 📦 OPCIÓN 1: RAILWAY (RECOMENDADO)

#### **Plan Gratuito:**
- ✅ $5 USD de crédito MENSUAL (se renueva cada mes)
- ✅ PostgreSQL incluido
- ✅ Deployments ilimitados
- ✅ SSL automático (HTTPS)
- ✅ Variables de entorno
- ✅ Logs en tiempo real
- ✅ Dominio personalizado

#### **Consumo estimado:**
- Backend: ~$2-3/mes
- BFF: ~$1-2/mes
- PostgreSQL: ~$1-2/mes
- **TOTAL: $4-7/mes**

**⚠️ IMPORTANTE:** Con optimización, puedes quedarte dentro de los $5 gratis

---

### 🚀 DEPLOYMENT PASO A PASO

#### **PASO 1: Preparar Backend**

1. **Crear cuenta en Railway**
```
https://railway.app/
```

2. **Optimizar para producción**
```javascript
// package.json - Asegurar script de inicio
{
  "scripts": {
    "start": "node backend-server.js",
    "railway": "NODE_ENV=production node backend-server.js"
  }
}
```

3. **Variables de entorno en Railway**
```
NODE_ENV=production
PORT=3000
DB_HOST=<railway-db-host>
DB_PORT=5432
DB_USER=<railway-db-user>
DB_PASSWORD=<railway-db-pass>
DB_NAME=railway
DB_SSL=true
JWT_SECRET=<generar-nuevo>
CLOUDINARY_CLOUD_NAME=<tu-cloud>
CLOUDINARY_API_KEY=<tu-key>
CLOUDINARY_API_SECRET=<tu-secret>
```

4. **Desplegar Backend**
```bash
# Conectar repositorio de GitHub a Railway
# Railway auto-detecta Node.js y despliega

# O usar Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

---

#### **PASO 2: Preparar BFF**

1. **Variables en Railway**
```
NODE_ENV=production
PORT=4000
API_URL=https://tu-backend.railway.app
FRONTEND_URL=https://tu-frontend.vercel.app
JWT_SECRET=<mismo-que-backend>
```

2. **Desplegar BFF**
```bash
# Proyecto separado en Railway
railway init
railway up
```

---

#### **PASO 3: Preparar Frontend (Vercel - 100% GRATIS)**

1. **Crear cuenta en Vercel**
```
https://vercel.com/signup
```

2. **Variables de entorno en Vercel**
```
VITE_API_URL=https://tu-bff.railway.app/api
```

3. **Optimizar build**
```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

4. **Desplegar Frontend**
```bash
# Opción 1: Conectar GitHub repo desde Vercel Dashboard
# (Recomendado - auto-deploy en cada push)

# Opción 2: Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

**Plan Gratuito Vercel:**
- ✅ Deployments ilimitados
- ✅ 100 GB ancho de banda/mes
- ✅ SSL automático
- ✅ CDN global
- ✅ Dominio personalizado
- ✅ GRATIS PARA SIEMPRE

---

### 💰 ALTERNATIVAS 100% GRATUITAS

#### **OPCIÓN A: Render.com**

**Plan Gratuito:**
- ✅ Backend gratuito (duerme después de 15 min inactividad)
- ✅ PostgreSQL gratuito (90 días, luego se borra)
- ✅ SSL automático

**⚠️ Limitaciones:**
- El servicio se "duerme" → primera carga lenta (30 seg)
- Base de datos expira cada 90 días (necesitas renovar)

**Usar para:**
- Demos temporales
- Proyectos escolares de corto plazo

---

#### **OPCIÓN B: Fly.io**

**Plan Gratuito:**
- ✅ 3 VMs pequeñas
- ✅ 3 GB almacenamiento (PostgreSQL)
- ✅ 160 GB tráfico saliente/mes
- ✅ SSL automático

**Mejor para:**
- Apps que necesitan estar siempre activas
- Sin "dormirse"

---

#### **OPCIÓN C: Supabase + Vercel**

**Migrar TODO a Supabase:**
- ✅ PostgreSQL gratuito (500 MB)
- ✅ Autenticación gratuita
- ✅ Storage gratuito (1 GB)
- ✅ API automática (REST + GraphQL)

**Frontend en Vercel:**
- ✅ Gratis ilimitado

**Ventaja:**
- Solo 2 servicios en lugar de 4
- Más simple
- 100% gratis

**Desventaja:**
- Requiere reescribir código para usar Supabase JS Client
- Menos control sobre el backend

---

### 🎯 RECOMENDACIÓN FINAL

#### **Para el Hogar (PRODUCCIÓN):**

```
┌─────────────────────────────────────┐
│  FRONTEND → Vercel (GRATIS)         │
│  BFF → Railway ($2/mes)             │
│  BACKEND → Railway ($3/mes)         │
│  DATABASE → Railway ($1/mes)        │
│  IMÁGENES → Cloudinary (GRATIS)     │
│                                     │
│  TOTAL: ~$6/mes ($1 sobre gratis)   │
│  Con optimización: $4/mes (GRATIS)  │
└─────────────────────────────────────┘
```

#### **Optimizaciones para quedarse GRATIS:**

1. **Reducir instancias de Railway:**
   - Combinar Backend + BFF en un solo servicio
   - Usar subdominios: `api.tudominio.com` y `bff.tudominio.com`

2. **Optimizar base de datos:**
   - Limpiar tablas regularmente
   - Índices apropiados
   - Sin datos innecesarios

3. **Cache:**
   - Usar cache de Vercel para frontend
   - Cache de Cloudinary para imágenes

4. **Monitoreo:**
   - Revisar usage de Railway mensualmente
   - Alertas cuando llegue a $4

---

### 📋 CHECKLIST DE DEPLOYMENT

#### Antes de deploy:
- [ ] Backup de base de datos local
- [ ] Variables de entorno documentadas
- [ ] Scripts de migración listos
- [ ] Cuenta en Cloudinary creada
- [ ] Cuenta en Railway creada
- [ ] Cuenta en Vercel creada
- [ ] Repositorios en GitHub actualizados

#### Durante deploy:
- [ ] Deploy de PostgreSQL en Railway
- [ ] Ejecutar migraciones en Railway DB
- [ ] Deploy de Backend en Railway
- [ ] Configurar variables de entorno Backend
- [ ] Deploy de BFF en Railway
- [ ] Configurar variables de entorno BFF
- [ ] Deploy de Frontend en Vercel
- [ ] Configurar variables de entorno Frontend
- [ ] Verificar conexiones entre servicios
- [ ] Probar login
- [ ] Probar upload de imágenes
- [ ] Verificar HTTPS en todos los servicios

#### Después de deploy:
- [ ] Documentar URLs de producción
- [ ] Configurar dominio personalizado (opcional)
- [ ] Monitorear logs por 24-48 horas
- [ ] Capacitar al personal del hogar
- [ ] Crear manual de usuario
- [ ] Configurar alertas de errores

---

### 📞 SOPORTE Y DOCUMENTACIÓN

**Railway:**
- Docs: https://docs.railway.app/
- Discord: https://discord.gg/railway

**Vercel:**
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Cloudinary:**
- Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/

---

**Fecha:** 2026-02-24  
**Versión:** 1.0  
**Contacto:** Para el Hogar de Ancianos La Misericordia
