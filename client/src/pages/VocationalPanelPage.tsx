import React from 'react';
import { useAreas } from '../hooks';
import VocationalPanel from './panels/VocationalPanel';
import { motion } from 'framer-motion';

const VocationalPanelPage: React.FC = () => {
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

  const vocationalKeywords = ['vocational', 'vocacional', 'profesional', 'carrera', 'trabajo', 'career'];
  const vocationalArea = areas?.find((a: any) =>
    vocationalKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!vocationalArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área vocacional configurada</p>
      </div>
    );
  }

  return (
    <div>
      <VocationalPanel
        areaId={vocationalArea.id}
        areaName={vocationalArea.name}
        color={vocationalArea.color}
        icon={vocationalArea.icon}
      />
    </div>
  );
};

export default VocationalPanelPage;
