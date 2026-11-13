import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Dialog({ open, onClose, titleId, descriptionId, className, children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog.showModal();
    dialog.querySelector('[data-initial-focus]')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={className}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) onClose();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
