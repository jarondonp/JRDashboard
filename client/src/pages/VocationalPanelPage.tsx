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

  const identityKeywords = ['vocational', 'vocacional', 'identidad', 'propósito', 'proposito', 'existencial', 'identity', 'purpose', 'razon de ser'];
  const matchingAreas = areas?.filter((a: any) =>
    identityKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  ) || [];

  if (matchingAreas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró ningún área relacionada con identidad y propósito</p>
      </div>
    );
  }

  const primaryArea = matchingAreas[0];
  
  // Generar subtítulo con áreas monitoreadas
  const areaNames = matchingAreas.map((a: any) => a.name).join(', ');
  const subtitle = matchingAreas.length === 1 
    ? `📊 ${matchingAreas.length} área monitoreada: ${areaNames}`
    : `📊 ${matchingAreas.length} áreas monitoreadas: ${areaNames.length > 60 ? areaNames.substring(0, 60) + '...' : areaNames}`;

  return (
    <div>
      <VocationalPanel
        areaId={primaryArea.id}
        areaName="Panel de Identidad y Propósito"
        color="#9C27B0"
        icon="🌟"
        subtitle={subtitle}
      />
    </div>
  );
};

export default VocationalPanelPage;
