import React from 'react';
import MigrationPanel from './panels/MigrationPanel';

const MigrationPanelPage: React.FC = () => {
  return (
    <div>
      <MigrationPanel
        areaId="migration"
        areaName="Panel Migración"
        color="#2196F3"
        icon="✈️"
      />
    </div>
  );
};

export default MigrationPanelPage;
