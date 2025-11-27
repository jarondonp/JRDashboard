import { KeyboardEvent } from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick,
}: MetricCardProps) {
  const interactive = typeof onClick === 'function';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`metric-card metric-card--${color} ${interactive ? 'metric-card--interactive' : ''}`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="metric-card__header">
        {icon && <span className="metric-card__icon">{icon}</span>}
        <h3 className="metric-card__title">{title}</h3>
      </div>
      <div className="metric-card__body">
        <div className="metric-card__value">{value}</div>
        {subtitle && <div className="metric-card__subtitle">{subtitle}</div>}
      </div>
      {trend && (
        <div className={`metric-card__trend metric-card__trend--${trend}`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
        </div>
      )}
    </div>
  );
}
