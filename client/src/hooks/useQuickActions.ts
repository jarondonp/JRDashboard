import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

export type QuickActionType = 'goal:create' | 'task:create' | 'progress:create' | 'area:create' | 'project:create';
type QuickActionHandler = () => void;

interface QuickActionContextValue {
  trigger: (action: QuickActionType) => boolean;
  register: (action: QuickActionType, handler: QuickActionHandler) => () => void;
}

const QuickActionContext = createContext<QuickActionContextValue | undefined>(undefined);

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef(new Map<QuickActionType, Set<QuickActionHandler>>());

  const register = useCallback((action: QuickActionType, handler: QuickActionHandler) => {
    const bucket = handlersRef.current.get(action) ?? new Set<QuickActionHandler>();
    bucket.add(handler);
    handlersRef.current.set(action, bucket);

    return () => {
      const current = handlersRef.current.get(action);
      current?.delete(handler);
      if (current && current.size === 0) {
        handlersRef.current.delete(action);
      }
    };
  }, []);

  const trigger = useCallback((action: QuickActionType) => {
    const handlers = handlersRef.current.get(action);
    if (!handlers || handlers.size === 0) {
      return false;
    }

    Array.from(handlers).forEach((handler) => {
      try {
        handler();
      } catch (err) {
        console.error('Error ejecutando quick action', action, err);
      }
    });
    return true;
  }, []);

  const value = useMemo<QuickActionContextValue>(() => ({ register, trigger }), [register, trigger]);

  return createElement(QuickActionContext.Provider, { value }, children);
}

export function useQuickActions() {
  const context = useContext(QuickActionContext);
  if (!context) {
    throw new Error('useQuickActions debe usarse dentro de QuickActionProvider');
  }
  return context;
}

export function useRegisterQuickAction(action: QuickActionType, handler: QuickActionHandler | null | undefined) {
  const { register } = useQuickActions();

  useEffect(() => {
    if (!handler) return;
    return register(action, handler);
  }, [action, handler, register]);
}


