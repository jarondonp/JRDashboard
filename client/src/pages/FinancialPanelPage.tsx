import React from 'react';
import { useAreas } from '../hooks';
import FinancialPanel from './panels/FinancialPanel';
import { motion } from 'framer-motion';

const FinancialPanelPage: React.FC = () => {
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

  const financialKeywords = ['financial', 'financiero', 'dinero', 'presupuesto', 'economia', 'finance'];
  const financialArea = areas?.find((a: any) =>
    financialKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
  );

  if (!financialArea) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un área financiera configurada</p>
      </div>
    );
  }

  return (
    <div>
      <FinancialPanel
        areaId={financialArea.id}
        areaName={financialArea.name}
        color={financialArea.color}
        icon={financialArea.icon}
      />
    </div>
  );
};

export default FinancialPanelPage;
