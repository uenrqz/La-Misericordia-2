import React, { useState, useEffect } from 'react';
import Dashboard from '../pages/Dashboard'; // Dashboard de administrador
import EnfermeriaDashboard from '../pages/EnfermeriaDashboard';
import MedicosDashboard from '../pages/MedicosDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';

/**
 * Componente que decide qué dashboard mostrar según el rol del usuario.
 * Se integra con DashboardLayout para proporcionar una experiencia unificada.
 */
const DashboardRouter = ({ user }) => {
  // En un caso real, obtendríamos el usuario del contexto de autenticación
  // Aquí simulamos un usuario para desarrollo
  const [currentUser, setCurrentUser] = useState(user || {
    id: '1',
    name: 'Usuario Demo',
    role: 'admin', // Cambiar a 'medico' o 'enfermera' para probar otros dashboards
  });

  // Renderiza el dashboard específico según el rol
  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Dashboard />;
      case 'medico':
        return <MedicosDashboard />;
      case 'enfermera':
        return <EnfermeriaDashboard />;
      default:
        return <p>Rol no reconocido.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">¡Bienvenido, {currentUser.name}!</CardTitle>
          <CardDescription>Tu resumen para hoy.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderDashboard()}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardRouter;