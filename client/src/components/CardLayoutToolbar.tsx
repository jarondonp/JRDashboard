import { CardDensity } from '../hooks';
import { Button } from './Button';
import { useMemo } from 'react';

interface SortOption<T extends string = string> {
  value: T;
  label: string;
}

interface CardLayoutToolbarProps<TSort extends string = string> {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions: SortOption<TSort>[];
  sortValue: TSort;
  onSortChange: (value: TSort) => void;
  density: CardDensity;
  onDensityChange: (density: CardDensity) => void;
}

const densityLabels: Record<CardDensity, string> = {
  comfortable: 'Cómodo',
  compact: 'Compacto',
};

export function CardLayoutToolbar<TSort extends string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  sortOptions,
  sortValue,
  onSortChange,
  density,
  onDensityChange,
}: CardLayoutToolbarProps<TSort>) {
  const hasSortOptions = sortOptions.length > 0;

  const nextDensity = useMemo<CardDensity>(
    () => (density === 'comfortable' ? 'compact' : 'comfortable'),
    [density],
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-sm border border-indigo-50 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {hasSortOptions && (
          <select
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value as TSort)}
            className="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Densidad
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDensityChange(nextDensity)}
        >
          Cambiar a {densityLabels[nextDensity]}
        </Button>
      </div>
    </div>
  );
}

