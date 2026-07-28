'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/app/lib/utils';

export interface Currency {
  currency_code: string;
  currency_name: string;
  currency_symbol?: string | null;
}

interface Props {
  value: string;
  currencies: Currency[];
  onSelect: (code: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CurrencyCombobox({ value, currencies, onSelect, placeholder = 'Currency', className }: Props) {
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
  const results = q
    ? currencies.filter(c =>
        c.currency_code.toLowerCase().includes(q) || c.currency_name.toLowerCase().includes(q))
    : currencies;

  const choose = (code: string) => {
    onSelect(code);
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active].currency_code); }
    else if (e.key === 'Escape') setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'px-4 py-2 rounded-full text-sm bg-white/10 border border-white/20 text-left',
          'text-white hover:bg-white/15 focus:outline-none focus:border-primary-400 transition-colors',
          !value && 'text-white/40',
          className
        )}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={onKey}
        placeholder="Search currency…"
        className="px-4 py-2 rounded-full text-sm bg-white/10 border border-primary-400 text-white placeholder:text-white/30 focus:outline-none w-40"
      />
      <div className="absolute z-50 mt-1 w-56 max-h-64 overflow-y-auto custom-scrollbar bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl">
        {results.length === 0 ? (
          <div className="px-3 py-2 text-sm text-white/50">No match</div>
        ) : (
          results.map((c, i) => (
            <button
              key={c.currency_code}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(c.currency_code)}
              className={cn('w-full px-3 py-2 text-left flex items-center gap-3 transition-colors',
                i === active ? 'bg-primary-500/20' : 'hover:bg-white/5')}
            >
              <span className="font-mono text-sm text-primary-300 w-10 shrink-0">{c.currency_code}</span>
              <span className="text-sm text-white/80 truncate">{c.currency_name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}