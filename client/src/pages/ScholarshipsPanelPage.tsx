import React from 'react';
import ScholarshipsPanel from './panels/ScholarshipsPanel';

const ScholarshipsPanelPage: React.FC = () => {
  return (
    <div>
      <ScholarshipsPanel
        areaId="scholarships"
        areaName="Panel Becas"
        color="#9C27B0"
        icon="🎓"
      />
    </div>
  );
};

export default ScholarshipsPanelPage;
