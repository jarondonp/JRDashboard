import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuickActions } from '../hooks';
import { useToast } from './Toast';

const QUICK_ACTIONS = [
  {
    id: 'task:create' as const,
    title: 'Nueva tarea',
    subtitle: 'Captura una acción concreta',
    icon: '✅',
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'goal:create' as const,
    title: 'Nueva meta',
    subtitle: 'Define un objetivo estratégico',
    icon: '🎯',
    accent: 'from-violet-500 to-purple-500',
  },
  {
    id: 'progress:create' as const,
    title: 'Registrar avance',
    subtitle: 'Actualiza el progreso y mood',
    icon: '📈',
    accent: 'from-emerald-500 to-teal-500',
  },
] as const;

export function QuickActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { trigger } = useQuickActions();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleTrigger = (actionId: (typeof QUICK_ACTIONS)[number]['id']) => {
    const executed = trigger(actionId);
    if (!executed) {
      showToast('Redirigiendo para crear desde la vista correspondiente…', 'info');
      if (actionId === 'task:create') {
        navigate('/tasks', { state: { quickAction: actionId }, replace: false });
      } else if (actionId === 'goal:create') {
        navigate('/goals', { state: { quickAction: actionId }, replace: false });
      } else if (actionId === 'progress:create') {
        navigate('/progress', { state: { quickAction: actionId }, replace: false });
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="quick-action-wrapper" data-open={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="quick-action-popover"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="quick-action-popover"
          >
            <p className="quick-action-title">Acciones rápidas</p>
            <div className="quick-action-list">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="quick-action-item"
                  onClick={() => handleTrigger(action.id)}
                >
                  <span className={`quick-action-icon bg-gradient-to-br ${action.accent}`}>{action.icon}</span>
                  <span className="quick-action-labels">
                    <span className="quick-action-label">{action.title}</span>
                    <span className="quick-action-subtitle">{action.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="quick-action-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
      >
        <span className="quick-action-fab-icon">{isOpen ? '×' : '+'}</span>
      </button>
    </div>
  );
}


