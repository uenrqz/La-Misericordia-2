// mock-data.js - Datos simulados para la aplicación

// Residentes/pacientes simulados
export const MOCK_PATIENTS = [
  {
    id: 1,
    name: "María Gómez",
    age: 78,
    room: "101",
    status: "Activo",
    primaryDiagnosis: "Hipertensión arterial",
    vitalSigns: [
      { date: "2025-05-13T09:30:00", bp: "130/85", pulse: 72, temp: 36.5, spo2: 96 },
      { date: "2025-05-12T10:15:00", bp: "135/82", pulse: 75, temp: 36.7, spo2: 97 },
    ],
    evolutions: [
      { date: "2025-05-13T11:00:00", author: "Dr. Martínez", note: "Paciente estable. Continúa con tratamiento para HTA." },
      { date: "2025-05-10T14:30:00", author: "Enf. Rodríguez", note: "Se administra medicación sin complicaciones." },
    ]
  },
  {
    id: 2,
    name: "Juan Pérez",
    age: 85,
    room: "102",
    status: "Activo",
    primaryDiagnosis: "Diabetes tipo 2",
    vitalSigns: [
      { date: "2025-05-13T08:45:00", bp: "145/90", pulse: 80, temp: 36.8, spo2: 94 },
      { date: "2025-05-11T09:30:00", bp: "150/95", pulse: 82, temp: 37.0, spo2: 93 },
    ],
    evolutions: [
      { date: "2025-05-13T10:30:00", author: "Dr. López", note: "Necesita monitoreo continuo de niveles de glucemia." },
      { date: "2025-05-12T15:00:00", author: "Enf. García", note: "Presenta leve edema en extremidades inferiores." },
    ]
  },
  {
    id: 3,
    name: "Ana Castillo",
    age: 72,
    room: "103",
    status: "Activo",
    primaryDiagnosis: "Artrosis",
    vitalSigns: [
      { date: "2025-05-14T07:30:00", bp: "125/80", pulse: 68, temp: 36.3, spo2: 98 },
      { date: "2025-05-12T08:00:00", bp: "128/83", pulse: 70, temp: 36.5, spo2: 98 },
    ],
    evolutions: [
      { date: "2025-05-14T09:15:00", author: "Dr. Sánchez", note: "Se recomienda iniciar terapia física para movilidad." },
      { date: "2025-05-11T16:30:00", author: "Enf. Hernández", note: "Refiere dolor moderado en rodilla derecha." },
    ]
  },
  {
    id: 4,
    name: "Roberto Díaz",
    age: 80,
    room: "104",
    status: "Activo",
    primaryDiagnosis: "EPOC",
    vitalSigns: [
      { date: "2025-05-14T10:00:00", bp: "140/85", pulse: 85, temp: 36.9, spo2: 89 },
      { date: "2025-05-13T11:30:00", bp: "145/90", pulse: 88, temp: 37.1, spo2: 91 },
    ],
    evolutions: [
      { date: "2025-05-14T12:00:00", author: "Dra. Ramírez", note: "Presenta exacerbación de síntomas respiratorios. Aumentar oxigenoterapia." },
      { date: "2025-05-13T14:00:00", author: "Enf. Jiménez", note: "Se observa aumento de secreciones y dificultad respiratoria." },
    ]
  },
  {
    id: 5,
    name: "Carmen Torres",
    age: 76,
    room: "105",
    status: "Activo",
    primaryDiagnosis: "Alzheimer fase inicial",
    vitalSigns: [
      { date: "2025-05-14T09:45:00", bp: "130/80", pulse: 72, temp: 36.6, spo2: 97 },
      { date: "2025-05-12T10:30:00", bp: "132/78", pulse: 70, temp: 36.5, spo2: 98 },
    ],
    evolutions: [
      { date: "2025-05-14T11:30:00", author: "Dr. González", note: "Mantiene orientación temporal parcial. Continuar con estimulación cognitiva." },
      { date: "2025-05-10T15:45:00", author: "Enf. López", note: "Participó en actividades grupales con buena disposición." },
    ]
  }
];

// Medicamentos simulados
export const MOCK_MEDICATIONS = [
  {
    id: 1,
    patientId: 1,
    name: "Enalapril",
    dose: "10 mg",
    frequency: "Cada 12 horas",
    times: ["08:00", "20:00"],
    route: "Oral",
    status: "Activo"
  },
  {
    id: 2,
    patientId: 1,
    name: "Aspirina",
    dose: "100 mg",
    frequency: "Una vez al día",
    times: ["08:00"],
    route: "Oral",
    status: "Activo"
  },
  {
    id: 3,
    patientId: 2,
    name: "Metformina",
    dose: "850 mg",
    frequency: "Cada 12 horas",
    times: ["08:00", "20:00"],
    route: "Oral",
    status: "Activo"
  },
  {
    id: 4,
    patientId: 2,
    name: "Insulina NPH",
    dose: "15 UI",
    frequency: "Una vez al día",
    times: ["07:30"],
    route: "Subcutánea",
    status: "Activo"
  },
  {
    id: 5,
    patientId: 3,
    name: "Ibuprofeno",
    dose: "400 mg",
    frequency: "Cada 8 horas",
    times: ["08:00", "16:00", "00:00"],
    route: "Oral",
    status: "Activo"
  },
  {
    id: 6,
    patientId: 4,
    name: "Salbutamol",
    dose: "2 puff",
    frequency: "Cada 6 horas",
    times: ["06:00", "12:00", "18:00", "00:00"],
    route: "Inhalatoria",
    status: "Activo"
  },
  {
    id: 7,
    patientId: 4,
    name: "Fluticasona",
    dose: "2 puff",
    frequency: "Cada 12 horas",
    times: ["08:00", "20:00"],
    route: "Inhalatoria",
    status: "Activo"
  },
  {
    id: 8,
    patientId: 5,
    name: "Donepezilo",
    dose: "5 mg",
    frequency: "Una vez al día",
    times: ["22:00"],
    route: "Oral",
    status: "Activo"
  }
];

// Función para obtener medicaciones pendientes (simula el día actual)
export const getPendingMedications = () => {
  // En un caso real, calcularíamos las medicaciones pendientes basadas en la hora actual
  // Para el mock, devolvemos un número fijo
  return 8;
};

// Función para formatear fechas al español
export const formatDateEs = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    hour: '2-digit', 
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });
};

// Otras funciones de utilidad y datos simulados que se pueden necesitar