import React from 'react';
import { useAreas } from '../hooks';
import MigrationPanel from './panels/MigrationPanel';
import { motion } from 'framer-motion';

const MigrationPanelPage: React.FC = () => {
  const { data: areas, isLoading } = useAreas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const migrationKeywords = ['migration', 'migracion', 'visa', 'viaje', 'relocation', 'trámite'];
  const migrationArea = areas?.find((a: any) =>
    migrationKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!migrationArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área de migración configurada</p>
      </div>
    );
  }

  return (
    <div>
      <MigrationPanel
        areaId={migrationArea.id}
        areaName={migrationArea.name}
        color={migrationArea.color}
        icon={migrationArea.icon}
      />
    </div>
  );
};

export default MigrationPanelPage;
