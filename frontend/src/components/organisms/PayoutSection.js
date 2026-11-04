import { formatRupiah } from '@/utils/format';

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  PROCESSED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const statusLabels = { PENDING: 'Menunggu', APPROVED: 'Disetujui', PROCESSED: 'Selesai', REJECTED: 'Ditolak' };

function PayoutMetric({ label, value, helper }) {
  return (
    <div className="admin-stat-card flex items-center justify-between gap-4 p-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#8392AB]">{label}</p><p className="mt-2 text-2xl font-bold text-[#10264D]">{value}</p><p className="mt-1 text-xs text-[#67748E]">{helper}</p></div>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0F2A5F] text-white shadow-[0_7px_16px_rgba(37,99,235,0.25)]"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" /></svg></span>
    </div>
  );
}

export default function PayoutSection({ payouts, loading, error, onOpenNotesModal }) {
  const payoutsArray = Array.isArray(payouts) ? payouts : [];
  const pending = payoutsArray.filter((payout) => ['PENDING', 'APPROVED'].includes(payout.status));
  const processed = payoutsArray.filter((payout) => payout.status === 'PROCESSED');
  const totalAmount = payoutsArray.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const pendingAmount = pending.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const processedAmount = processed.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-3">
        <PayoutMetric label="Total pengajuan" value={formatRupiah(totalAmount)} helper={`${payoutsArray.length} seluruh pengajuan`} />
        <PayoutMetric label="Perlu ditindak" value={formatRupiah(pendingAmount)} helper={`${pending.length} pengajuan aktif`} />
        <PayoutMetric label="Sudah dicairkan" value={formatRupiah(processedAmount)} helper={`${processed.length} payout selesai`} />
      </section>

      <section id="payout" className="admin-panel-card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5"><h2 className="text-base font-bold text-[#10264D]">Pengajuan payout</h2><p className="mt-1 text-xs text-[#67748E]">Kelola pencairan dana kreator dan catatan proses.</p></div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full">
            <thead><tr>{['Kreator', 'Tanggal request', 'Nominal', 'Status', 'Tanggal proses', 'Catatan', 'Aksi'].map((label) => <th key={label} className="px-5 py-3.5 text-left">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="py-14 text-center text-sm text-[#8392AB]">Memuat data payout...</td></tr>
                : payoutsArray.length === 0 ? <tr><td colSpan={7} className="py-14 text-center text-sm text-[#8392AB]">Belum ada pengajuan payout.</td></tr>
                  : payoutsArray.map((payout) => (
                    <tr key={payout._id}>
                      <td className="px-5 py-4"><p className="text-sm font-semibold text-[#10264D]">{payout.creatorUsername}</p><p className="mt-0.5 text-[11px] text-[#8392AB]">Kreator</p></td>
                      <td className="px-5 py-4 text-xs text-[#67748E]">{new Date(payout.requestedAt).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 text-sm font-semibold tabular-nums text-[#10264D]">{formatRupiah(payout.amount)}</td>
                      <td className="px-5 py-4"><span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusStyles[payout.status] || statusStyles.PENDING}`}>{statusLabels[payout.status] || payout.status}</span></td>
                      <td className="px-5 py-4 text-xs text-[#67748E]">{payout.processedAt ? new Date(payout.processedAt).toLocaleString('id-ID') : '-'}</td>
                      <td className="max-w-[220px] truncate px-5 py-4 text-xs text-[#67748E]">{payout.adminNote || '-'}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {payout.status === 'PENDING' && <div className="flex gap-2"><button type="button" className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]" onClick={() => onOpenNotesModal(payout._id, 'PROCESSED')}>Proses</button><button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => onOpenNotesModal(payout._id, 'REJECTED')}>Tolak</button></div>}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {error && <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">{error}</div>}
        </div>
      </section>
    </div>
  );
}
