import React from 'react';
import FinancialPanel from './panels/FinancialPanel';

const FinancialPanelPage: React.FC = () => {
  return (
    <div>
      <FinancialPanel
        areaId="financial"
        areaName="Panel Financiero"
        color="#FFA500"
        icon="💰"
      />
    </div>
  );
};

export default FinancialPanelPage;
