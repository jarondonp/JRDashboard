import React from 'react';
import EmotionalPanel from './panels/EmotionalPanel';

const EmotionalPanelPage: React.FC = () => {
  return (
    <div>
      <EmotionalPanel
        areaId="emotional"
        areaName="Panel Emocional"
        color="#4CAF50"
        icon="❤️"
      />
    </div>
  );
};

export default EmotionalPanelPage;
