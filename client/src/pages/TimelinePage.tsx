import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody } from '../components';
import { useAreas, useTimeline, useProjects } from '../hooks';
import type { TimelineEvent, TimelineEventType } from '../services/timelineApi';
import { ALL_TIMELINE_EVENT_TYPES } from '../hooks/useTimeline';

type TimelineRange = '7d' | '30d' | '90d' | 'all';

const RANGE_OPTIONS: { id: TimelineRange; label: string; description: string }[] = [
  { id: '7d', label: '7 días', description: 'Última semana' },
  { id: '30d', label: '30 días', description: 'Últimos 30 días' },
  { id: '90d', label: '90 días', description: 'Último trimestre' },
  { id: 'all', label: 'Todo', description: 'Historial completo' },
];

const EVENT_TYPE_CONFIG: Record<
  TimelineEventType,
  { label: string; icon: string; badgeClass: string; description: string }
> = {
  progress_log: {
    label: 'Avances',
    icon: '📝',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    description: 'Notas de progreso registradas desde Avances',
  },
  task_completed: {
    label: 'Tareas completadas',
    icon: '✅',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Tareas marcadas como completadas',
  },
  goal_completed: {
    label: 'Metas logradas',
    icon: '🎯',
    badgeClass: 'bg-purple-100 text-purple-700',
    description: 'Metas que llegaron al 100%',
  },
  document_added: {
    label: 'Documentos',
    icon: '📄',
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Documentos relevantes agregados',
  },
};

const DEFAULT_AREA_COLOR = '#6366F1';

const formatGroupLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const formatted = date.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatTimeLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRangeStart = (range: TimelineRange): string | undefined => {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  return start.toISOString();
};

const getMoodEmoji = (mood: number) => {
  if (mood >= 5) return '😄';
  if (mood >= 4) return '🙂';
  if (mood >= 3) return '😐';
  if (mood >= 2) return '😕';
  return '😞';
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

interface TimelineGroup {
  key: string;
  label: string;
  events: TimelineEvent[];
}

function TimelinePage() {
  const { data: areasData } = useAreas();
  const { data: projectsData } = useProjects();
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [range, setRange] = useState<TimelineRange>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<TimelineEventType[]>(ALL_TIMELINE_EVENT_TYPES);

  const fromIso = useMemo(() => getRangeStart(range), [range]);
  const areaFilter = selectedArea || undefined;
  const projectFilter = selectedProject || undefined;

  const timelineQuery = useTimeline({
    areaId: areaFilter,
    projectId: projectFilter,
    eventTypes: selectedTypes,
    from: fromIso,
    pageSize: 25,
    enabled: selectedTypes.length > 0,
  });

  const allEvents = useMemo(() => {
    if (!timelineQuery.data) return [] as TimelineEvent[];
    return timelineQuery.data.pages.flatMap((page) => page.items);
  }, [timelineQuery.data]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return allEvents;
    return allEvents.filter((event) => {
      const haystack = [
        event.title,
        event.subtitle ?? '',
        event.area.name,
        event.goal?.title ?? '',
        event.task?.title ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [allEvents, searchTerm]);

  const groupedEvents = useMemo<TimelineGroup[]>(() => {
    if (!filteredEvents.length) return [];
    const groups = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((event) => {
      const dateKey = (() => {
        const raw = event.date ?? event.createdAt;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return raw.split('T')[0] ?? raw;
        return date.toISOString().split('T')[0];
      })();
      const current = groups.get(dateKey) ?? [];
      current.push(event);
      groups.set(dateKey, current);
    });

    return Array.from(groups.entries())
      .map(([key, events]) => ({
        key,
        label: formatGroupLabel(key),
        events: events.sort((a, b) => {
          if (a.createdAt === b.createdAt) return a.id.localeCompare(b.id);
          return a.createdAt > b.createdAt ? -1 : 1;
        }),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [filteredEvents]);

  const toggleType = (type: TimelineEventType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== type);
      }
      return [...prev, type];
    });
  };

  const resetFilters = () => {
    setSelectedArea('');
    setSelectedProject('');
    setRange('30d');
    setSearchTerm('');
    setSelectedTypes(ALL_TIMELINE_EVENT_TYPES);
  };

  const isEmptyState =
    !timelineQuery.isLoading &&
    !timelineQuery.isError &&
    selectedTypes.length > 0 &&
    groupedEvents.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">🕒 Timeline Maestro</h1>
          <p className="text-indigo-100 max-w-2xl">
            Revisa la actividad consolidada de tus áreas: avances, tareas completadas, metas alcanzadas y
            documentos relevantes, todo en un mismo flujo cronológico.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <Card>
          <CardBody className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">
              <div className="flex-1 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Área
                </label>
                <select
                  className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {(areasData ?? []).map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Proyecto
                </label>
                <select
                  className="w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  {(projectsData ?? []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Buscar en timeline
                </label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por título, área, meta, tarea..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 self-start">
                <Button variant="ghost" onClick={resetFilters}>
                  Reiniciar filtros
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Rango temporal
              </p>
              <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant={range === option.id ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setRange(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tipos de evento
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_TIMELINE_EVENT_TYPES.map((type) => {
                  const config = EVENT_TYPE_CONFIG[type];
                  const isActive = selectedTypes.includes(type);
                  return (
                    <Button
                      key={type}
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => toggleType(type)}
                    >
                      <span className="text-lg">{config.icon}</span>
                      {config.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Selecciona al menos un tipo para visualizar eventos.
              </p>
            </div>
          </CardBody>
        </Card>

        {selectedTypes.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">
                Selecciona al menos un tipo de evento para mostrar resultados.
              </p>
            </CardBody>
          </Card>
        )}

        {timelineQuery.isError && (
          <Card>
            <CardBody className="flex flex-col items-center gap-4 text-center py-12">
              <p className="text-red-500 font-semibold">
                Hubo un problema al cargar la actividad reciente.
              </p>
              <Button variant="primary" onClick={() => timelineQuery.refetch()}>
                Reintentar
              </Button>
            </CardBody>
          </Card>
        )}

        {timelineQuery.isLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, idx) => (
              <Card key={idx}>
                <CardBody>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/5" />
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-3/5" />
                      <div className="h-3 bg-gray-200 rounded w-2/5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {isEmptyState && (
          <Card>
            <CardBody className="py-16 text-center space-y-3">
              <p className="text-2xl">📭</p>
              <p className="text-gray-600 font-semibold">
                No hay eventos para los filtros seleccionados.
              </p>
              <p className="text-sm text-gray-500">
                Ajusta el rango temporal o los tipos de evento para ver más actividad.
              </p>
            </CardBody>
          </Card>
        )}

        {groupedEvents.map((group) => (
          <div key={group.key} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
              <span className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                {group.label}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-indigo-200 to-transparent" />
            </div>

            <div className="space-y-3">
              {group.events.map((event) => {
                const typeConfig = EVENT_TYPE_CONFIG[event.type];
                const areaColor = event.area.color ?? DEFAULT_AREA_COLOR;
                const areaBadgeStyle = {
                  backgroundColor: `${areaColor}26`,
                  color: areaColor,
                };

                const meta = event.meta ?? {};
                const metaBadges: { key: string; text: string; className?: string }[] = [];

                if (typeof meta.progress === 'number') {
                  metaBadges.push({
                    key: 'progress',
                    text: `Progreso: ${meta.progress}%`,
                    className: 'bg-indigo-50 text-indigo-700',
                  });
                }

                if (typeof meta.mood === 'number') {
                  metaBadges.push({
                    key: 'mood',
                    text: `Mood ${getMoodEmoji(meta.mood)} ${meta.mood}/5`,
                    className: 'bg-purple-50 text-purple-700',
                  });
                }

                if (typeof meta.impact === 'number') {
                  metaBadges.push({
                    key: 'impact',
                    text: `Impacto ${meta.impact}/5`,
                    className: 'bg-emerald-50 text-emerald-700',
                  });
                }

                if (isNonEmptyString(meta.docType)) {
                  metaBadges.push({
                    key: 'docType',
                    text: `Tipo: ${meta.docType}`,
                    className: 'bg-amber-50 text-amber-700',
                  });
                }

                if (isNonEmptyString(meta.reviewDate)) {
                  const reviewDate = new Date(meta.reviewDate);
                  if (!Number.isNaN(reviewDate.getTime())) {
                    metaBadges.push({
                      key: 'reviewDate',
                      text: `Revisión: ${reviewDate.toLocaleDateString('es')}`,
                      className: 'bg-blue-50 text-blue-700',
                    });
                  }
                }

                if (Array.isArray(meta.tags) && meta.tags.length) {
                  meta.tags.forEach((tag: unknown, idx: number) => {
                    if (typeof tag === 'string' && tag.trim().length > 0) {
                      metaBadges.push({
                        key: `tag-${idx}`,
                        text: `#${tag.trim()}`,
                        className: 'bg-gray-100 text-gray-700',
                      });
                    }
                  });
                }

                const docUrl =
                  typeof meta.url === 'string' && meta.url.trim().length ? meta.url.trim() : undefined;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full" minHeightClass="min-h-[160px]">
                      <CardBody className="space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl" aria-hidden>
                              {typeConfig.icon}
                            </span>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${typeConfig.badgeClass}`}
                                >
                                  {typeConfig.label}
                                </span>
                                <span
                                  className="text-xs font-semibold px-2 py-1 rounded-full"
                                  style={areaBadgeStyle}
                                >
                                  {event.area.name}
                                </span>
                              </div>
                              {event.subtitle && (
                                <p className="text-sm text-gray-600">{event.subtitle}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                {event.goal && (
                                  <span className="font-medium text-gray-600">
                                    🎯 Meta: {event.goal.title ?? 'Sin título'}
                                  </span>
                                )}
                                {event.task && (
                                  <span className="font-medium text-gray-600">
                                    ✅ Tarea: {event.task.title ?? 'Sin título'}
                                  </span>
                                )}
                                {event.project && (
                                  <span className="font-medium text-gray-600">
                                    📁 Proyecto: {event.project.code ? <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded mr-1">[{event.project.code}]</span> : ''}{event.project.title ?? 'Sin título'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 whitespace-nowrap">
                            {formatTimeLabel(event.createdAt)}
                          </div>
                        </div>

                        {metaBadges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {metaBadges.map((badge) => (
                              <span
                                key={badge.key}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className ?? 'bg-gray-100 text-gray-700'}`}
                              >
                                {badge.text}
                              </span>
                            ))}
                          </div>
                        )}

                        {docUrl && (
                          <div>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              Ver documento ↗
                            </a>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {timelineQuery.hasNextPage && selectedTypes.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => timelineQuery.fetchNextPage()}
              isLoading={timelineQuery.isFetchingNextPage}
            >
              Cargar más eventos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelinePage;


