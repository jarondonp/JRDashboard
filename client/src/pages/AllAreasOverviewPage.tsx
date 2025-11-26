import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAreas } from '../hooks';
import { Card, CardBody } from '../components/Card';
import { useGoals } from '../hooks/useGoals';
import { useTasks } from '../hooks/useTasks';
import { AREA_CATEGORIES } from '../constants/areaCategories';

const AllAreasOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: areas, isLoading: areasLoading } = useAreas();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set() // Todas colapsadas por defecto
  );

  const categorizedAreas = useMemo(() => {
    if (!areas) {
      return {} as Record<string, any[]>;
    }

    const base: Record<string, any[]> = Object.keys(AREA_CATEGORIES).reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<string, any[]>,
    );
    base.other = [];

    areas.forEach((area: any) => {
      const areaNameLower = area.name.toLowerCase();
      const categoryEntry = Object.entries(AREA_CATEGORIES).find(([_, category]) =>
        category.keywords.some((keyword) => areaNameLower.includes(keyword)),
      );

      if (categoryEntry) {
        const [key] = categoryEntry;
        base[key].push(area);
      } else {
        base.other.push(area);
      }
    });

    return base;
  }, [areas]);

  // Filtrar por búsqueda
  const filterAreasBySearch = (areasList: any[]) => {
    if (!searchTerm) return areasList;
    return areasList.filter((area: any) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const getAreaStats = (areaId: string) => {
    const areaGoals = goals?.filter((g: any) => g.area_id === areaId) || [];
    const areaTasks = tasks?.filter((t: any) => t.area_id === areaId) || [];
    return {
      goalsCount: areaGoals.length,
      tasksCount: areaTasks.length
    };
  };

  if (areasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const totalAreas = areas?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-8 shadow-lg"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">📁 Vista General</h1>
          <p className="text-indigo-100 mb-4">
            Todas tus áreas organizadas por categoría · {totalAreas} {totalAreas === 1 ? 'área' : 'áreas'} en total
          </p>

          {/* Búsqueda */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Buscar área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Keywords Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6"
      >
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Palabras Clave para Categorización Automática</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Las áreas se agrupan automáticamente según las palabras en su nombre. Usa estas palabras clave al crear áreas:
                </p>
                <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,_1fr))] auto-rows-[1fr]">
                  {Object.entries(AREA_CATEGORIES).map(([key, cat]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cat.keywords.slice(0, 5).map((keyword, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600">
                            {keyword}
                          </span>
                        ))}
                        {cat.keywords.length > 5 && (
                          <span className="text-xs text-gray-500">+{cat.keywords.length - 5}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Renderizar categorías predefinidas */}
        {Object.entries(AREA_CATEGORIES).map(([categoryKey, category]) => {
          const categoryAreas = filterAreasBySearch(categorizedAreas[categoryKey] || []);
          const isExpanded = expandedCategories.has(categoryKey);
          const hasAreas = categoryAreas.length > 0;

          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between bg-white rounded-lg px-6 py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => toggleCategory(categoryKey)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                    {category.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    ({categoryAreas.length} {categoryAreas.length === 1 ? 'área' : 'áreas'})
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(category.panelRoute);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                >
                  Ver Panel →
                </button>
              </div>

              {/* Category Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      {hasAreas ? (
                        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]">
                          {categoryAreas.map((area: any, idx: number) => {
                            const stats = getAreaStats(area.id);
                            return (
                              <motion.div
                                key={area.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="cursor-pointer"
                                onClick={() => navigate(`/areas/${area.id}/dashboard`)}
                              >
                                <Card hover>
                                  <CardBody>
                                    <div className="flex items-start gap-3">
                                      <div className={`text-3xl bg-gradient-to-br ${category.gradient} bg-clip-text text-transparent`}>
                                        {category.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 mb-1 truncate">
                                          {area.name}
                                        </h3>
                                        {area.description && (
                                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {area.description}
                                          </p>
                                        )}
                                        <div className="flex gap-4 text-sm text-gray-500">
                                          <span>🎯 {stats.goalsCount} metas</span>
                                          <span>✅ {stats.tasksCount} tareas</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardBody>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">📭 No hay áreas en esta categoría aún</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Crea un área con palabras como: {category.keywords.slice(0, 3).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Otras Categorías */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="flex items-center justify-between bg-white rounded-lg px-6 py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleCategory('other')}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{expandedCategories.has('other') ? '▼' : '▶'}</span>
              <span className="text-2xl">📂</span>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                Otras Categorías
              </h2>
              <span className="text-sm text-gray-500">
                ({filterAreasBySearch(categorizedAreas.other || []).length} {filterAreasBySearch(categorizedAreas.other || []).length === 1 ? 'área' : 'áreas'})
              </span>
            </div>
          </div>

          <AnimatePresence>
            {expandedCategories.has('other') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  {filterAreasBySearch(categorizedAreas.other || []).length > 0 ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          💡 Estas áreas no pertenecen a ninguna categoría predefinida.
                          Puedes acceder a ellas aquí o renombrarlas con palabras clave para categorizarlas automáticamente.
                        </p>
                      </div>
                      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]">
                        {filterAreasBySearch(categorizedAreas.other || []).map((area: any, idx: number) => {
                          const stats = getAreaStats(area.id);
                          return (
                            <motion.div
                              key={area.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="cursor-pointer"
                              onClick={() => navigate(`/areas/${area.id}/dashboard`)}
                            >
                              <Card
                                hover
                                className="h-full"
                                minHeightClass="min-h-[200px]"
                              >
                                <CardBody>
                                  <div className="flex items-start gap-3">
                                    <div className="text-3xl">
                                      {area.icon || '📁'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-gray-900 mb-1 truncate">
                                        {area.name}
                                      </h3>
                                      {area.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                          {area.description}
                                        </p>
                                      )}
                                      <div className="flex gap-4 text-sm text-gray-500">
                                        <span>🎯 {stats.goalsCount} metas</span>
                                        <span>✅ {stats.tasksCount} tareas</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">✨ Todas tus áreas están categorizadas</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AllAreasOverviewPage;
