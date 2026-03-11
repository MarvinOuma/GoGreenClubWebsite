import { useEffect } from 'react';

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger', // 'danger' | 'primary' | 'neutral'
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100'
      : tone === 'neutral'
        ? 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-200'
        : 'bg-red-600 hover:bg-red-700 focus:ring-red-100';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        <div className="p-6">
          <h3 className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p> : null}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

