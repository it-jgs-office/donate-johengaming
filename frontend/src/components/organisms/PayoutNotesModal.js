import Card from '../atoms/Card';

export default function PayoutNotesModal({ 
  isOpen, 
  type, 
  notes, 
  onNotesChange, 
  onClose, 
  onSubmit 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md !rounded-2xl !border-0 !bg-white !p-6 !shadow-[0_24px_70px_rgba(15,42,95,0.22)]" onClick={(event) => event.stopPropagation()}>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563EB]">Tindakan payout</span>
        <h2 className="mb-4 mt-1 text-xl font-bold text-[#10264D]">
          {type === 'PROCESSED' ? 'Proses Payout' : 'Tolak Payout'}
        </h2>
        <label className="mb-2 block text-sm font-semibold text-[#52637A]">
          Catatan (opsional)
        </label>
        <textarea
          className="jd-input w-full p-3 mb-5 text-sm resize-none placeholder:text-[#94A3B8]"
          rows={3}
          value={notes}
          onChange={onNotesChange}
          placeholder="Isi catatan untuk payout ini..."
        />
        <div className="flex gap-2 justify-end">
          <button 
            className="jd-btn-secondary cursor-pointer px-4 py-2 text-sm font-semibold" 
            onClick={onClose}
          >
            Batal
          </button>
          <button 
            className="jd-btn-primary cursor-pointer px-4 py-2 text-sm font-semibold" 
            onClick={onSubmit}
          >
            Simpan & {type === 'PROCESSED' ? 'Proses' : 'Tolak'}
          </button>
        </div>
      </Card>
    </div>
  );
}
