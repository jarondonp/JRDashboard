import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../hooks';
import type { GlobalSearchHit, GlobalSearchResponse } from '../services/searchApi';

type FlatSearchItem = GlobalSearchHit & {
  section: string;
  flatIndex: number;
};

type GroupedSearchSection = {
  label: string;
  items: FlatSearchItem[];
};

const MIN_QUERY_LENGTH = 2;
const TYPE_ICONS: Record<GlobalSearchHit['type'], string> = {
  area: '🗂️',
  goal: '🎯',
  task: '✅',
  document: '📄',
};

const formatDate = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return value.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return value;
  }
  return undefined;
};

const normalizeStatus = (status?: unknown) => {
  if (!status || typeof status !== 'string') return undefined;
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1).replace(/_/g, ' ');
};

const buildMetaChips = (item: GlobalSearchHit) => {
  const chips: string[] = [];
  const meta = item.meta ?? {};

  if (item.type === 'goal') {
    const status = normalizeStatus(meta.status);
    if (status) chips.push(`Estado: ${status}`);
    const dueDate = formatDate(meta.dueDate);
    if (dueDate) chips.push(`Vence ${dueDate}`);
  }

  if (item.type === 'task') {
    const status = normalizeStatus(meta.status);
    if (status) chips.push(`Estado: ${status}`);
    const dueDate = formatDate(meta.dueDate);
    if (dueDate) chips.push(`Vence ${dueDate}`);
    if (typeof meta.progress === 'number') {
      chips.push(`Progreso: ${meta.progress}%`);
    }
    if (Array.isArray(meta.tags) && meta.tags.length) {
      chips.push(`Tags: ${meta.tags.slice(0, 3).join(', ')}`);
      if (meta.tags.length > 3) chips.push(`+${meta.tags.length - 3} más`);
    }
    if (meta.goalTitle && typeof meta.goalTitle === 'string') {
      chips.push(`Meta: ${meta.goalTitle}`);
    }
  }

  if (item.type === 'document') {
    if (meta.docType && typeof meta.docType === 'string') {
      chips.push(`Tipo: ${meta.docType}`);
    }
    const reviewDate = formatDate(meta.reviewDate);
    if (reviewDate) chips.push(`Revisión: ${reviewDate}`);
  }

  if (item.type === 'area') {
    if (meta.category && typeof meta.category === 'string') {
      chips.push(`Categoría: ${meta.category}`);
    }
  }

  return chips.slice(0, 4);
};

const extractSections = (data?: GlobalSearchResponse): GroupedSearchSection[] => {
  if (!data) return [];

  const sections = [
    { label: 'Áreas', items: data.results.areas },
    { label: 'Metas', items: data.results.goals },
    { label: 'Tareas', items: data.results.tasks },
    { label: 'Documentos', items: data.results.documents },
  ].filter((section) => section.items.length > 0);

  let cursor = 0;
  return sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => {
      const flatItem: FlatSearchItem = {
        ...item,
        section: section.label,
        flatIndex: cursor,
      };
      cursor += 1;
      return flatItem;
    }),
  }));
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isFetching, error } = useGlobalSearch(debouncedQuery, {
    enabled: isOpen,
  });

  const groupedSections = useMemo(() => extractSections(data), [data]);

  const flatItems = useMemo(
    () => groupedSections.flatMap((section) => section.items),
    [groupedSections],
  );

  const activeItem = activeIndex >= 0 ? flatItems[activeIndex] : undefined;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 150);
    return () => window.clearTimeout(timer);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(-1);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (flatItems.length === 0) {
      setActiveIndex(-1);
    } else {
      setActiveIndex(0);
    }
  }, [flatItems.length, isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleNavigate = (item: FlatSearchItem) => {
    navigate(item.path, {
      state: {
        fromSearch: true,
        entityType: item.type,
        entityId: item.id,
      },
    });
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex((prev) => {
        if (prev < 0) return 0;
        const next = prev + 1;
        return next >= flatItems.length ? 0 : next;
      });
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex((prev) => {
        if (prev < 0) return flatItems.length - 1;
        const next = prev - 1;
        return next < 0 ? flatItems.length - 1 : next;
      });
    }

    if (event.key === 'Enter' && activeItem) {
      event.preventDefault();
      handleNavigate(activeItem);
    }
  };

  const renderSections = () => {
    if (error) {
      return (
        <div className="px-4 py-8 text-sm text-red-300">
          Ocurrió un error al buscar. Intenta nuevamente en unos segundos.
        </div>
      );
    }

    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      return (
        <div className="px-4 py-8 text-sm text-slate-300/80">
          Ingresa al menos {MIN_QUERY_LENGTH} caracteres para iniciar la búsqueda.
        </div>
      );
    }

    if (isFetching) {
      return (
        <div className="flex items-center gap-3 px-4 py-8 text-sm text-slate-300/80">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
          Buscando resultados…
        </div>
      );
    }

    if (!flatItems.length) {
      return (
        <div className="px-4 py-8 text-sm text-slate-300/80">
          No se encontraron resultados para “{debouncedQuery}”.
        </div>
      );
    }

    return (
      <div className="max-h-[60vh] overflow-y-auto pb-2">
        {groupedSections.map((section) => (
          <div key={section.label} className="py-1">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400/80">
              {section.label}
            </p>
            <ul className="space-y-1 px-2">
              {section.items.map((item) => {
                const isActive = activeIndex === item.flatIndex;
                const metaChips = buildMetaChips(item);
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isActive
                          ? 'border-indigo-400/60 bg-indigo-500/10 shadow-inner'
                          : 'border-transparent bg-white/5 hover:border-indigo-400/30 hover:bg-white/10'
                      }`}
                      onMouseEnter={() => setActiveIndex(item.flatIndex)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleNavigate(item);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{TYPE_ICONS[item.type]}</span>
                            <span className="text-sm font-semibold text-slate-100">
                              {item.title}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className="mt-1 text-xs text-slate-300/80">
                              {item.subtitle}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {item.area && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-700/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-100">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: item.area.color ?? '#6366F1',
                                  }}
                                />
                                {item.area.name}
                              </span>
                            )}
                            {metaChips.map((chip) => (
                              <span
                                key={chip}
                                className="inline-flex items-center rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-200"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Enter ↵
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm">
            <span role="img" aria-hidden="true">
              🔍
            </span>
            Buscar en todo el dashboard…
          </span>
          <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Ctrl + K
          </span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[120] bg-slate-900/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto mt-24 max-w-3xl px-4">
              <motion.div
                className="overflow-hidden rounded-2xl bg-slate-900/95 shadow-2xl ring-1 ring-white/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-3 border-b border-white/10 bg-slate-900/60 px-4 py-3">
                  <span className="text-lg text-slate-400">🔍</span>
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe para buscar áreas, metas, tareas o documentos…"
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300 transition hover:bg-white/10"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {renderSections()}

                <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/70 px-4 py-3 text-[11px] text-slate-500">
                  <span>Usa ↑ ↓ para navegar • Enter para abrir • Esc para cerrar</span>
                  <span>Resultados totales: {flatItems.length}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default GlobalSearch;


