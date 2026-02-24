# 📊 NORMALIZACIÓN DE BASE DE DATOS - 3NF

## Hogar de Ancianos "La Misericordia"

---

## 🎯 ANÁLISIS DE NORMALIZACIÓN ACTUAL

### ✅ TABLAS QUE CUMPLEN 3NF

#### 1. **usuarios** ✅
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  email VARCHAR(100) UNIQUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Estado:** ✅ Cumple 3NF
- 1NF: Todos los atributos son atómicos
- 2NF: Todos los atributos no clave dependen completamente de la PK
- 3NF: No hay dependencias transitivas

---

#### 2. **signos_vitales** ✅
```sql
CREATE TABLE signos_vitales (
    id SERIAL PRIMARY KEY,
    anciano_id INTEGER NOT NULL REFERENCES ancianos(id),
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    temperatura DECIMAL(4,1),
    presion_arterial VARCHAR(10),
    frecuencia_cardiaca INTEGER,
    frecuencia_respiratoria INTEGER,
    saturacion_oxigeno INTEGER,
    glucosa INTEGER,
    peso DECIMAL(5,2),
    observaciones TEXT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
);
```
**Estado:** ✅ Cumple 3NF

---

### ⚠️ TABLAS QUE NECESITAN NORMALIZACIÓN

#### 1. **ancianos** ⚠️ VIOLA 3NF

**Problema actual:**
```sql
CREATE TABLE ancianos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  direccion_anterior VARCHAR(200),
  fecha_ingreso DATE NOT NULL,
  estado_salud VARCHAR(50) NOT NULL,
  medicamentos TEXT,  -- ❌ VIOLA 1NF (lista de medicamentos)
  alergias TEXT,      -- ❌ VIOLA 1NF (lista de alergias)
  contacto_emergencia VARCHAR(100),  -- ❌ VIOLA 3NF
  telefono_emergencia VARCHAR(20)    -- ❌ VIOLA 3NF
);
```

**Violaciones:**
- **1NF:** `medicamentos` y `alergias` son listas en texto (no atómicos)
- **3NF:** `contacto_emergencia` y `telefono_emergencia` dependen entre sí

---

#### 2. **medicamentos_asignados** ⚠️ VIOLA 3NF

**Problema actual:**
```sql
CREATE TABLE medicamentos_asignados (
  id SERIAL PRIMARY KEY,
  anciano_id INTEGER REFERENCES ancianos(id),
  nombre_medicamento VARCHAR(100) NOT NULL,  -- ❌ DEBERÍA ser FK
  dosis VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(50) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  observaciones TEXT
);
```

**Violaciones:**
- **3NF:** `nombre_medicamento` debería ser una FK a una tabla `medicamentos`
- No hay catálogo centralizado de medicamentos

---

#### 3. **donaciones** ⚠️ VIOLA 3NF

**Problema actual:**
```sql
CREATE TABLE donaciones (
    id SERIAL PRIMARY KEY,
    tipo_donacion VARCHAR(50),
    monto NUMERIC(10, 2),
    donante_nombre VARCHAR(255),
    donante_nit VARCHAR(50),        -- ❌ VIOLA 3NF
    donante_direccion TEXT,         -- ❌ VIOLA 3NF
    -- ... más campos de donante
);
```

**Violaciones:**
- **3NF:** Información del donante (nit, dirección) está repetida
- Debería existir tabla `donantes` separada

---

## 🛠️ PROPUESTA DE NORMALIZACIÓN A 3NF

### 📋 **1. Normalizar tabla `ancianos`**

#### **A. Crear tabla `alergias`**
```sql
CREATE TABLE alergias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('bajo', 'moderado', 'alto', 'critico'))
);

CREATE TABLE residentes_alergias (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    alergia_id INTEGER NOT NULL REFERENCES alergias(id),
    fecha_diagnostico DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    UNIQUE(residente_id, alergia_id)
);
```

#### **B. Crear tabla `contactos_emergencia`**
```sql
CREATE TABLE contactos_emergencia (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(200) NOT NULL,
    parentesco VARCHAR(50),
    telefono_principal VARCHAR(20) NOT NULL,
    telefono_secundario VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    es_principal BOOLEAN DEFAULT FALSE,
    notas TEXT
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_contactos_residente ON contactos_emergencia(residente_id);
CREATE INDEX idx_contactos_principal ON contactos_emergencia(residente_id, es_principal);
```

#### **C. Modificar tabla `ancianos` (ahora normalizada)**
```sql
-- Eliminar columnas que violan 3NF
ALTER TABLE ancianos
DROP COLUMN IF EXISTS medicamentos,
DROP COLUMN IF EXISTS alergias,
DROP COLUMN IF EXISTS contacto_emergencia,
DROP COLUMN IF EXISTS telefono_emergencia;

-- La tabla ancianos ahora solo contiene atributos que dependen de id
-- ✅ Cumple 3NF
```

---

### 📋 **2. Normalizar tabla `medicamentos_asignados`**

Ya existe `medicamentos` en schema_updates.sql, pero necesita mejora:

```sql
-- Tabla catálogo de medicamentos (YA EXISTE, mejorada)
CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    principio_activo VARCHAR(150),
    presentacion VARCHAR(100),
    concentracion VARCHAR(50),
    tipo VARCHAR(50),
    via_administracion VARCHAR(30)[],  -- Array: oral, inyectable, tópica
    contraindicaciones TEXT,
    efectos_secundarios TEXT,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 10,
    precio_unitario DECIMAL(10,2),
    fecha_vencimiento DATE,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de medicamentos asignados (NORMALIZADA)
CREATE TABLE medicamentos_residentes (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    dosis VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    hora_administracion TIME[],
    via_administracion VARCHAR(30),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'activo',
    medico_id INTEGER NOT NULL REFERENCES usuarios(id),
    observaciones TEXT
);

-- Registro de cada vez que se administra
CREATE TABLE registro_administracion (
    id SERIAL PRIMARY KEY,
    medicamento_residente_id INTEGER NOT NULL REFERENCES medicamentos_residentes(id),
    fecha_hora_administracion TIMESTAMP NOT NULL DEFAULT NOW(),
    dosis_real VARCHAR(50),
    enfermera_id INTEGER NOT NULL REFERENCES usuarios(id),
    observaciones TEXT
);
```

---

### 📋 **3. Normalizar tabla `donaciones`**

```sql
-- A. Crear tabla donantes
CREATE TABLE donantes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(20) DEFAULT 'NIT',
    numero_documento VARCHAR(50) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    tipo_donante VARCHAR(30) CHECK (tipo_donante IN ('persona_natural', 'empresa', 'organizacion')),
    es_frecuente BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
);

-- Índices para búsquedas
CREATE INDEX idx_donantes_documento ON donantes(numero_documento);
CREATE INDEX idx_donantes_nombre ON donantes(nombre_completo);

-- B. Simplificar tabla donaciones (NORMALIZADA)
CREATE TABLE donaciones (
    id SERIAL PRIMARY KEY,
    donante_id INTEGER NOT NULL REFERENCES donantes(id),
    tipo_donacion VARCHAR(50) NOT NULL CHECK (tipo_donacion IN ('monetaria', 'especie', 'servicios')),
    fecha_donacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto NUMERIC(10, 2),
    valor_estimado NUMERIC(10, 2),
    descripcion TEXT,
    metodo_pago VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'procesada',
    usuario_registro_id INTEGER REFERENCES usuarios(id),
    
    -- Campos SAT (recibo electrónico)
    recibo_generado BOOLEAN DEFAULT FALSE,
    serie_recibo VARCHAR(50),
    numero_recibo VARCHAR(50),
    uuid_recibo VARCHAR(50),
    url_recibo VARCHAR(255),
    fecha_recibo TIMESTAMP
);

-- C. Tabla para detalles de donaciones en especie
CREATE TABLE donaciones_especie (
    id SERIAL PRIMARY KEY,
    donacion_id INTEGER NOT NULL REFERENCES donaciones(id) ON DELETE CASCADE,
    articulo VARCHAR(200) NOT NULL,
    cantidad INTEGER NOT NULL,
    unidad VARCHAR(30),
    valor_unitario DECIMAL(10,2),
    estado_articulo VARCHAR(30) CHECK (estado_articulo IN ('nuevo', 'usado_excelente', 'usado_bueno', 'usado_regular')),
    descripcion TEXT
);

-- Índices
CREATE INDEX idx_donaciones_donante ON donaciones(donante_id);
CREATE INDEX idx_donaciones_fecha ON donaciones(fecha_donacion);
CREATE INDEX idx_donaciones_tipo ON donaciones(tipo_donacion);
```

---

## 📊 DIAGRAMA ENTIDAD-RELACIÓN NORMALIZADO

```
┌─────────────────┐         ┌──────────────────┐
│   ANCIANOS      │─────────│  ALERGIAS        │
│  (Residentes)   │    M:N  │                  │
└─────────────────┘         └──────────────────┘
        │                            
        │ 1:N                        
        ▼                            
┌─────────────────────┐              
│ CONTACTOS_EMERGENCIA│              
└─────────────────────┘              
        │
        │ 1:N
        ▼
┌─────────────────────┐    ┌──────────────────┐
│ SIGNOS_VITALES      │    │  MEDICAMENTOS    │
└─────────────────────┘    │   (Catálogo)     │
        │                  └──────────────────┘
        │ 1:N                       │
        ▼                           │ M:N
┌─────────────────────┐             │
│  EVOLUCIONES        │             ▼
└─────────────────────┘    ┌──────────────────┐
                           │ MEDICAMENTOS_    │
┌──────────────────┐       │  RESIDENTES      │
│   DONANTES       │       └──────────────────┘
└──────────────────┘                │
        │ 1:N                       │ 1:N
        ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│   DONACIONES     │       │  REGISTRO_       │
└──────────────────┘       │  ADMINISTRACION  │
        │ 1:N              └──────────────────┘
        ▼
┌──────────────────┐
│ DONACIONES_      │
│   ESPECIE        │
└──────────────────┘
```

---

## 🎯 SCRIPT SQL COMPLETO DE NORMALIZACIÓN

Archivo: `scripts/normalizacion_3nf.sql`

```sql
-- =====================================================
-- NORMALIZACIÓN A 3NF - Hogar de Ancianos La Misericordia
-- =====================================================

BEGIN;

-- 1. CREAR NUEVAS TABLAS NORMALIZADAS

-- Alergias
CREATE TABLE IF NOT EXISTS alergias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('bajo', 'moderado', 'alto', 'critico'))
);

CREATE TABLE IF NOT EXISTS residentes_alergias (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    alergia_id INTEGER NOT NULL REFERENCES alergias(id),
    fecha_diagnostico DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    UNIQUE(residente_id, alergia_id)
);

-- Contactos de emergencia
CREATE TABLE IF NOT EXISTS contactos_emergencia (
    id SERIAL PRIMARY KEY,
    residente_id INTEGER NOT NULL REFERENCES ancianos(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(200) NOT NULL,
    parentesco VARCHAR(50),
    telefono_principal VARCHAR(20) NOT NULL,
    telefono_secundario VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    es_principal BOOLEAN DEFAULT FALSE,
    notas TEXT
);

-- Donantes
CREATE TABLE IF NOT EXISTS donantes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(20) DEFAULT 'NIT',
    numero_documento VARCHAR(50) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    tipo_donante VARCHAR(30) CHECK (tipo_donante IN ('persona_natural', 'empresa', 'organizacion')),
    es_frecuente BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
);

-- 2. MIGRAR DATOS EXISTENTES

-- Migrar alergias (si existen datos en columna TEXT)
-- Este paso se hace manualmente revisando los datos

-- Migrar contactos de emergencia
INSERT INTO contactos_emergencia (residente_id, nombre_completo, telefono_principal, es_principal)
SELECT id, contacto_emergencia, telefono_emergencia, TRUE
FROM ancianos
WHERE contacto_emergencia IS NOT NULL;

-- Migrar donantes de donaciones existentes
INSERT INTO donantes (nombre_completo, numero_documento)
SELECT DISTINCT donante_nombre, donante_nit
FROM donaciones
WHERE donante_nombre IS NOT NULL
ON CONFLICT (numero_documento) DO NOTHING;

-- 3. ACTUALIZAR DONACIONES CON FK A DONANTES
ALTER TABLE donaciones ADD COLUMN IF NOT EXISTS donante_id INTEGER REFERENCES donantes(id);

UPDATE donaciones d
SET donante_id = (
    SELECT id FROM donantes dn 
    WHERE dn.nombre_completo = d.donante_nombre
    LIMIT 1
);

-- 4. LIMPIAR COLUMNAS DESNORMALIZADAS
-- (Comentado por seguridad - ejecutar después de verificar)
-- ALTER TABLE ancianos DROP COLUMN IF EXISTS medicamentos;
-- ALTER TABLE ancianos DROP COLUMN IF EXISTS alergias;
-- ALTER TABLE ancianos DROP COLUMN IF EXISTS contacto_emergencia;
-- ALTER TABLE ancianos DROP COLUMN IF EXISTS telefono_emergencia;

-- ALTER TABLE donaciones DROP COLUMN IF EXISTS donante_nombre;
-- ALTER TABLE donaciones DROP COLUMN IF EXISTS donante_nit;
-- ALTER TABLE donaciones DROP COLUMN IF EXISTS donante_direccion;

-- 5. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_contactos_residente ON contactos_emergencia(residente_id);
CREATE INDEX IF NOT EXISTS idx_donantes_documento ON donantes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_donaciones_donante ON donaciones(donante_id);
CREATE INDEX IF NOT EXISTS idx_alergias_residente ON residentes_alergias(residente_id);

COMMIT;
```

---

## ✅ RESULTADO FINAL

### Tablas en 3NF:
1. ✅ `ancianos` (limpia, sin dependencias transitivas)
2. ✅ `alergias` + `residentes_alergias` (M:N normalizada)
3. ✅ `contactos_emergencia` (1:N)
4. ✅ `medicamentos` + `medicamentos_residentes` (catálogo normalizado)
5. ✅ `donantes` + `donaciones` (separación de entidades)
6. ✅ `signos_vitales` (ya estaba en 3NF)
7. ✅ `evoluciones` (ya estaba en 3NF)
8. ✅ `ordenes_medicas` (ya estaba en 3NF)

---

## 📌 PRÓXIMOS PASOS

1. **Backup de la base de datos actual**
```bash
npm run db:backup
```

2. **Ejecutar script de normalización**
```bash
psql -U hogar_user -d hogar_db -f scripts/normalizacion_3nf.sql
```

3. **Actualizar controladores** para usar nuevas tablas

4. **Probar funcionalidad** completa de la aplicación

---

**Fecha de documento:** 2026-02-24  
**Versión:** 1.0  
**Autor:** Normalización 3NF - La Misericordia
