import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAreas } from '../hooks/useAreas';
import { useCategoryDashboards } from '../hooks/useCategoryDashboards';
import EmotionalPanel from './panels/EmotionalPanel';
import VocationalPanel from './panels/VocationalPanel';
import FinancialPanel from './panels/FinancialPanel';
import MigrationPanel from './panels/MigrationPanel';
import ScholarshipsPanel from './panels/ScholarshipsPanel';
import CommercialPanel from './panels/CommercialPanel';
import { AREA_CATEGORIES } from '../constants/areaCategories';

// Mapping de áreas a tipos de paneles y iconos
const AREA_PANEL_MAPPING: Record<string, {
  panelType: 'emotional' | 'vocational' | 'financial' | 'migration' | 'scholarships' | 'commercial';
  icon: string;
}> = {
  'emotional': { panelType: 'emotional', icon: '💚' },
  'emocional': { panelType: 'emotional', icon: '💚' },
  'salud': { panelType: 'emotional', icon: '💚' },
  'health': { panelType: 'emotional', icon: '💚' },
  'mental': { panelType: 'emotional', icon: '💚' },
  'bienestar': { panelType: 'emotional', icon: '💚' },
  
  'vocational': { panelType: 'vocational', icon: '💼' },
  'vocacional': { panelType: 'vocational', icon: '💼' },
  'profesional': { panelType: 'vocational', icon: '💼' },
  'carrera': { panelType: 'vocational', icon: '💼' },
  'trabajo': { panelType: 'vocational', icon: '💼' },
  'career': { panelType: 'vocational', icon: '💼' },
  
  'financial': { panelType: 'financial', icon: '💰' },
  'financiero': { panelType: 'financial', icon: '💰' },
  'dinero': { panelType: 'financial', icon: '💰' },
  'presupuesto': { panelType: 'financial', icon: '💰' },
  'economia': { panelType: 'financial', icon: '💰' },
  
  'migration': { panelType: 'migration', icon: '🌍' },
  'migracion': { panelType: 'migration', icon: '🌍' },
  'visa': { panelType: 'migration', icon: '🌍' },
  'viaje': { panelType: 'migration', icon: '🌍' },
  'relocation': { panelType: 'migration', icon: '🌍' },
  
  'scholarships': { panelType: 'scholarships', icon: '🎓' },
  'becas': { panelType: 'scholarships', icon: '🎓' },
  'educacion': { panelType: 'scholarships', icon: '🎓' },
  'estudios': { panelType: 'scholarships', icon: '🎓' },
  
  'commercial': { panelType: 'commercial', icon: '📈' },
  'comercial': { panelType: 'commercial', icon: '📈' },
  'negocios': { panelType: 'commercial', icon: '📈' },
  'business': { panelType: 'commercial', icon: '📈' },
  'emprendimiento': { panelType: 'commercial', icon: '📈' },
};

const AreaPanelPage: React.FC = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const { data: areas, isLoading } = useAreas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const area = areas?.find(a => a.id === areaId);

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Área no encontrada</p>
        <button
          onClick={() => navigate('/areas')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Volver a Áreas
        </button>
      </div>
    );
  }

  // Detectar el tipo de panel basado en el nombre del área
  const areaNameLower = area.name.toLowerCase();
  const panelConfig = AREA_PANEL_MAPPING[areaNameLower] || AREA_PANEL_MAPPING['vocational'];
  const { panelType } = panelConfig;

  const categoryConfig = AREA_CATEGORIES[panelType];
  const {
    isLoading: loadingDashboards,
    dashboards,
    aggregatedDashboard,
    subtitle: categorySubtitle,
  } = useCategoryDashboards(panelType);

  if (loadingDashboards) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">No hay datos disponibles para esta categoría.</p>
        <button
          onClick={() => navigate('/areas')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Volver a Áreas
        </button>
      </div>
    );
  }

  const commonProps = {
    category: categoryConfig,
    dashboards,
    aggregatedDashboard,
    subtitle: categorySubtitle,
    initialAreaId: area.id,
  };

  return (
    <>
      {panelType === 'emotional' && <EmotionalPanel {...commonProps} />}
      {panelType === 'vocational' && <VocationalPanel {...commonProps} />}
      {panelType === 'financial' && <FinancialPanel {...commonProps} />}
      {panelType === 'migration' && <MigrationPanel {...commonProps} />}
      {panelType === 'scholarships' && <ScholarshipsPanel {...commonProps} />}
      {panelType === 'commercial' && <CommercialPanel {...commonProps} />}
    </>
  );
};

export default AreaPanelPage;
