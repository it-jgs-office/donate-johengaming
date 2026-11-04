import { useState } from 'react';

export default function FeedbackDetailModal({ feedback, onClose, onStatusChange, onDelete, onRefresh }) {
  const [adminNotes, setAdminNotes] = useState(feedback.adminNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onStatusChange(feedback._id, feedback.status, adminNotes);
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    await onStatusChange(feedback._id, newStatus, adminNotes);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus feedback ini?')) {
      await onDelete(feedback._id);
      onClose();
      onRefresh();
    }
  };

  const formattedDate = new Date(feedback.createdAt).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_rgba(15,42,95,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e8edf2] bg-white/95 backdrop-blur-xl p-5 sm:p-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563EB]">Kotak masuk</span>
            <h2 className="mt-1 text-xl font-bold text-[#10264D]">Detail feedback</h2>
            <p className="text-sm text-[#64748B] mt-1">Diterima pada {formattedDate}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup modal" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl text-[#67748E] hover:bg-[#EFF6FF]">&times;</button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#e8edf2] bg-[#f8fbfd] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Nama</p>
              <p className="font-bold text-[#10264D] mt-1">{feedback.name}</p>
            </div>
            <div className="rounded-2xl border border-[#e8edf2] bg-[#f8fbfd] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Email</p>
              <a href={`mailto:${feedback.email}`} className="font-bold text-[#1D4ED8] mt-1 block break-all hover:underline">{feedback.email}</a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Subjek</p>
            <p className="text-lg font-extrabold text-[#10264D] mt-1">{feedback.subject}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Pesan</p>
            <div className="rounded-2xl border border-[#dce8ee] bg-[#F0F7FF] p-4 text-sm leading-7 text-[#52637A] whitespace-pre-wrap">{feedback.message}</div>
          </div>

          {feedback.imageUrl && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Lampiran gambar</p>
              <div className="rounded-2xl border border-[#e8edf2] bg-[#f8fbfd] p-4">
                <img src={feedback.imageUrl} alt="Lampiran feedback" className="max-w-full max-h-96 mx-auto rounded-xl" />
                <a href={feedback.imageUrl} target="_blank" rel="noopener noreferrer" className="block text-center mt-3 text-[#1D4ED8] font-bold text-sm hover:underline">Buka gambar di tab baru</a>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => handleStatusChange('unread')} className={`min-h-11 px-4 py-2 rounded-xl font-bold text-sm border cursor-pointer ${feedback.status === 'unread' ? 'bg-[#1D4ED8] text-white border-transparent' : 'bg-white text-[#52637A] border-[#e1e7ef] hover:bg-[#F5F9FF]'}`}>Belum dibaca</button>
              <button type="button" onClick={() => handleStatusChange('read')} className={`min-h-11 px-4 py-2 rounded-xl font-bold text-sm border cursor-pointer ${feedback.status === 'read' ? 'bg-[#1D4ED8] text-white border-transparent' : 'bg-white text-[#52637A] border-[#e1e7ef] hover:bg-[#F0F7FF]'}`}>Sudah dibaca</button>
            </div>
          </div>

          <div>
            <label htmlFor="admin-notes" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block mb-2">Catatan admin (internal)</label>
            <textarea id="admin-notes" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={4} placeholder="Tulis catatan internal untuk feedback ini..." className="jd-input w-full px-4 py-3 text-sm resize-none placeholder:text-[#94A3B8]" />
            <button type="button" onClick={handleSaveNotes} disabled={isSaving} className="jd-btn-primary mt-3 px-4 py-2.5 text-sm font-bold disabled:opacity-50 cursor-pointer">{isSaving ? 'Menyimpan...' : 'Simpan catatan'}</button>
          </div>

          <details className="rounded-2xl border border-[#e8edf2] bg-[#f8fbfd] p-4 text-xs text-[#64748B]">
            <summary className="font-bold text-[#10264D] cursor-pointer">Informasi teknis</summary>
            <div className="mt-3 space-y-1 break-all">
              <p><strong>IP Address:</strong> {feedback.ipAddress || 'N/A'}</p>
              <p><strong>User Agent:</strong> {feedback.userAgent || 'N/A'}</p>
              <p><strong>ID:</strong> {feedback._id}</p>
            </div>
          </details>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 border-t border-[#e8edf2] bg-white/95 backdrop-blur-xl p-5 sm:p-6">
          <button type="button" onClick={handleDelete} className="min-h-11 px-5 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 font-bold hover:bg-red-50 cursor-pointer">Hapus feedback</button>
          <button type="button" onClick={onClose} className="jd-btn-secondary px-5 py-2.5 font-bold cursor-pointer">Tutup</button>
        </div>
      </div>
    </div>
  );
}
