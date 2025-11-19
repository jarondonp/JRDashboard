import React from 'react';
import CommercialPanel from './panels/CommercialPanel';

const CommercialPanelPage: React.FC = () => {
  return (
    <div>
      <CommercialPanel
        areaId="commercial"
        areaName="Panel Comercial"
        color="#FF5722"
        icon="📈"
      />
    </div>
  );
};

export default CommercialPanelPage;
