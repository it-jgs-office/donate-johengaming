import { useState } from 'react';
import FeedbackDetailModal from './FeedbackDetailModal';

export default function FeedbackSection({ feedbacks, loading, error, counts, onStatusChange, onDelete, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const handleViewDetail = (feedback) => {
    setSelectedFeedback(feedback);
    if (feedback.status === 'unread') onStatusChange(feedback._id, 'read');
  };

  const filteredFeedbacks = (feedbacks || []).filter((feedback) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || feedback.name?.toLowerCase().includes(query) || feedback.email?.toLowerCase().includes(query) || feedback.subject?.toLowerCase().includes(query);
    return matchesSearch && (statusFilter === 'all' || feedback.status === statusFilter);
  });

  const formatDate = (date) => new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="admin-panel-card flex justify-center py-20"><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#2563EB]" /></div>;
  if (error) return <div className="admin-panel-card border-l-4 border-red-500 p-5 text-red-700"><p className="font-bold">Feedback gagal dimuat</p><p className="mt-1 text-sm">{error}</p></div>;

  const metrics = [
    { label: 'Total pesan', value: counts?.all || 0, helper: 'Semua feedback masuk' },
    { label: 'Belum dibaca', value: counts?.unread || 0, helper: 'Perlu ditinjau' },
    { label: 'Sudah dibaca', value: counts?.read || 0, helper: 'Telah ditinjau' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-3">
        {metrics.map((item) => (
          <div key={item.label} className="admin-stat-card flex items-center justify-between gap-4 p-5">
            <div><p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#8392AB]">{item.label}</p><p className="mt-2 text-2xl font-bold text-[#10264D]">{item.value}</p><p className="mt-1 text-xs text-[#67748E]">{item.helper}</p></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0F2A5F] text-white shadow-[0_7px_16px_rgba(37,99,235,0.25)]"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></svg></span>
          </div>
        ))}
      </section>

      <section className="admin-panel-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-base font-bold text-[#10264D]">Kotak masuk</h2><p className="mt-1 text-xs text-[#67748E]">Baca dan tindak lanjuti pesan pengguna.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-[240px]"><svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8392AB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg><input type="search" aria-label="Cari feedback" placeholder="Cari feedback..." value={search} onChange={(event) => setSearch(event.target.value)} className="jd-input w-full py-2 pl-9 pr-4 text-sm" /></div>
            <select aria-label="Filter status feedback" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="jd-input px-3 py-2 text-sm"><option value="all">Semua status</option><option value="unread">Belum dibaca</option><option value="read">Sudah dibaca</option></select>
            <button type="button" onClick={onRefresh} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]">Muat ulang</button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredFeedbacks.length === 0 ? <div className="py-16 text-center"><p className="text-sm font-semibold text-[#10264D]">Tidak ada feedback ditemukan</p><p className="mt-1 text-xs text-[#8392AB]">Ubah pencarian atau filter status.</p></div>
            : filteredFeedbacks.map((feedback) => (
              <button type="button" key={feedback._id} className="flex w-full flex-col gap-3 px-6 py-5 text-left transition-colors hover:bg-[#F8FBFF] sm:flex-row sm:items-start sm:justify-between" onClick={() => handleViewDetail(feedback)}>
                <div className="flex min-w-0 gap-3">
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${feedback.status === 'unread' ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#2563EB]'}`}>{(feedback.name || 'P').charAt(0).toUpperCase()}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[#10264D]">{feedback.subject}</h3>{feedback.status === 'unread' && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Baru</span>}{feedback.imageUrl && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#67748E]">Ada gambar</span>}</div><p className="mt-1 text-xs text-[#8392AB]">{feedback.name} · {feedback.email}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#67748E]">{feedback.message}</p>{feedback.adminNotes && <p className="mt-2 text-xs text-[#2563EB]">Catatan: {feedback.adminNotes}</p>}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end"><span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${feedback.status === 'unread' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{feedback.status === 'unread' ? 'Belum dibaca' : 'Sudah dibaca'}</span><span className="text-[11px] text-[#8392AB]">{formatDate(feedback.createdAt)}</span></div>
              </button>
            ))}
        </div>
      </section>

      {selectedFeedback && <FeedbackDetailModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} onStatusChange={onStatusChange} onDelete={onDelete} onRefresh={onRefresh} />}
    </div>
  );
}
