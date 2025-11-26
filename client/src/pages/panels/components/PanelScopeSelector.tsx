import React from 'react';
import type { PanelScopeOption } from '../../../hooks/usePanelScopeSelection';

interface PanelScopeSelectorProps {
  options: PanelScopeOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const PanelScopeSelector: React.FC<PanelScopeSelectorProps> = ({ options, selectedId, onSelect }) => {
  if (!options.length || options.length === 1) {
    return null;
  }

  const activeOption =
    options.find((option) => option.id === selectedId) ?? options[0];

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-4 mb-6">
      <p className="text-sm font-semibold text-gray-600 mb-3">
        Elige la perspectiva que quieres analizar:
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.id === selectedId || (!selectedId && option.id === options[0].id);
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
      {activeOption?.description && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          {activeOption.description}
        </p>
      )}
    </div>
  );
};

export default PanelScopeSelector;


