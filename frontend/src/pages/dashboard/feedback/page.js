'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import { getStoredUser } from '@/utils/sessionManager';
import { subscribeToAdminData } from '@/lib/pusher';

const categoryLabels = {
  feedback: 'Feedback',
  report: 'Laporan Masalah',
};

export default function CreatorFeedbackPage() {
  const router = useRouter();
  const imageInputRef = useRef(null);
  const [user, setUser] = useState(getStoredUser);
  const [form, setForm] = useState({
    category: 'feedback',
    email: '',
    subject: '',
    message: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const fetchFeedbackHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setHistoryError('');
      const response = await axios.get('/api/creator/feedback', {
        headers: { Authorization: `Bearer ${token}` },
        skipGlobalLoading: true,
      });
      setFeedbackHistory(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      if (error.response?.status !== 401) {
        setHistoryError('Riwayat feedback gagal dimuat.');
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.replace('/login');
      return;
    }

    setUser(storedUser);
    setForm((current) => ({ ...current, email: current.email || storedUser.email || '' }));
  }, [router]);

  useEffect(() => {
    if (user?.email) fetchFeedbackHistory();
  }, [user?.email, fetchFeedbackHistory]);

  useEffect(() => {
    if (!user?.email) return undefined;

    return subscribeToAdminData(({ resource }) => {
      if (resource === 'feedbacks') fetchFeedbackHistory();
    });
  }, [user?.email, fetchFeedbackHistory]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lampiran harus berupa gambar');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const category = categoryLabels[form.category] || categoryLabels.feedback;
      await axios.post('/api/creator/feedback', {
        name: user?.displayName || user?.username || 'Kreator',
        email: form.email.trim(),
        subject: `[${category}] ${form.subject.trim()}`,
        message: form.message.trim(),
        image: imagePreview || null,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        skipGlobalLoading: true,
      });

      toast.success(`${category} berhasil dikirim ke admin`);
      setForm((current) => ({ ...current, subject: '', message: '' }));
      removeImage();
      await fetchFeedbackHistory();
    } catch (error) {
      const validationMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat()[0]
        : null;
      toast.error(validationMessage || error.response?.data?.message || 'Gagal mengirim feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[#F0F7FF]" />;
  }

  return (
    <CreatorAppLayout user={user}>
      <div>
        <p className="text-xs font-semibold text-blue-100">Dashboard / Feedback & Laporan</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Feedback & Laporan</h1>
        <p className="mt-1 text-sm text-blue-100">Sampaikan masukan atau laporkan kendala langsung kepada admin.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="jd-surface overflow-hidden">
          <div className="border-b border-[#e1e7ef] px-5 py-5 sm:px-6">
            <h2 className="text-base font-bold text-[#10264D]">Kirim pesan</h2>
            <p className="mt-1 text-xs text-[#67748E]">Pesan akan langsung masuk ke panel admin Johen Donate.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="feedback-category" className="mb-2 block text-xs font-semibold text-[#10264D]">Jenis pesan</label>
                <select
                  id="feedback-category"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="jd-input min-h-11 w-full px-3 text-sm"
                >
                  <option value="feedback">Feedback / Saran</option>
                  <option value="report">Laporan Masalah</option>
                </select>
              </div>
              <div>
                <label htmlFor="feedback-email" className="mb-2 block text-xs font-semibold text-[#10264D]">Email balasan</label>
                <input
                  id="feedback-email"
                  type="email"
                  required
                  readOnly
                  value={form.email}
                  placeholder="nama@email.com"
                  className="jd-input min-h-11 w-full bg-slate-50 px-3 text-sm text-[#67748E]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="feedback-subject" className="mb-2 block text-xs font-semibold text-[#10264D]">Judul</label>
              <input
                id="feedback-subject"
                type="text"
                required
                maxLength={150}
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder={form.category === 'report' ? 'Contoh: Video media share tidak tampil' : 'Ringkas masukan Anda'}
                className="jd-input min-h-11 w-full px-3 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="feedback-message" className="text-xs font-semibold text-[#10264D]">Detail pesan</label>
                <span className="text-[11px] tabular-nums text-[#8392AB]">{form.message.length}/2000</span>
              </div>
              <textarea
                id="feedback-message"
                required
                rows={7}
                maxLength={2000}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Jelaskan masukan atau kendala secara lengkap..."
                className="jd-input w-full resize-none px-3 py-3 text-sm leading-6"
              />
            </div>

            <div>
              <label htmlFor="feedback-image" className="mb-2 block text-xs font-semibold text-[#10264D]">Screenshot pendukung <span className="font-normal text-[#8392AB]">(opsional)</span></label>
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-3">
                  <img src={imagePreview} alt="Pratinjau lampiran" className="max-h-64 w-full rounded-lg object-contain" />
                  <button type="button" onClick={removeImage} className="absolute right-5 top-5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-red-100 hover:bg-red-50">Hapus</button>
                </div>
              ) : (
                <label htmlFor="feedback-image" className="flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#93C5FD] bg-[#F8FBFF] px-4 text-center transition hover:border-[#2563EB] hover:bg-[#EFF6FF]">
                  <span><strong className="block text-sm text-[#1D4ED8]">Pilih gambar</strong><span className="mt-1 block text-xs text-[#67748E]">PNG, JPG, atau WebP maksimal 5MB</span></span>
                </label>
              )}
              <input ref={imageInputRef} id="feedback-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="flex justify-end border-t border-[#e1e7ef] pt-5">
              <button type="submit" disabled={submitting} className="jd-btn-primary w-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-40">
                {submitting ? 'Mengirim...' : 'Kirim ke Admin'}
              </button>
            </div>
          </form>
        </section>

        <aside className="jd-surface h-fit p-5 sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.3 4.2 2.6 17.5A1.7 1.7 0 0 0 4.1 20h15.8a1.7 1.7 0 0 0 1.5-2.5L13.7 4.2a1.96 1.96 0 0 0-3.4 0Z" /></svg>
          </span>
          <h2 className="mt-4 text-base font-bold text-[#10264D]">Agar cepat ditangani</h2>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[#67748E]">
            <li>Jelaskan langkah sebelum masalah terjadi.</li>
            <li>Sertakan pesan error yang tampil.</li>
            <li>Tambahkan screenshot bila diperlukan.</li>
          </ul>
          <div className="mt-5 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-4 text-xs leading-5 text-[#1E3A5F]">
            Admin dapat melihat nama akun, email balasan, dan seluruh isi laporan Anda.
          </div>
        </aside>
      </div>

      <section className="jd-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#10264D]">Riwayat feedback</h2>
            <p className="mt-1 text-xs text-[#67748E]">Pantau apakah pesan sudah dibaca oleh admin.</p>
          </div>
          <span className="w-fit rounded-lg bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#2563EB]">
            {feedbackHistory.length} pesan
          </span>
        </div>

        {historyLoading ? (
          <div className="px-6 py-12 text-center text-sm text-[#8392AB]">Memuat riwayat feedback...</div>
        ) : historyError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{historyError}</div>
        ) : feedbackHistory.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#10264D]">Belum ada feedback</p>
            <p className="mt-1 text-xs text-[#8392AB]">Pesan yang Anda kirim akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {feedbackHistory.map((feedback) => {
              const isRead = feedback.status === 'read';
              const createdAt = feedback.createdAt
                ? new Date(feedback.createdAt).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })
                : '-';

              return (
                <article key={feedback._id || feedback.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#10264D]">{feedback.subject}</h3>
                      <p className="mt-1 text-xs text-[#8392AB]">{createdAt}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${isRead ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      <span className={`h-2 w-2 rounded-full ${isRead ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                      {isRead ? 'Sudah dibaca' : 'Belum dibaca'}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#67748E]">{feedback.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {feedback.imageUrl && (
                      <a href={feedback.imageUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#2563EB] hover:underline">Lihat lampiran</a>
                    )}
                    {feedback.adminNotes && (
                      <div className="w-full rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-xs leading-5 text-[#1E3A5F]">
                        <strong className="mb-1 block text-[#2563EB]">Catatan admin</strong>
                        {feedback.adminNotes}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </CreatorAppLayout>
  );
}
