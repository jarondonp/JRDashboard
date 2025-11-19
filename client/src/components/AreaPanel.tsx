import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from './Card';

export type PanelType = 'emotional' | 'vocational' | 'financial' | 'migration' | 'scholarships' | 'commercial';

interface AreaPanelProps {
  areaId: string;
  areaName: string;
  color: string;
  icon: string;
  panelType: PanelType;
  children: React.ReactNode;
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon, trend, trendValue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    transition={{ type: 'spring', stiffness: 400 }}
  >
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trendValue && (
              <p className={`text-sm mt-2 font-semibold ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
          {icon && <div className="text-3xl">{icon}</div>}
        </div>
      </CardBody>
    </Card>
  </motion.div>
);

const AreaPanelHeader: React.FC<{
  areaName: string;
  color: string;
  icon: string;
  panelType: PanelType;
  subtitle?: string;
  onBack: () => void;
}> = ({ areaName, color, icon, panelType, subtitle, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6"
  >
    <div className={`p-6 rounded-lg text-white`} style={{
      background: `linear-gradient(135deg, ${color}80 0%, ${color}40 100%)`
    }}>
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
        >
          ← Volver
        </button>
        <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium capitalize">
          {panelType}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{icon}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{areaName}</h1>
          {subtitle && (
            <p className="text-white/90 text-sm mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const AreaPanelSection: React.FC<{
  title: string;
  icon?: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="mb-6"
  >
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    {children}
  </motion.div>
);

// Componente contenedor principal
const AreaPanelContainer: React.FC<AreaPanelProps> = ({
  areaId,
  areaName,
  color,
  icon,
  panelType,
  children
}) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
    <div className="max-w-6xl mx-auto">
      {children}
    </div>
  </div>
);

export {
  KPICard,
  AreaPanelHeader,
  AreaPanelSection,
  AreaPanelContainer,
};

export default AreaPanelContainer;
