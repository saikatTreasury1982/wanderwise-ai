'use client';

import { useState } from 'react';
import { THEMES, DEFAULT_THEME, isValidTheme, type ThemeKey } from '@/app/lib/config/theme';
import { useTheme } from './ThemeProvider';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import { LogOut } from 'lucide-react';

export function ThemePicker({ onClose }: { onClose?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  async function handleSelect(key: ThemeKey) {
    const previous = theme;
    setTheme(key);
    setSaving(true);

    try {
      const res = await fetch('/api/preferences/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: key }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      setTheme(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {THEMES.map((t) => {
        const active = t.key === theme;
        return (
          <button
            key={t.key}
            type="button"
            disabled={saving}
            onClick={() => handleSelect(t.key)}
            aria-pressed={active}
            className={`w-full rounded-lg p-4 text-left transition-colors bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] ${active ? 'ring-2 ring-primary-400' : ''
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 gap-1">
                {t.swatch.map((c) => (
                  <span
                    key={c}
                    className="h-4 w-4 rounded-lg border border-white/20"
                    style={{ background: c }}
                  />
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-content font-medium">{t.label}</div>
                <div className="text-content-muted text-sm">{t.description}</div>
              </div>

              {active && (
                <span className="text-primary-300 shrink-0 text-sm">Active</span>
              )}
            </div>
          </button>
        );
      })}

      {/* Done */}
      {onClose && (
        <div className="flex justify-end pt-2">
          <CircleIconButton
            variant="primary"
            size="small"
            onClick={onClose}
            title="Exit"
            icon={<LogOut className="w-5 h-5" />}
          />
        </div>
      )}
    </div>
  );
}