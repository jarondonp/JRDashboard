import React from 'react';
import { useAreas } from '../hooks';
import EmotionalPanel from './panels/EmotionalPanel';
import { motion } from 'framer-motion';

const EmotionalPanelPage: React.FC = () => {
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

  // Find emotional areas based on keywords
  const emotionalKeywords = ['emotional', 'emocional', 'salud', 'health', 'mental', 'bienestar'];
  const emotionalArea = areas?.find((a: any) =>
    emotionalKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!emotionalArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área emocional configurada</p>
      </div>
    );
  }

  return (
    <div>
      <EmotionalPanel
        areaId={emotionalArea.id}
        areaName={emotionalArea.name}
        color={emotionalArea.color}
        icon={emotionalArea.icon}
      />
    </div>
  );
};

export default EmotionalPanelPage;
