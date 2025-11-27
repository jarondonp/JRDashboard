import { KeyboardEvent } from 'react';
import './ProgressCard.css';

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showPercentage?: boolean;
  onClick?: () => void;
}

export function ProgressCard({ 
  title, 
  current, 
  total, 
  subtitle, 
  color = 'blue',
  showPercentage = true,
  onClick,
}: ProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
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
      className={`progress-card progress-card--${color} ${interactive ? 'progress-card--interactive' : ''}`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="progress-card__header">
        <h3 className="progress-card__title">{title}</h3>
        {showPercentage && <span className="progress-card__percentage">{percentage}%</span>}
      </div>
      <div className="progress-card__bar">
        <div 
          className="progress-card__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-card__footer">
        <span className="progress-card__count">{current} de {total}</span>
        {subtitle && <span className="progress-card__subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
