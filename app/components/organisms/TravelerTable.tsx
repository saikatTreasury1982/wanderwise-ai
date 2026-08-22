'use client';

import { cn } from '@/app/lib/utils';

interface Traveler {
  traveler_id: number;
  trip_id: number;
  traveler_name: string;
  traveler_email: string | null;
  relationship: string | null;
  is_primary: number;
  is_cost_sharer: number;
  traveler_currency: string | null;
  is_active: number;
}

interface Relationship {
  relationship_code: string;
  relationship_name: string;
}

interface Props {
  travelers: Traveler[];
  relationships: Relationship[];
  onEdit: (traveler: Traveler) => void;
  onDelete: (travelerId: number) => void;
}

export default function TravelerTable({ travelers, relationships, onEdit, onDelete }: Props) {
  if (travelers.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center">
        <p className="text-white/70 mb-2">No travellers yet.</p>
        <p className="text-white/50 text-sm">Tap the + button to add your first traveller.</p>
      </div>
    );
  }

  const relName = (code: string | null) =>
    code ? (relationships.find(r => r.relationship_code === code)?.relationship_name || code) : '—';

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-white/50 text-xs uppercase tracking-wide">
              <th className="py-2.5 px-3 text-left">Name</th>
              <th className="py-2.5 px-3 text-left">Relationship</th>
              <th className="py-2.5 px-3 text-left">Email</th>
              <th className="py-2.5 px-3 text-center">Currency</th>
              <th className="py-2.5 px-3 text-center">Payer</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {travelers.map((t) => {
              const isSelf = t.relationship === 'self';
              return (
                <tr key={t.traveler_id} className={cn('border-t border-white/10 hover:bg-white/5 transition-colors align-middle', !t.is_active && 'opacity-50')}>
                  {/* Name + primary badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{t.traveler_name}</span>
                      {t.is_primary === 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-200">Primary</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-white/70 whitespace-nowrap">{relName(t.relationship)}</td>
                  <td className="py-3 px-3 text-white/70 whitespace-nowrap">{t.traveler_email || '—'}</td>
                  <td className="py-3 px-3 text-white/70 text-center whitespace-nowrap">{t.traveler_currency || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    {t.is_cost_sharer === 1 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-400/40 text-green-200">Payer</span>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {t.is_active === 1 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-400/40 text-green-200">Active</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-400/40 text-red-200">Inactive</span>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => onEdit(t)} className="text-white/40 hover:text-white transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {!isSelf && (
                        <button onClick={() => onDelete(t.traveler_id)} className="text-white/40 hover:text-red-400 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}