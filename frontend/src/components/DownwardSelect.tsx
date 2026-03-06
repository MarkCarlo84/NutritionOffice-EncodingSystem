import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './DownwardSelect.css';

export interface DownwardSelectOption {
  value: string;
  label: string;
}

interface DownwardSelectProps {
  id?: string;
  value: string;
  options: DownwardSelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}

const DownwardSelect = ({ id, value, options, placeholder = 'Select...', onChange }: DownwardSelectProps) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || placeholder;
  }, [options, placeholder, value]);

  const updatePosition = () => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      opacity: 1,
      pointerEvents: 'auto',
    });
  };

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setMenuStyle({ opacity: 0, pointerEvents: 'none' });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const target = e.target as Node;
      const isInsideRoot = rootRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);

      if (!isInsideRoot && !isInsideMenu) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div className="downward-select" ref={rootRef}>
      <button
        id={id}
        type="button"
        className="downward-select-trigger"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className={`downward-select-caret ${open ? 'open' : ''}`}>▼</span>
      </button>

      {open && createPortal(
        <div className="downward-select-menu" role="listbox" style={menuStyle} ref={menuRef}>
          {options.map((opt) => (
            <button
              key={opt.value || '__empty__'}
              type="button"
              className={`downward-select-option ${value === opt.value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DownwardSelect;
