import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || placeholder;
  }, [options, placeholder, value]);

  // Recalculate menu position whenever dropdown opens so it escapes overflow:hidden parents
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
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

      {open && (
        <div className="downward-select-menu" role="listbox" style={menuStyle}>
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
        </div>
      )}
    </div>
  );
};

export default DownwardSelect;
