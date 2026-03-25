'use client';

import { useState, useRef, useEffect } from 'react';

const C = {
  dark: '#FAF7F2', slate: 'rgba(250,247,242,0.5)',
  teal: '#2bb8c4', cardBg: '#2f2f2f', border: 'rgba(250,247,242,0.08)',
  white: '#1a1a1a',
};

interface Option {
  name: string;
  label: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchSelect({ options, value, onChange, placeholder = 'All Advisors' }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = value ? options.find(o => o.name === value)?.label ?? value : '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 260 }}>
      <button
        onClick={() => { setOpen(!open); setSearch(''); }}
        style={{
          width: '100%', padding: '9px 14px', borderRadius: 8,
          border: `1px solid ${open ? C.teal : C.border}`,
          background: C.cardBg, color: value ? C.dark : C.slate,
          fontSize: 13, textAlign: 'left', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'Fakt', system-ui, sans-serif",
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel || placeholder}
        </span>
        <span style={{ fontSize: 10, color: C.slate, marginLeft: 8 }}>&#9662;</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, borderRadius: 8, overflow: 'hidden',
          background: '#252525', border: `1px solid ${C.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${C.border}` }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 6,
                border: `1px solid ${C.border}`, background: C.white,
                color: C.dark, fontSize: 13, outline: 'none',
                fontFamily: "'Fakt', system-ui, sans-serif",
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* "All" option */}
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                width: '100%', padding: '8px 14px', border: 'none', textAlign: 'left',
                background: !value ? 'rgba(43,184,196,0.08)' : 'transparent',
                color: !value ? C.teal : C.dark, fontSize: 13, cursor: 'pointer',
                fontWeight: !value ? 600 : 400,
                fontFamily: "'Fakt', system-ui, sans-serif",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(43,184,196,0.06)'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = !value ? 'rgba(43,184,196,0.08)' : 'transparent'; }}
            >
              {placeholder} ({options.length})
            </button>
            {filtered.map(opt => (
              <button
                key={opt.name}
                onClick={() => { onChange(opt.name); setOpen(false); }}
                style={{
                  width: '100%', padding: '8px 14px', border: 'none', textAlign: 'left',
                  background: value === opt.name ? 'rgba(43,184,196,0.08)' : 'transparent',
                  color: value === opt.name ? C.teal : C.dark, fontSize: 13, cursor: 'pointer',
                  fontWeight: value === opt.name ? 600 : 400,
                  fontFamily: "'Fakt', system-ui, sans-serif",
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(43,184,196,0.06)'; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = value === opt.name ? 'rgba(43,184,196,0.08)' : 'transparent'; }}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 13, color: C.slate }}>No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
