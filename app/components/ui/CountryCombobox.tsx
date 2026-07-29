'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/lib/utils';

export interface Country {
  country_code: string;
  country_name: string;
  currency_code: string;
}

interface Props {
  value: string;
  countries: Country[];
  onSelect: (country: Country) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function CountryCombobox({ value, countries, onSelect, placeholder = 'Select your country', error, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const q = query.trim().toLowerCase();
  const results = q ? countries.filter(c => c.country_name.toLowerCase().includes(q) || c.country_code.toLowerCase().includes(q)) : countries;
  const selectedName = countries.find(c => c.country_code === value)?.country_name;

  const choose = (c: Country) => {
    onSelect(c);
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'w-full px-4 py-2 rounded-full text-sm text-left bg-white/10 border text-white',
            'focus:outline-none focus:border-primary-400 transition-colors',
            error ? 'border-red-400/60' : 'border-white/20',
            !value && 'text-white/40'
          )}
        >
          {selectedName || placeholder}
        </button>
      ) : (
        <>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder="Search country…"
            className="w-full px-4 py-2 rounded-full text-sm bg-white/10 border border-primary-400 text-white placeholder:text-white/30 focus:outline-none"
          />
          <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto custom-scrollbar bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl">
            {results.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/50">No match</div>
            ) : (
              results.map((c, i) => (
                <button
                  key={c.country_code}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(c)}
                  className={cn('w-full px-3 py-2 text-left text-sm transition-colors',
                    i === active ? 'bg-primary-500/20 text-white' : 'text-white/80 hover:bg-white/5')}
                >
                  {c.country_name}
                </button>
              ))
            )}
          </div>
        </>
      )}
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
}