import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const toneStyles = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-gray-200 bg-white text-gray-900',
};

const ToastItem = ({ toast, onDismiss }) => {
  const tone = toneStyles[toast.type] ?? toneStyles.info;
  return (
    <div className={`w-full max-w-md rounded-2xl border px-4 py-3 shadow-lg ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.message ? <p className="mt-1 text-sm opacity-90">{toast.message}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ type = 'info', title, message, durationMs = 2800 }) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const toast = { id, type, title: title ?? 'Notice', message };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      success: (title, message, durationMs) => push({ type: 'success', title, message, durationMs }),
      error: (title, message, durationMs) => push({ type: 'error', title, message, durationMs }),
      info: (title, message, durationMs) => push({ type: 'info', title, message, durationMs }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-3 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full flex justify-center">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

