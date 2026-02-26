# 📊 Comparación de Normalización - Libro Diario Financiero

## 🔍 Análisis de Tercera Forma Normal (3NF)

### Definición de 3NF:
Una tabla está en 3NF si:
1. ✅ Está en 2NF (Segunda Forma Normal)
2. ✅ No tiene dependencias transitivas (ningún atributo no-clave depende de otro atributo no-clave)

---

## ❌ Esquema Original - Violaciones de 3NF

### **1. `transacciones_financieras`**

**Violación**: Campo `tipo` redundante
```sql
tipo VARCHAR(20) NOT NULL,  -- ← REDUNDANTE
categoria_id INTEGER REFERENCES categorias_transacciones(id),
```

**Problema**:
- `tipo` depende de `categoria_id → categorias_transacciones.tipo`
- Dependencia transitiva: `id → categoria_id → tipo`
- Si cambias el tipo de una categoría, debes actualizar todas las transacciones

**Impacto**: 
- ❌ Inconsistencia de datos
- ❌ Anomalías de actualización
- ❌ Redundancia de almacenamiento

---

### **2. `presupuestos_mensuales`**

**Violación**: Campos calculados almacenados
```sql
monto_gastado DECIMAL(12, 2) DEFAULT 0,  -- ← CALCULADO
porcentaje_utilizado DECIMAL(5, 2) DEFAULT 0,  -- ← CALCULADO
```

**Problema**:
- Estos valores se derivan de `transacciones_financieras`
- No dependen directamente de la clave primaria
- Requieren sincronización constante

**Impacto**:
- ❌ Datos pueden desincronizarse
- ❌ Complejidad en mantener consistencia
- ❌ No es fuente única de verdad

---

### **3. `predicciones_gastos`**

**Violación**: Toda la tabla son datos derivados
```sql
monto_promedio DECIMAL(12, 2),  -- ← CALCULADO
monto_minimo DECIMAL(12, 2),  -- ← CALCULADO
monto_maximo DECIMAL(12, 2),  -- ← CALCULADO
proveedor_frecuente VARCHAR(200),  -- ← CALCULADO
```

**Problema**:
- Toda la tabla es una caché de cálculos
- No hay datos originales, solo agregaciones
- Violación completa de 3NF

**Impacto**:
- ❌ Complejidad en mantener sincronización
- ❌ Datos obsoletos si no se actualizan
- ❌ Duplicación de lógica de negocio

---

### **4. `instancias_pagos`**

**Violación Menor**: Campo `monto` duplicado
```sql
monto DECIMAL(12, 2) NOT NULL,  -- ← De pagos_programados.monto
pago_programado_id INTEGER REFERENCES pagos_programados(id),
```

**Justificación Válida**:
- ✅ El monto puede variar por ajustes (inflación, descuentos)
- ✅ Es un dato histórico independiente
- ✅ No es realmente redundante, sino variante

---

## ✅ Esquema Normalizado a 3NF

### **Cambios Principales:**

#### 1. **Eliminación de redundancias**

**Antes**:
```sql
transacciones_financieras (
    tipo VARCHAR(20),  -- REDUNDANTE
    categoria_id INTEGER
)
```

**Después (3NF)**:
```sql
transacciones_financieras (
    categoria_id INTEGER NOT NULL  -- tipo se obtiene via JOIN
)

-- Vista para facilitar acceso
vista_transacciones_completas (
    SELECT t.*, c.tipo as tipo_transaccion
    FROM transacciones_financieras t
    JOIN categorias_transacciones c ON t.categoria_id = c.id
)
```

---

#### 2. **Normalización de catálogos**

**Nuevas tablas creadas:**
```sql
metodos_pago (id, nombre)
estados_transaccion (id, nombre)
estados_pago (id, nombre)
frecuencias_pago (id, nombre, dias)
contactos_financieros (id, nombre, tipo)
```

**Antes**: VARCHAR con valores repetidos
**Después**: Foreign Keys a tablas de catálogo

**Beneficios**:
- ✅ Integridad referencial
- ✅ Facilita cambios globales
- ✅ Mejor rendimiento en queries
- ✅ Validación automática

---

#### 3. **Campos calculados → Vistas**

**Antes**: Tabla con datos calculados
```sql
predicciones_gastos (
    monto_promedio,
    monto_minimo,
    monto_maximo,
    proveedor_frecuente
)
```

**Después (3NF)**: Vista calculada en tiempo real
```sql
configuracion_predicciones (
    categoria_id,
    concepto_base,
    min_transacciones_requeridas,
    ventana_dias_analisis
)

vista_predicciones_gastos (
    SELECT 
        AVG(monto) as monto_promedio,
        MIN(monto) as monto_minimo,
        MAX(monto) as monto_maximo,
        MODE() WITHIN GROUP (ORDER BY proveedor) as proveedor_frecuente
    FROM transacciones_financieras
    -- Cálculo dinámico
)
```

**Beneficios**:
- ✅ Siempre actualizado
- ✅ No requiere mantenimiento
- ✅ Una fuente de verdad

---

#### 4. **Presupuestos simplificados**

**Antes**:
```sql
presupuestos_mensuales (
    monto_presupuestado DECIMAL,
    monto_gastado DECIMAL,  -- CALCULADO
    porcentaje_utilizado DECIMAL  -- CALCULADO
)
```

**Después (3NF)**:
```sql
presupuestos_mensuales (
    monto_presupuestado DECIMAL,
    umbral_alerta DECIMAL  -- Config, no cálculo
)

vista_presupuestos_con_gastos (
    SELECT 
        p.monto_presupuestado,
        SUM(t.monto) as monto_gastado,  -- Calculado dinámicamente
        (SUM(t.monto) / p.monto_presupuestado * 100) as porcentaje_utilizado
    FROM presupuestos_mensuales p
    LEFT JOIN transacciones_financieras t ON ...
)
```

---

## 📊 Comparación de Esquemas

| Aspecto | Original | 3NF Normalizado |
|---------|----------|-----------------|
| **Cumple 3NF** | ❌ No | ✅ Sí |
| **Redundancia** | ❌ Alta (tipo, montos calculados) | ✅ Mínima |
| **Consistencia** | ⚠️ Requiere sincronización | ✅ Automática |
| **Mantenimiento** | ❌ Complejo (múltiples lugares) | ✅ Simple (fuente única) |
| **Rendimiento Lectura** | ✅ Rápido (datos precalculados) | ⚠️ Medio (requiere JOINs/cálculos) |
| **Rendimiento Escritura** | ⚠️ Lento (actualizar agregados) | ✅ Rápido (solo inserts) |
| **Espacio en disco** | ❌ Mayor (datos duplicados) | ✅ Menor |
| **Complejidad queries** | ✅ Simple (todo en una tabla) | ⚠️ Media (requiere vistas/JOINs) |
| **Escalabilidad** | ⚠️ Limitada | ✅ Alta |
| **Riesgo de bugs** | ❌ Alto (sincronización) | ✅ Bajo |

---

## 🎯 Recomendación: Enfoque Híbrido

### **Para Producción: Esquema Original con Mejoras**

**Razones**:
1. ✅ **Rendimiento**: Queries más rápidas para reportes frecuentes
2. ✅ **Simplicidad**: Menos JOINs en el código de aplicación
3. ✅ **Experiencia de usuario**: Respuestas instantáneas en dashboard
4. ⚠️ **Trade-off aceptable**: Complejidad de mantenimiento vs velocidad

**Mejoras sugeridas al esquema original**:

```sql
-- 1. Agregar trigger para mantener consistencia
CREATE OR REPLACE FUNCTION sincronizar_monto_gastado()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE presupuestos_mensuales
    SET 
        monto_gastado = (
            SELECT COALESCE(SUM(monto), 0)
            FROM transacciones_financieras
            WHERE categoria_id = NEW.categoria_id
            AND EXTRACT(YEAR FROM fecha_transaccion) = anio
            AND EXTRACT(MONTH FROM fecha_transaccion) = mes
            AND estado = 'completada'
        ),
        porcentaje_utilizado = (
            monto_gastado / monto_presupuestado * 100
        )
    WHERE categoria_id = NEW.categoria_id
    AND anio = EXTRACT(YEAR FROM NEW.fecha_transaccion)
    AND mes = EXTRACT(MONTH FROM NEW.fecha_transaccion);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_presupuesto
    AFTER INSERT OR UPDATE OR DELETE ON transacciones_financieras
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_monto_gastado();

-- 2. Agregar constraint para validar tipo
ALTER TABLE transacciones_financieras
ADD CONSTRAINT chk_tipo_consistente CHECK (
    tipo = (SELECT tipo FROM categorias_transacciones WHERE id = categoria_id)
);

-- 3. Agregar índices para mejorar sincronización
CREATE INDEX idx_transacciones_categoria_fecha 
ON transacciones_financieras(categoria_id, fecha_transaccion);
```

---

### **Para Cumplimiento 3NF: Usar Esquema Normalizado**

**Cuándo usarlo**:
- ✅ Auditorías académicas o certificaciones
- ✅ Sistemas críticos donde consistencia > rendimiento
- ✅ Bases de datos muy grandes (millones de registros)
- ✅ Cuando el equipo es pequeño y no puede mantener sincronización

---

## 📝 Migración entre Esquemas

### **De Original a 3NF**:
```sql
-- 1. Crear tablas de catálogo
INSERT INTO metodos_pago (nombre)
SELECT DISTINCT metodo_pago FROM transacciones_financieras WHERE metodo_pago IS NOT NULL;

-- 2. Actualizar FK
ALTER TABLE transacciones_financieras ADD COLUMN metodo_pago_id INTEGER;
UPDATE transacciones_financieras t
SET metodo_pago_id = (SELECT id FROM metodos_pago WHERE nombre = t.metodo_pago);

-- 3. Eliminar columnas redundantes
ALTER TABLE transacciones_financieras DROP COLUMN tipo;
ALTER TABLE transacciones_financieras DROP COLUMN metodo_pago;

-- 4. Crear vistas de compatibilidad
CREATE VIEW transacciones_legacy AS
SELECT t.*, c.tipo, mp.nombre as metodo_pago
FROM transacciones_financieras t
JOIN categorias_transacciones c ON t.categoria_id = c.id
LEFT JOIN metodos_pago mp ON t.metodo_pago_id = mp.id;
```

### **De 3NF a Original** (desnormalización):
```sql
-- 1. Agregar columnas
ALTER TABLE transacciones_financieras ADD COLUMN tipo VARCHAR(20);

-- 2. Poblar desde categoría
UPDATE transacciones_financieras t
SET tipo = (SELECT tipo FROM categorias_transacciones WHERE id = t.categoria_id);

-- 3. Agregar constraint
ALTER TABLE transacciones_financieras ALTER COLUMN tipo SET NOT NULL;
```

---

## 💡 Conclusión

### **Esquema Original: Desnormalización Pragmática**
- ❌ No cumple 3NF estricta
- ✅ Óptimo para rendimiento en producción
- ⚠️ Requiere cuidado en mantenimiento
- **Recomendado para**: La Misericordia 2 (app en producción)

### **Esquema 3NF: Normalización Académica**
- ✅ Cumple 3NF estricta
- ✅ Máxima integridad de datos
- ⚠️ Requiere más JOINs y vistas
- **Recomendado para**: Documentación académica, auditorías

---

## 🚀 Recomendación Final

**Usar esquema original en producción** con las siguientes mejoras:

1. ✅ **Agregar triggers** para mantener consistencia automática
2. ✅ **Documentar** las desnormalizaciones y su propósito
3. ✅ **Agregar constraints** para validar integridad
4. ✅ **Crear tests** para verificar sincronización
5. ✅ **Mantener esquema 3NF** como referencia académica

**Archivos**:
- `libro_diario_financiero.sql` → **Producción** (desnormalizado pero optimizado)
- `libro_diario_financiero_3NF.sql` → **Referencia académica** (cumple 3NF estricta)

---

**Fecha**: 25 de febrero de 2026  
**Proyecto**: La Misericordia 2  
**Autor**: GitHub Copilot (Claude Sonnet 4.5)
