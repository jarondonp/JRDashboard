import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

type MenuItem = {
  id: string;
  label: string;
  icon?: string;
  to?: string;
  children?: MenuItem[];
};

type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

const FAVORITES_STORAGE_KEY = 'dashboardjr:favorites';
const SIDEBAR_COLLAPSED_KEY = 'dashboardjr:sidebar-collapsed';
const DEFAULT_FAVORITES = ['dashboard', 'tasks'];

const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'principal',
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', to: '/' },
      { id: 'timeline', label: 'Timeline', icon: '🕒', to: '/timeline' },
    ],
  },
  {
    id: 'operativo',
    title: 'GESTIÓN OPERATIVA',
    items: [
      {
        id: 'areas',
        label: 'Áreas',
        icon: '🗂️',
        to: '/areas',
      },
      {
        id: 'goals',
        label: 'Metas',
        icon: '🎯',
        to: '/goals',
        children: [
          { id: 'goals-by-area', label: 'Metas por Área', icon: '🌐', to: '/goals/by-area' },
          { id: 'compliance', label: 'Cumplimiento', icon: '📏', to: '/analytics/compliance' },
        ],
      },
      {
        id: 'tasks',
        label: 'Tareas',
        icon: '✅',
        to: '/tasks',
        children: [
          { id: 'tasks-overdue', label: 'Atrasadas', icon: '🚨', to: '/tasks/overdue' },
        ],
      },
      {
        id: 'documents',
        label: 'Documentos',
        icon: '📄',
        to: '/documents',
        children: [
          { id: 'documents-review', label: 'Revisiones', icon: '⏰', to: '/documents/review' },
        ],
      },
    ],
    defaultOpen: true,
    collapsible: true,
  },
  {
    id: 'areas-life',
    title: 'ÁREAS DE VIDA',
    items: [
      { id: 'areas-overview', label: 'Vista General', icon: '💎', to: '/overview' },
      { id: 'panel-emotional', label: 'Salud y Bienestar', icon: '❤️', to: '/panel/emotional' },
      { id: 'panel-professional', label: 'Profesional', icon: '💼', to: '/panel/commercial' },
      { id: 'panel-financial', label: 'Financiero', icon: '💰', to: '/panel/financial' },
      { id: 'panel-migration', label: 'Migración', icon: '✈️', to: '/panel/migration' },
      { id: 'panel-scholarships', label: 'Becas', icon: '🎓', to: '/panel/scholarships' },
      { id: 'panel-vocational', label: 'Vocacional', icon: '🌟', to: '/panel/vocational' },
    ],
    collapsible: true,
    defaultOpen: false,
  },
  {
    id: 'analytics',
    title: 'ANALYTICS',
    items: [
      { id: 'reports', label: 'Reportes', icon: '📊', to: '/reports' },
      { id: 'progress', label: 'Avances', icon: '📈', to: '/progress' },
    ],
    collapsible: true,
    defaultOpen: true,
  },
];

function flattenItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) =>
    item.children ? [item, ...flattenItems(item.children)] : [item],
  );
}

const allLeafItems: MenuItem[] = flattenItems(
  MENU_SECTIONS.flatMap((section) => section.items),
).filter((item) => item.to);

const itemMap = new Map(allLeafItems.map((item) => [item.id, item]));

const favoriteDefaults = DEFAULT_FAVORITES.filter((id) => itemMap.has(id));

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return stored === 'true';
    } catch (error) {
      console.error('Error loading sidebar collapsed state from storage', error);
      return false;
    }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => itemMap.has(id));
        }
      }
    } catch (error) {
      console.error('Error loading favorites from storage', error);
    }
    return favoriteDefaults;
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MENU_SECTIONS.forEach((section) => {
      initial[section.id] = section.collapsible ? !!section.defaultOpen : true;
    });
    return initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch (error) {
      console.error('Error saving sidebar collapsed state', error);
    }
    document.body.dataset.sidebarCollapsed = isCollapsed ? 'true' : 'false';
    return () => {
      document.body.dataset.sidebarCollapsed = 'false';
    };
  }, [isCollapsed]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((fav) => fav !== id);
      }
      return [...prev, id];
    });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to storage', error);
    }
  }, [favorites]);

  const favoriteItems = useMemo(
    () => favorites.map((id) => itemMap.get(id)).filter(Boolean) as MenuItem[],
    [favorites],
  );

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderLink = (item: MenuItem, isChild = false) => {
    const icon = item.icon ? <span className="nav-item-icon">{item.icon}</span> : null;
    const favorite = favorites.includes(item.id);
    const menuLevel = isChild ? 2 : 1;

    if (item.children && item.children.length > 0) {
      const isOpen = openSections[item.id] ?? true;
      const toggle = () =>
        setOpenSections((prev) => ({
          ...prev,
          [item.id]: !isOpen,
        }));

      return (
        <li
          key={item.id}
          className="nav-item nav-item-parent"
          data-open={isOpen ? 'true' : 'false'}
          data-level={menuLevel}
        >
          <button
            type="button"
            className="nav-parent-button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls={`nav-group-${item.id}`}
            data-level={menuLevel}
          >
            <span className="nav-item-content">
              {icon}
              <span className="nav-item-label" title={isCollapsed ? item.label : undefined}>
                {item.label}
              </span>
            </span>
            <span className={`nav-parent-indicator ${isOpen ? 'open' : ''}`}>▾</span>
          </button>
          <ul
            id={`nav-group-${item.id}`}
            className="nav-sublist"
            role="group"
            aria-hidden={!isOpen}
            data-open={isOpen ? 'true' : 'false'}
          >
            {isOpen && item.children.map((child) => renderLink(child, true))}
          </ul>
        </li>
      );
    }

    return (
      <li key={item.id} className={`nav-item ${isChild ? 'nav-subitem' : ''}`}>
        <NavLink
          to={item.to ?? '#'}
          className={({ isActive: routeActive }) =>
            `nav-link ${routeActive || isActive(item.to) ? 'active' : ''} ${
              isChild ? 'nav-link-sub' : ''
            }`
          }
          title={isCollapsed ? item.label : undefined}
        >
          <span className="nav-item-content">
            {icon}
            <span className="nav-item-label">{item.label}</span>
          </span>
        </NavLink>
        <button
          type="button"
          className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`}
          onClick={() => toggleFavorite(item.id)}
          aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          tabIndex={isCollapsed ? -1 : 0}
        >
          {favorite ? '★' : '☆'}
        </button>
      </li>
    );
  };

  return (
    <nav className={`nav ${isCollapsed ? 'nav-collapsed' : ''}`}>
      <div className="nav-header">
        <div className="nav-header-top">
          <div className="nav-branding">
            <h1 className="nav-title">Javier 360° PMO</h1>
            <p className="nav-subtitle">Personal Management Office</p>
          </div>
          <button
            type="button"
            className="nav-collapse-toggle"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? '➤' : '◀'}
          </button>
        </div>
        {!isCollapsed && <GlobalSearch />}
      </div>

      {favoriteItems.length > 0 && (
        <div className="nav-section">
          <h3 className="nav-section-title">FAVORITOS</h3>
          <ul>
            {favoriteItems.map((item) => (
              <li key={item.id} className="nav-item">
                <NavLink
                  to={item.to ?? '#'}
                  className={({ isActive: routeActive }) =>
                    `nav-link ${routeActive || isActive(item.to) ? 'active' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="nav-item-content">
                    {item.icon ? <span className="nav-item-icon">{item.icon}</span> : null}
                    <span className="nav-item-label">{item.label}</span>
                  </span>
                </NavLink>
                <button
                  type="button"
                  className="favorite-toggle is-favorite"
                  onClick={() => toggleFavorite(item.id)}
                  aria-label="Quitar de favoritos"
                >
                  ★
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {MENU_SECTIONS.map((section) => {
        const isOpen = openSections[section.id] ?? true;
        const canToggle = section.collapsible;

        const sectionHeader = canToggle ? (
          <button
            type="button"
            className="nav-section-title nav-section-button"
            onClick={() =>
              setOpenSections((prev) => ({
                ...prev,
                [section.id]: !isOpen,
              }))
            }
          >
            <span>{section.title}</span>
            <span className={`nav-parent-indicator ${isOpen ? 'open' : ''}`}>▾</span>
          </button>
        ) : (
          <h3 className="nav-section-title">{section.title}</h3>
        );

        return (
          <div key={section.id} className="nav-section">
            {sectionHeader}
            {(!canToggle || isOpen) && (
              <ul>
                {section.items.map((item) => renderLink(item))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Sidebar;


