import React from 'react';
import VocationalPanel from './panels/VocationalPanel';

const VocationalPanelPage: React.FC = () => {
  return (
    <div>
      <VocationalPanel
        areaId="vocational"
        areaName="Panel Vocacional"
        color="#8B5CF6"
        icon="💼"
      />
    </div>
  );
};

export default VocationalPanelPage;
