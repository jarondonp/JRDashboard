import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, subtitle, icon, color = 'blue', trend }: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${color}`}>
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
