import { useEffect, useMemo, useState } from 'react';
import type { AreaDashboardData } from '../services/areasDashboardApi';
import type { CategorisedAreaDashboard } from '../utils/categoryDashboard';

export interface PanelScopeOption {
  id: string;
  label: string;
  description?: string;
  type: 'global' | 'area';
  icon?: string;
}

interface UsePanelScopeSelectionParams {
  aggregatedDashboard?: AreaDashboardData;
  dashboards: CategorisedAreaDashboard[];
  subtitle?: string;
  globalLabel?: string;
  globalIcon?: string;
  initialSelectedId?: string;
}

export const usePanelScopeSelection = ({
  aggregatedDashboard,
  dashboards,
  subtitle,
  globalLabel = 'Visión global',
  globalIcon = '🌐',
  initialSelectedId,
}: UsePanelScopeSelectionParams) => {
  const options = useMemo<PanelScopeOption[]>(() => {
    const items: PanelScopeOption[] = [];

    if (aggregatedDashboard) {
      items.push({
        id: aggregatedDashboard.area.id,
        label: globalLabel,
        description: subtitle || aggregatedDashboard.area.description,
        type: 'global',
        icon: globalIcon,
      });
    }

    dashboards.forEach(({ area }) => {
      items.push({
        id: area.id,
        label: area.name,
        description: area.description ?? undefined,
        type: 'area',
        icon: area.icon ?? undefined,
      });
    });

    return items;
  }, [aggregatedDashboard, dashboards, globalIcon, globalLabel, subtitle]);

  const [selectedId, setSelectedId] = useState<string | undefined>(() => {
    if (initialSelectedId && options.some((option) => option.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return options[0]?.id;
  });

  useEffect(() => {
    if (!options.length) {
      setSelectedId(undefined);
      return;
    }

    const preferredId =
      (initialSelectedId && options.some((option) => option.id === initialSelectedId)
        ? initialSelectedId
        : undefined) ?? options[0]?.id;

    if (preferredId !== selectedId) {
      setSelectedId(preferredId);
    }
  }, [options, selectedId, initialSelectedId]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId],
  );

  const scopeType = selectedOption?.type ?? 'area';

  let currentDashboard: AreaDashboardData | undefined;
  let currentArea: CategorisedAreaDashboard['area'] | undefined;

  if (selectedOption?.type === 'global' && aggregatedDashboard) {
    currentDashboard = aggregatedDashboard;
    currentArea = aggregatedDashboard.area;
  } else if (selectedOption?.type === 'area') {
    const entry = dashboards.find((dashboard) => dashboard.area.id === selectedOption.id);
    currentDashboard = entry?.dashboard;
    currentArea = entry?.area;
  }

  return {
    options,
    selectedId,
    setSelectedId,
    selectedOption,
    scopeType,
    currentDashboard,
    currentArea,
  };
};


