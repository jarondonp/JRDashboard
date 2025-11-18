import './ProgressCard.css';

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showPercentage?: boolean;
}

export function ProgressCard({ 
  title, 
  current, 
  total, 
  subtitle, 
  color = 'blue',
  showPercentage = true 
}: ProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`progress-card progress-card--${color}`}>
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
