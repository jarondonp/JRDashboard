export type AreaCategoryKey =
  | 'financial'
  | 'scholarships'
  | 'migration'
  | 'commercial'
  | 'emotional'
  | 'vocational';

export interface AreaCategoryConfig {
  key: AreaCategoryKey;
  name: string;
  icon: string;
  gradient: string;
  keywords: string[];
  panelRoute: string;
  panelTitle: string;
  panelIcon: string;
  panelColor: string;
}

export const AREA_CATEGORIES: Record<AreaCategoryKey, AreaCategoryConfig> = {
  financial: {
    key: 'financial',
    name: 'Financiero',
    icon: '💰',
    gradient: 'from-yellow-500 to-orange-500',
    keywords: [
      'financial',
      'financiero',
      'financiera',
      'finanzas',
      'dinero',
      'presupuesto',
      'economia',
      'economía',
      'finance',
      'ahorro',
      'inversion',
      'inversión',
      'banco',
      'bank',
    ],
    panelRoute: '/panel/financial',
    panelTitle: 'Panel Financiero y Presupuestos',
    panelIcon: '💰',
    panelColor: '#FFC107',
  },
  scholarships: {
    key: 'scholarships',
    name: 'Becas y Educación',
    icon: '🎓',
    gradient: 'from-purple-500 to-pink-500',
    keywords: [
      'scholarship',
      'scholarships',
      'beca',
      'becas',
      'educacion',
      'educación',
      'estudios',
      'school',
      'universidad',
      'university',
      'college',
      'academic',
    ],
    panelRoute: '/panel/scholarships',
    panelTitle: 'Panel de Becas y Educación',
    panelIcon: '🎓',
    panelColor: '#9C27B0',
  },
  migration: {
    key: 'migration',
    name: 'Migración',
    icon: '✈️',
    gradient: 'from-blue-500 to-cyan-500',
    keywords: [
      'migration',
      'migracion',
      'migración',
      'visa',
      'viaje',
      'relocation',
      'trámite',
      'tramite',
      'emigrar',
      'emigración',
      'residencia',
    ],
    panelRoute: '/panel/migration',
    panelTitle: 'Panel de Migración y Relocation',
    panelIcon: '✈️',
    panelColor: '#03A9F4',
  },
  commercial: {
    key: 'commercial',
    name: 'Profesional y Carrera',
    icon: '📈',
    gradient: 'from-indigo-500 to-purple-500',
    keywords: [
      'commercial',
      'comercial',
      'negocio',
      'negocios',
      'business',
      'emprendimiento',
      'profesional',
      'carrera',
      'trabajo',
      'career',
      'empresa',
      'technosolutions',
      'empleo',
      'job',
      'laboral',
    ],
    panelRoute: '/panel/commercial',
    panelTitle: 'Panel Profesional y Carrera',
    panelIcon: '📈',
    panelColor: '#3F51B5',
  },
  emotional: {
    key: 'emotional',
    name: 'Salud y Bienestar',
    icon: '❤️',
    gradient: 'from-red-500 to-pink-500',
    keywords: [
      'emotional',
      'emocional',
      'emocion',
      'emoción',
      'salud',
      'health',
      'mental',
      'bienestar',
      'wellness',
      'estado de animo',
      'mood',
    ],
    panelRoute: '/panel/emotional',
    panelTitle: 'Panel de Salud y Bienestar',
    panelIcon: '❤️',
    panelColor: '#4CAF50',
  },
  vocational: {
    key: 'vocational',
    name: 'Identidad y Propósito',
    icon: '⭐',
    gradient: 'from-yellow-500 to-orange-500',
    keywords: [
      'vocational',
      'vocacional',
      'identidad',
      'propósito',
      'proposito',
      'existencial',
      'identity',
      'purpose',
      'razon de ser',
      'razón',
      'propósito de vida',
    ],
    panelRoute: '/panel/vocational',
    panelTitle: 'Panel de Identidad y Propósito',
    panelIcon: '⭐',
    panelColor: '#FF9800',
  },
};

export const CATEGORY_LIST = Object.values(AREA_CATEGORIES);

