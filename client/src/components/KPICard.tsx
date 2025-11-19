interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export function KPICard({ title, value, trend, icon, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>{title}</p>
          <p className={`${textColorClasses[color]}`} style={{ fontSize: '2rem', fontWeight: '700', lineHeight: '1' }}>
            {value}
          </p>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              <span style={{ color: trend.isPositive ? '#10b981' : '#ef4444' }}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && <span style={{ fontSize: '2rem' }}>{icon}</span>}
      </div>
    </div>
  );
}
