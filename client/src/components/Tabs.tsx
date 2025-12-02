import type { ReactNode } from 'react';

export interface TabOption {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="tabs-container">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface TabsContentProps {
  children: ReactNode;
}

export function TabsContent({ children }: TabsContentProps) {
  return <div className="tabs-content">{children}</div>;
}



