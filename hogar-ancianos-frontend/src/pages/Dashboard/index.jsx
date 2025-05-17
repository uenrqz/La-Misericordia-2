import React, { useEffect, useState } from 'react';
import { getAdminDashboardData } from '../../services/dashboard.service';
import StatsCard from '../../components/ui/StatsCard';
import FinanceCard from '../../components/ui/FinanceCard';
import ShortcutButton from '../../components/ui/ShortcutButton';
import { FaUserPlus, FaUsers, FaFileAlt } from 'react-icons/fa';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    residentes: { total: 0, activos: 0 },
    donaciones: { total: 0, recientes: [] },
    finanzas: { ingresos: 0, egresos: 0, balance: 0 },
    articulos: { disponibles: 0 }
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await getAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Panel Administrativo</h1>
        <p className="text-gray-600">Bienvenido al sistema administrativo del Hogar "La Misericordia"</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Pacientes"
          value={dashboardData.residentes.activos}
          label="De 3 registrados"
          icon={<FaUsers className="text-blue-500" />}
        />
        <StatsCard
          title="Donaciones"
          value={`Q.${dashboardData.donaciones.total.toFixed(2)}`}
          label="Recaudadas este período"
          trend="up"
          icon={<FaFileAlt className="text-green-500" />}
        />
        <StatsCard
          title="Artículos"
          value={dashboardData.articulos.disponibles}
          label="Disponibles para venta"
          icon={<FaFileAlt className="text-orange-500" />}
        />
      </div>

      {/* Accesos Rápidos */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ShortcutButton
            to="/app/residentes/nuevo"
            icon={<FaUserPlus className="text-2xl text-blue-500" />}
            label="Nuevo Paciente"
          />
          <ShortcutButton
            to="/app/residentes"
            icon={<FaUsers className="text-2xl text-green-500" />}
            label="Lista de Pacientes"
          />
          <ShortcutButton
            to="/app/admisiones"
            icon={<FaFileAlt className="text-2xl text-purple-500" />}
            label="Admisiones"
          />
        </div>
      </section>

      {/* Resumen Financiero */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceCard
            title="Ingresos"
            amount={dashboardData.finanzas.ingresos}
            description="Donaciones y pagos"
            type="income"
          />
          <FinanceCard
            title="Egresos"
            amount={dashboardData.finanzas.egresos}
            description="Operativos y suministros"
            type="expense"
          />
          <FinanceCard
            title="Balance Neto"
            amount={dashboardData.finanzas.balance}
            description="Déficit actual"
            type="balance"
          />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;