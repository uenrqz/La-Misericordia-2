const PERMISOS_DISPONIBLES = [
  'dashboard_admin',
  'dashboard_medico',
  'dashboard_enfermeria',
  'residentes',
  'signos_vitales',
  'ordenes_medicas',
  'evoluciones',
  'finanzas',
  'usuarios',
  'diagnostico'
];

const PERMISOS_POR_ROL = {
  admin: [...PERMISOS_DISPONIBLES],
  medico: ['dashboard_medico', 'residentes', 'ordenes_medicas', 'evoluciones'],
  enfermero: ['dashboard_enfermeria', 'residentes', 'signos_vitales', 'evoluciones'],
  cuidador: ['residentes'],
  secretaria: ['residentes']
};

const parsePermisos = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const normalizarPermisos = (permisos, rol) => {
  const rolKey = rol === 'enfermera' ? 'enfermero' : rol;
  const parsed = parsePermisos(permisos).filter((permiso) => PERMISOS_DISPONIBLES.includes(permiso));
  if (parsed.length > 0) {
    return parsed;
  }
  return PERMISOS_POR_ROL[rolKey] ? [...PERMISOS_POR_ROL[rolKey]] : [];
};

module.exports = {
  PERMISOS_DISPONIBLES,
  PERMISOS_POR_ROL,
  parsePermisos,
  normalizarPermisos
};
