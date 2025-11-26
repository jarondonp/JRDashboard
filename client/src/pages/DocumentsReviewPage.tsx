import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, useToast } from '../components';
import { useDocuments, useAreas, useGoals } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '../services/apiClient';

type PriorityFilter = 'all' | 'alta' | 'media' | 'baja';
type ReviewWindow = '7' | '14' | '30' | 'all';

const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: 'Todas',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const WINDOW_OPTIONS: Array<{ id: ReviewWindow; label: string; days?: number }> = [
  { id: '7', label: 'Próximos 7 días', days: 7 },
  { id: '14', label: '14 días', days: 14 },
  { id: '30', label: '30 días', days: 30 },
  { id: 'all', label: 'Todo', days: undefined },
];

const DEFAULT_AREA_COLOR = '#F97316';

const normalizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const formatDate = (value?: string | null, fallback = 'Sin fecha') => {
  const parsed = normalizeDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysUntil = (value?: string | null) => {
  const parsed = normalizeDate(value);
  if (!parsed) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = parsed.getTime() - today.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getPriorityClass = (priority?: string | null, daysRemaining?: number) => {
  if (priority === 'alta' || (daysRemaining !== undefined && daysRemaining <= 3)) {
    return 'bg-red-100 text-red-700';
  }
  if (priority === 'media' || (daysRemaining !== undefined && daysRemaining <= 7)) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-emerald-100 text-emerald-700';
};

async function markDocumentReviewed(id: string) {
  return apiPut(`/documents/${id}`, { reviewed_at: new Date().toISOString().split('T')[0] });
}

function DocumentsReviewPage() {
  const { data: documents, isLoading, error } = useDocuments();
  const { data: areas } = useAreas();
  const { data: goals } = useGoals();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [windowFilter, setWindowFilter] = useState<ReviewWindow>('7');
  const [searchTerm, setSearchTerm] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (id: string) => markDocumentReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showToast('Documento marcado como revisado', 'success');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error || err.message || 'Error al marcar como revisado';
      showToast(message, 'error');
    },
  });

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    const search = searchTerm.trim().toLowerCase();
    const lookupDays = WINDOW_OPTIONS.find((option) => option.id === windowFilter)?.days;

    return documents
      .filter((doc) => {
        const days = daysUntil(doc.review_date);
        const matchesWindow =
          lookupDays === undefined || (Number.isFinite(days) && days <= lookupDays && days >= 0);
        const matchesPriority =
          priorityFilter === 'all' || (doc.doc_type ?? '').toLowerCase() === priorityFilter;
        const matchesSearch =
          !search ||
          doc.title.toLowerCase().includes(search) ||
          (doc.description ?? '').toLowerCase().includes(search);

        return matchesWindow && matchesPriority && matchesSearch;
      })
      .sort((a, b) => {
        const daysA = daysUntil(a.review_date);
        const daysB = daysUntil(b.review_date);
        return daysA - daysB;
      });
  }, [documents, priorityFilter, windowFilter, searchTerm]);

  const summary = useMemo(() => {
    const total = filteredDocuments.length;
    const urgent = filteredDocuments.filter((doc) => daysUntil(doc.review_date) <= 3).length;
    const dueThisWeek = filteredDocuments.filter((doc) => {
      const diff = daysUntil(doc.review_date);
      return diff >= 0 && diff <= 7;
    }).length;

    return {
      total,
      urgent,
      dueThisWeek,
    };
  }, [filteredDocuments]);

  const getAreaName = (id: string) => areas?.find((area) => area.id === id)?.name || 'Área sin nombre';
  const getAreaColor = (id: string) => areas?.find((area) => area.id === id)?.color || DEFAULT_AREA_COLOR;
  const getGoalTitle = (id?: string | null) =>
    id ? goals?.find((goal) => goal.id === id)?.title || 'Meta sin título' : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 p-8">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 p-8">
        <Card>
          <CardBody>
            <p className="text-red-600">Error: {error.message}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white px-8 py-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">📄 Documentos en Revisión</h1>
          <p className="text-rose-100 max-w-2xl">
            Visualiza los documentos que necesitan tu atención próximamente. Revisa antes de que expiren y mantén tu
            plan en orden.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documentos pendientes</p>
              <p className="text-3xl font-bold text-rose-600">{summary.total}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgentes (≤3 días)</p>
              <p className="text-3xl font-bold text-red-600">{summary.urgent}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revisión esta semana</p>
              <p className="text-3xl font-bold text-amber-600">{summary.dueThisWeek}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Buscar</label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Título o descripción..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PRIORITY_LABELS) as PriorityFilter[]).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={priorityFilter === key ? 'primary' : 'ghost'}
                      onClick={() => setPriorityFilter(key)}
                    >
                      {PRIORITY_LABELS[key]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ventana de revisión</label>
                <div className="flex flex-wrap gap-2">
                  {WINDOW_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={windowFilter === option.id ? 'secondary' : 'ghost'}
                      onClick={() => setWindowFilter(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPriorityFilter('all');
                    setWindowFilter('7');
                    setSearchTerm('');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center space-y-3">
              <p className="text-2xl">🌟</p>
              <p className="text-gray-600 font-semibold">No tienes documentos próximos a revisión.</p>
              <p className="text-sm text-gray-500">
                Mantén tu repositorio al día para evitar sorpresas y conservar tus logros documentados.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,_1fr))]">
            {filteredDocuments.map((doc) => {
              const days = daysUntil(doc.review_date);
              const priorityClass = getPriorityClass(doc.doc_type, days);
              const areaColor = getAreaColor(doc.area_id);
              const areaStyle = { backgroundColor: `${areaColor}1A`, color: areaColor };

              return (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  <Card hover className="h-full" minHeightClass="min-h-[220px]">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{doc.title}</h3>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full font-semibold" style={areaStyle}>
                              {getAreaName(doc.area_id)}
                            </span>
                            {doc.goal_id && (
                              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                                Meta: {getGoalTitle(doc.goal_id)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityClass}`}>
                            {doc.doc_type ? doc.doc_type.toUpperCase() : 'SIN PRIORIDAD'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Revisión: <strong>{formatDate(doc.review_date)}</strong>
                          </span>
                          {Number.isFinite(days) && (
                            <span
                              className={`text-xs font-semibold ${
                                days <= 3 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {days >= 0 ? `${days} días restantes` : 'Atrasado'}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                      {doc.url && (
                        <div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-800"
                          >
                            Abrir documento ↗
                          </a>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate(doc.id)}
                        >
                          Marcar como revisado
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`mailto:?subject=Revisión pendiente: ${doc.title}`)}
                        >
                          Notificar por email
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsReviewPage;

