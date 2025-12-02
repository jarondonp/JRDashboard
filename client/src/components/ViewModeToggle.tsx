import { Button } from './Button';

export type ViewMode = 'cards' | 'table';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-indigo-100 bg-white shadow-sm">
      <Button
        type="button"
        variant={mode === 'cards' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('cards')}
        className="rounded-l-lg rounded-r-none"
      >
        Tarjetas
      </Button>
      <Button
        type="button"
        variant={mode === 'table' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
        className="rounded-r-lg rounded-l-none border-l border-indigo-100"
      >
        Lista
      </Button>
    </div>
  );
}



