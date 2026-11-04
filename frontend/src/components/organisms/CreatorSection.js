import { useMemo } from 'react';
import StatusBadge from '../atoms/StatusBadge';

function CreatorMetric({ label, value, helper, icon }) {
  return (
    <div className="admin-stat-card flex items-center justify-between gap-4 p-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#8392AB]">{label}</p><p className="mt-2 text-2xl font-bold text-[#10264D]">{value}</p><p className="mt-1 text-xs text-[#67748E]">{helper}</p></div>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0F2A5F] text-white shadow-[0_7px_16px_rgba(37,99,235,0.25)]"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg></span>
    </div>
  );
}

export default function CreatorSection({ creators, search, onSearchChange, onCreatorClick, onDelete, onToggleTts, ttsUpdatingId }) {
  const creatorsArray = Array.isArray(creators) ? creators : [];
  const filteredCreators = useMemo(() => creatorsArray.filter((creator) =>
    creator.username?.toLowerCase().includes(search.toLowerCase())
    || creator.email?.toLowerCase().includes(search.toLowerCase())
    || creator.displayName?.toLowerCase().includes(search.toLowerCase())), [creatorsArray, search]);
  const completePayouts = creatorsArray.filter((creator) => creator.payoutAccountNumber && creator.payoutAccountHolder).length;
  const activeTts = creatorsArray.filter((creator) => creator.overlayConfig?.notifications?.ttsEnabled ?? true).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-3">
        <CreatorMetric label="Total kreator" value={creatorsArray.length} helper="Akun terdaftar" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87" />} />
        <CreatorMetric label="Payout lengkap" value={completePayouts} helper="Rekening telah diisi" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 11h2m4 0h2M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />} />
        <CreatorMetric label="Auto baca aktif" value={activeTts} helper="Overlay dengan TTS" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5 6 9H2v6h4l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" />} />
      </section>

      <section id="creator" className="admin-panel-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-base font-bold text-[#10264D]">Daftar kreator</h2><p className="mt-1 text-xs text-[#67748E]">Kelola akun, payout, dan pengaturan auto baca.</p></div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8392AB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
            <input type="search" placeholder="Cari kreator..." value={search} onChange={onSearchChange} className="jd-input w-full py-2 pl-9 pr-4 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full">
            <thead><tr>{['Kreator', 'Email', 'Payout', 'Auto baca', 'Aksi'].map((label) => <th key={label} className="px-6 py-3.5 text-left">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCreators.map((creator) => {
                const ttsEnabled = creator.overlayConfig?.notifications?.ttsEnabled ?? true;
                const isUpdatingTts = ttsUpdatingId === creator._id;
                return (
                  <tr key={creator._id} className="cursor-pointer" onClick={() => onCreatorClick(creator)}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-xs font-bold text-[#2563EB]">{(creator.displayName || creator.username || 'K').charAt(0).toUpperCase()}</span><div><p className="text-sm font-semibold text-[#10264D]">{creator.displayName || creator.username}</p><p className="mt-0.5 text-[11px] text-[#8392AB]">@{creator.username}</p></div></div></td>
                    <td className="px-6 py-4 text-sm text-[#67748E]">{creator.email}</td>
                    <td className="px-6 py-4">{creator.payoutAccountNumber && creator.payoutAccountHolder ? <StatusBadge status="PAID">Lengkap</StatusBadge> : <StatusBadge status="FAILED">Belum</StatusBadge>}</td>
                    <td className="px-6 py-4">
                      <button type="button" role="switch" aria-checked={ttsEnabled} disabled={isUpdatingTts} onClick={(event) => { event.stopPropagation(); onToggleTts(creator, !ttsEnabled); }} className="inline-flex items-center gap-2 text-xs font-semibold text-[#67748E] disabled:opacity-60">
                        <span className={`relative inline-flex h-5 w-9 rounded-full ${ttsEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${ttsEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span>
                        {isUpdatingTts ? 'Menyimpan' : (ttsEnabled ? 'Aktif' : 'Nonaktif')}
                      </button>
                    </td>
                    <td className="px-6 py-4"><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(creator._id); }} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCreators.length === 0 && <div className="py-14 text-center text-sm text-[#8392AB]">Belum ada kreator ditemukan.</div>}
        </div>
      </section>
    </div>
  );
}
