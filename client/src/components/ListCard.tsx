import './ListCard.css';

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  project?: string;
  badge?: {
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  };
  date?: string;
}

interface ListCardProps {
  title: string;
  items: ListItem[];
  emptyMessage?: string;
  maxItems?: number;
  onItemClick?: (id: string) => void;
}

export function ListCard({
  title,
  items,
  emptyMessage = 'No hay elementos para mostrar',
  maxItems = 5,
  onItemClick
}: ListCardProps) {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div className="list-card">
      <div className="list-card__header">
        <h3 className="list-card__title">{title}</h3>
        <span className="list-card__count">{items.length}</span>
      </div>
      <div className="list-card__body">
        {displayItems.length === 0 ? (
          <div className="list-card__empty">{emptyMessage}</div>
        ) : (
          <ul className="list-card__list">
            {displayItems.map((item) => (
              <li
                key={item.id}
                className="list-card__item"
                onClick={() => onItemClick?.(item.id)}
                style={{ cursor: onItemClick ? 'pointer' : 'default' }}
              >
                <div className="list-card__item-content">
                  <div className="list-card__item-header">
                    <div className="list-card__item-title">{item.title}</div>
                    {item.project && (
                      <span className="list-card__project-badge">
                        {item.project}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <div className="list-card__item-subtitle">{item.subtitle}</div>
                  )}
                </div>
                <div className="list-card__item-meta">
                  {item.badge && (
                    <span className={`list-card__badge list-card__badge--${item.badge.color}`}>
                      {item.badge.text}
                    </span>
                  )}
                  {item.date && (
                    <span className="list-card__date">{item.date}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <div className="list-card__footer">
            +{items.length - maxItems} más
          </div>
        )}
      </div>
    </div>
  );
}
