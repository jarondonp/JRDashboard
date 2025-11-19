import React from 'react';
import { useAreas } from '../hooks';
import ScholarshipsPanel from './panels/ScholarshipsPanel';
import { motion } from 'framer-motion';

const ScholarshipsPanelPage: React.FC = () => {
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

  const scholarshipsKeywords = ['scholarships', 'becas', 'educacion', 'estudios', 'school'];
  const scholarshipsArea = areas?.find((a: any) =>
    scholarshipsKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!scholarshipsArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área de becas configurada</p>
      </div>
    );
  }

  return (
    <div>
      <ScholarshipsPanel
        areaId={scholarshipsArea.id}
        areaName={scholarshipsArea.name}
        color={scholarshipsArea.color}
        icon={scholarshipsArea.icon}
      />
    </div>
  );
};

export default ScholarshipsPanelPage;
