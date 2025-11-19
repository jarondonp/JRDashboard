import React from 'react';
import { useAreas } from '../hooks';
import CommercialPanel from './panels/CommercialPanel';
import { motion } from 'framer-motion';

const CommercialPanelPage: React.FC = () => {
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

  const commercialKeywords = ['commercial', 'comercial', 'negocios', 'business', 'emprendimiento'];
  const commercialArea = areas?.find((a: any) =>
    commercialKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!commercialArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área comercial configurada</p>
      </div>
    );
  }

  return (
    <div>
      <CommercialPanel
        areaId={commercialArea.id}
        areaName={commercialArea.name}
        color={commercialArea.color}
        icon={commercialArea.icon}
      />
    </div>
  );
};

export default CommercialPanelPage;
