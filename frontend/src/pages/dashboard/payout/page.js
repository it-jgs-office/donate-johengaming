"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getStoredUser, useSessionManager } from '@/utils/sessionManager';
import { formatRupiah } from '@/utils/format';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import Link from 'next/link';
import { subscribeToCreatorEvent } from '@/lib/pusher';

const PAYOUT_STATUS = {
  PENDING: {
    label: 'Menunggu',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    dotClassName: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Disetujui',
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    dotClassName: 'bg-blue-500',
  },
  PROCESSED: {
    label: 'Selesai',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClassName: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'border-red-200 bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
};

export default function PayoutPage() {
  const [payouts, setPayouts] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [stats, setStats] = useState(null);
  const router = useRouter();
  const { startMonitoring, stopMonitoring } = useSessionManager();
  const [user, setUser] = useState(getStoredUser);

  const calculateAvailableBalance = () => {
    return Math.max(0, Number(stats?.paidAmount) || 0);
  };

  // Check auth and fetch user
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      startMonitoring();
    }
    return () => stopMonitoring();
  }, [user, startMonitoring, stopMonitoring]);

  // Fetch stats for saldo calculation
  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await axios.get('/api/stats', {
          headers: { Authorization: `Bearer ${token}` },
          skipGlobalLoading: true
        });
        setStats(res.data.stats || {});
      } catch (e) {
        if (e.response?.status !== 401) {
          console.error('Error fetching stats:', e);
        }
      }
    };
    
    fetchStats();
  }, [user]);

  // Fetch payout history
  useEffect(() => {
    if (!user) return;
    
    const fetchPayouts = async () => {
      setPayoutLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const endpoint = user.userType === 'admin' 
          ? '/api/admin/payouts' 
          : '/api/creator/payouts';
          
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          skipGlobalLoading: true
        });
        setPayouts(res.data.data || []);
      } catch (e) {
        if (e.response?.status !== 401) {
          console.error('Error fetching payouts:', e);
          setPayoutError('Gagal memuat riwayat pencairan');
        }
      } finally {
        setPayoutLoading(false);
      }
    };
    
    fetchPayouts();
  }, [user]);

  useEffect(() => {
    if (!user?.username) return;

    return subscribeToCreatorEvent(user.username, 'payout.updated', async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const endpoint = user.userType === 'admin' ? '/api/admin/payouts' : '/api/creator/payouts';
        const [statsRes, payoutsRes] = await Promise.all([
          axios.get('/api/stats', {
            headers: { Authorization: `Bearer ${token}` },
            skipGlobalLoading: true
          }),
          axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
            skipGlobalLoading: true
          })
        ]);
        setStats(statsRes.data.stats || {});
        setPayouts(payoutsRes.data.data || []);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Gagal memperbarui payout realtime:', error);
        }
      }
    });
  }, [user?.username, user?.userType]);

  // Request payout manual
  const handleRequestPayout = async () => {
    const available = calculateAvailableBalance();
    const requestedAmount = Number(withdrawAmount) || 0;

    if (requestedAmount < 50000) {
      toast.error('Minimal penarikan dana adalah Rp50.000');
      return;
    }
    if (requestedAmount > available) {
      toast.error('Nominal penarikan melebihi saldo tersedia');
      return;
    }

    setRequestingPayout(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/creator/request-payout', 
        { amount: requestedAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Permintaan pencairan dana berhasil diajukan!');
      setWithdrawAmount('');
      
      const endpoint = user.userType === 'admin' 
        ? '/api/admin/payouts' 
        : '/api/creator/payouts';
        
      const payoutRes = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayouts(payoutRes.data.data || []);

      const statsRes = await axios.get('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data.stats || {});
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.message || 'Gagal mengajukan pencairan');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (!user) {
    return null;
  }

  const availableBalance = calculateAvailableBalance();
  const requestedAmount = Number(withdrawAmount) || 0;
  const canRequestPayout = requestedAmount >= 50000
    && requestedAmount <= availableBalance
    && user?.isPayoutReady;

  return (
    <CreatorAppLayout user={user}>
      {/* Page Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-100">
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <span>/</span>
          <span className="font-semibold text-white">Pencairan</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pencairan Dana</h1>
        <p className="mt-0.5 text-sm font-medium text-blue-100">Tarik saldo donasi ke rekening terdaftar.</p>
      </div>

      {/* Balance + Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Balance Card */}
        <div className="lg:col-span-3 jd-surface-strong p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#93C5FD] mb-1">Saldo Bersih Siap Tarik</p>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatRupiah(availableBalance)}
            </div>

            <div className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white/85">
              Tanpa biaya penarikan
            </div>

            <div className="mt-6 border-t-2 border-white/10 pt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="withdrawAmount" className="text-xs font-extrabold text-white/75">
                  Nominal penarikan
                </label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(availableBalance))}
                  disabled={availableBalance < 50000}
                  className="text-xs font-extrabold text-[#BFDBFE] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Tarik semua
                </button>
              </div>
              <div className="flex min-h-14 items-center rounded-xl border-2 border-white/20 bg-white/10 px-4 focus-within:border-[#60A5FA] focus-within:bg-white/15">
                <span className="mr-3 text-base font-black text-[#93C5FD]">Rp</span>
                <input
                  id="withdrawAmount"
                  type="text"
                  inputMode="numeric"
                  value={withdrawAmount ? Number(withdrawAmount).toLocaleString('id-ID') : ''}
                  onChange={(event) => setWithdrawAmount(event.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan nominal"
                  className="min-w-0 flex-1 bg-transparent text-lg font-black tabular-nums text-white outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-white/35"
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-white/50">Minimal penarikan Rp50.000.</p>
            </div>
          </div>

          {/* Withdraw Action */}
          <div className="mt-6 pt-4 border-t-2 border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {user?.isPayoutReady && (
              <div className="text-xs font-medium text-white/60">
                <span className="block font-bold">Rekening Tujuan:</span>
                <span className="text-white font-mono font-bold">{user.payoutBankName} - {user.payoutAccountNumber}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={requestingPayout || !canRequestPayout}
              className="px-6 py-2.5 rounded-xl border border-[#60A5FA]/70 bg-[#2563EB] text-white text-sm font-extrabold shadow-[0_10px_20px_rgba(15,42,95,0.22)] hover:bg-[#3B82F6] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:translate-y-0.5"
            >
              {requestingPayout ? 'Memproses...' : requestedAmount ? `Tarik ${formatRupiah(requestedAmount)}` : 'Tarik Dana'}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="lg:col-span-2 jd-surface p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#607697] mb-3">Rekening Penerima</p>

            {user?.isPayoutReady ? (
              <div className="space-y-3 bg-[#f8fbfd] border border-[#e1e7ef] rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-[#0F2A5F]/10 pb-2">
                  <span className="text-xs font-extrabold text-[#0F2A5F]">Status: Aktif</span>
                  <Link
                    href="/dashboard/profile?section=payout"
                    className="text-xs font-bold text-[#0F2A5F] hover:underline"
                  >
                    Detail Profil &rarr;
                  </Link>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#607697] block">Bank / E-Wallet</span>
                  <span className="text-base font-black text-[#0F2A5F]">{user?.payoutBankName || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#607697] block">Nomor Rekening</span>
                  <span className="text-base font-mono font-black text-[#0F2A5F]">{user?.payoutAccountNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#607697] block">Nama Pemilik</span>
                  <span className="text-sm font-extrabold text-[#0F2A5F]">{user?.payoutAccountHolder || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900 space-y-2">
                <p className="font-extrabold text-sm">Belum ada rekening</p>
                <p className="text-amber-800">Lengkapi rekening di Pengaturan Profil agar bisa mencairkan saldo saweran.</p>
                <Link
                  href="/dashboard/profile?section=payout"
                  className="inline-block mt-1 px-3.5 py-1.5 rounded-lg border-2 border-[#0F2A5F] bg-[#0F2A5F] text-white text-xs font-extrabold shadow-[2px_2px_0px_#2563EB] hover:bg-black transition active:translate-y-0.5"
                >
                  Lengkapi Rekening &rarr;
                </Link>
              </div>
            )}
          </div>

          <p className="mt-4 pt-3 border-t-2 border-[#0F2A5F]/10 text-xs font-bold text-[#607697]">
            Proses 1x24 jam hari kerja. Min. penarikan Rp50.000 tanpa biaya.
          </p>
        </div>
      </div>

      {/* Payout History */}
      <div className="jd-surface overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b-2 border-[#0F2A5F] bg-[#f7fcff] flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-[#0F2A5F]">Riwayat Pencairan</h3>
            <p className="text-xs font-medium text-[#526987] mt-0.5">Seluruh pengajuan penarikan saldo</p>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg border border-[#0F2A5F] bg-[#ffffff] text-[#0F2A5F] shadow-[1px_1px_0px_#0F2A5F]">
            {payouts.length} pengajuan
          </span>
        </div>

        {payoutError && (
          <div className="m-4 rounded-xl border-2 border-red-500 bg-red-100 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#dc2626]">
            {payoutError}
          </div>
        )}

        {payoutLoading ? (
          <div className="p-12 text-center text-xs font-bold text-[#607697]">
            Memuat riwayat...
          </div>
        ) : payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#0F2A5F] bg-[#f7fcff] text-xs font-black text-[#0F2A5F]">
                  <th className="px-5 py-3.5">ID & Waktu</th>
                  <th className="px-5 py-3.5">Nominal</th>
                  <th className="px-5 py-3.5">Tujuan</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0F2A5F]/10 text-sm">
                {payouts.map((p) => {
                  const status = PAYOUT_STATUS[p.status] || {
                    label: p.status || 'Tidak diketahui',
                    className: 'border-slate-200 bg-slate-50 text-slate-700',
                    dotClassName: 'bg-slate-400',
                  };
                  const bankInfo = p.bankInfo || {};
                  const requestedAt = p.requestedAt || p.createdAt;

                  return (
                    <tr key={p._id} className="hover:bg-[#f7fcff] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold text-[#0F2A5F]">
                          #{p._id?.slice(-8) || '-'}
                        </div>
                        <div className="text-xs font-medium text-[#607697] mt-0.5">
                          {requestedAt ? new Date(requestedAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-base text-[#0F2A5F]">
                        {formatRupiah(p.amount || 0)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-extrabold text-[#0F2A5F]">
                          {bankInfo.bankName || '-'}
                        </div>
                        <div className="mt-1 text-xs font-mono font-semibold text-[#526987]">
                          {bankInfo.accountNumber || '-'}
                        </div>
                        <div className="mt-1 text-xs font-bold text-[#0F2A5F]">
                          a.n. {bankInfo.accountName || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${status.className}`}>
                          <span className={`h-2 w-2 rounded-full ${status.dotClassName}`} aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.adminNote || p.adminNotes || p.notes ? (
                          <div className="max-w-xs rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-xs font-semibold leading-relaxed text-[#1E3A5F]">
                            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">Catatan admin</span>
                            {p.adminNote || p.adminNotes || p.notes}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[#94A3B8]">Belum ada catatan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs font-bold text-[#607697]">
            Belum ada riwayat penarikan dana.
          </div>
        )}
      </div>
    </CreatorAppLayout>
  );
}
