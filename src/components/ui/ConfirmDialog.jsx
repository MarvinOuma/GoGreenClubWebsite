import { useId } from 'react';
import { Dialog } from './Dialog';

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
  const titleId = useId();
  const descriptionId = useId();

  const confirmClass = tone === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Dialog open={open} onClose={onCancel} titleId={titleId}
      descriptionId={description ? descriptionId : undefined}
      className="dialog-panel max-w-md">
      <div className="w-full">
        <div className="p-5 sm:p-6">
          <h3 id={titleId} className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
          {description ? <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ivory p-4">
          <button
            type="button"
            data-initial-focus
            onClick={onCancel}
            className="btn-secondary text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${confirmClass} text-sm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

