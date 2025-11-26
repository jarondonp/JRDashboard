import React from 'react';
import { motion } from 'framer-motion';
import ScholarshipsPanel from './panels/ScholarshipsPanel';
import { useCategoryDashboards } from '../hooks';
import { AREA_CATEGORIES } from '../constants/areaCategories';

const ScholarshipsPanelPage: React.FC = () => {
  const {
    isLoading,
    dashboards,
    aggregatedDashboard,
    subtitle,
  } = useCategoryDashboards('scholarships');

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

  if (!dashboards.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró ningún área relacionada con becas o educación</p>
      </div>
    );
  }

  return (
    <div>
      <ScholarshipsPanel
        category={AREA_CATEGORIES.scholarships}
        dashboards={dashboards}
        aggregatedDashboard={aggregatedDashboard}
        subtitle={subtitle}
      />
    </div>
  );
};

export default ScholarshipsPanelPage;
