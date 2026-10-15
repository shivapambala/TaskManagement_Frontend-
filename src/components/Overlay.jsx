import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton, Button } from './ui';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/** Shared accessible overlay: focus trap, Esc to close, scroll lock, focus restore. */
function Overlay({ open, onClose, title, variant, children, footer, labelId }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE);
    first?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div role="presentation" className={`overlay overlay-${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`panel panel-${variant}`} role="dialog" aria-modal="true" aria-labelledby={labelId} ref={panelRef}>
        <header className="panel-head">
          <h2 id={labelId}>{title}</h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </header>
        <div className="panel-body">{children}</div>
        {footer && <footer className="panel-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal(props) {
  return <Overlay variant="modal" labelId="modal-title" {...props} />;
}

export function Drawer(props) {
  return <Overlay variant="drawer" labelId="drawer-title" {...props} />;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      <p>{message}</p>
    </Modal>
  );
}
