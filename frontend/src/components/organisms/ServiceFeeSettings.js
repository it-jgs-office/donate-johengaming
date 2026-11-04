import { useEffect, useState } from 'react';

export default function ServiceFeeSettings({ percentage, saving, onSave }) {
  const [value, setValue] = useState(String(percentage ?? 0));

  useEffect(() => {
    setValue(String(percentage ?? 0));
  }, [percentage]);

  const submit = (event) => {
    event.preventDefault();
    onSave(Number(value));
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <form onSubmit={submit} className="admin-panel-card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-bold text-[#10264D]">Biaya layanan donasi</h2>
          <p className="mt-1 text-xs text-[#67748E]">Atur potongan yang berlaku untuk setiap transaksi baru.</p>
        </div>
        <div className="p-6">
        <label className="block">
          <span className="text-sm font-semibold text-[#10264D]">Persentase biaya layanan</span>
          <div className="mt-2 flex max-w-sm overflow-hidden rounded-lg border border-[#d2d6da] bg-white focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-[#2563EB]/10">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-12 w-full bg-transparent px-4 text-lg font-bold text-[#10264D] outline-none"
              aria-label="Persentase biaya layanan"
            />
            <span className="flex w-14 items-center justify-center border-l border-[#d2d6da] bg-[#F8F9FA] text-sm font-bold text-[#67748E]">%</span>
          </div>
        </label>

        <div className="mt-5 rounded-xl bg-[#EFF6FF] p-4 text-sm leading-relaxed text-[#365277]">
          <strong className="mb-1 block text-[#10264D]">Berlaku untuk transaksi baru</strong>
          Donasi yang sudah dibuat tetap memakai potongan yang tersimpan pada saat transaksi dibuat. Riwayat akan menampilkan nominal masuk, biaya layanan, dan saldo bersih kreator.
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(37,99,235,0.25)] hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan biaya layanan'}
          </button>
        </div></div>
      </form>

      <aside className="admin-panel-card self-start overflow-hidden">
        <div className="bg-gradient-to-br from-[#0F2A5F] to-[#2563EB] p-6 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span>
          <h3 className="mt-5 text-lg font-bold">Perhitungan otomatis</h3>
          <p className="mt-2 text-sm leading-6 text-blue-100">Biaya layanan langsung dipisahkan dari hak kreator pada setiap donasi berhasil.</p>
        </div>
        <div className="space-y-4 p-6 text-sm">
          <div className="flex items-center justify-between"><span className="text-[#67748E]">Tarif aktif</span><strong className="text-[#10264D]">{value || 0}%</strong></div>
          <div className="flex items-center justify-between"><span className="text-[#67748E]">Transaksi lama</span><strong className="text-[#10264D]">Tidak berubah</strong></div>
          <div className="flex items-center justify-between"><span className="text-[#67748E]">Riwayat biaya</span><strong className="text-[#10264D]">Tersimpan</strong></div>
        </div>
      </aside>
    </section>
  );
}
