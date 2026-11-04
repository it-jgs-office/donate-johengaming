"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getStoredUser, useSessionManager } from '@/utils/sessionManager';
import { formatRupiah } from '@/utils/format';
import LeaderboardModal from '@/components/organisms/LeaderboardModal';
import Avatar from '@/components/atoms/Avatar';
import { filterMessage } from '@/utils/messageFilter';
import { getTodayDonations } from '@/utils/dateUtils';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import { subscribeToCreatorDonations } from '@/lib/pusher';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const numberToIndonesianWords = (value) => {
  const number = Math.floor(Number(value) || 0);
  const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  if (number < 0) return `minus ${numberToIndonesianWords(Math.abs(number))}`;
  if (number < 12) return words[number];
  if (number < 20) return `${numberToIndonesianWords(number - 10)} belas`;
  if (number < 100) return `${numberToIndonesianWords(Math.floor(number / 10))} puluh ${numberToIndonesianWords(number % 10)}`.trim();
  if (number < 200) return `seratus ${numberToIndonesianWords(number - 100)}`.trim();
  if (number < 1000) return `${numberToIndonesianWords(Math.floor(number / 100))} ratus ${numberToIndonesianWords(number % 100)}`.trim();
  if (number < 2000) return `seribu ${numberToIndonesianWords(number - 1000)}`.trim();
  if (number < 1000000) return `${numberToIndonesianWords(Math.floor(number / 1000))} ribu ${numberToIndonesianWords(number % 1000)}`.trim();
  if (number < 1000000000) return `${numberToIndonesianWords(Math.floor(number / 1000000))} juta ${numberToIndonesianWords(number % 1000000)}`.trim();
  return String(number);
};

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { startMonitoring, stopMonitoring } = useSessionManager();
  const [user, setUser] = useState(getStoredUser);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(() => !getStoredUser());
  const [error, setError] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'DONATION' | 'MEDIASHARE'

  const [donationEnabled, setDonationEnabled] = useState(true);
  const [mediaShareEnabled, setMediaShareEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(() => getStoredUser()?.overlayConfig?.notifications?.ttsEnabled ?? true);
  const [togglingDonation, setTogglingDonation] = useState(false);
  const [togglingMediaShare, setTogglingMediaShare] = useState(false);
  const [togglingTts, setTogglingTts] = useState(false);
  
  const lastDonationCountRef = useRef(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated' && !localStorage.getItem('token')) return;

    let isActive = true;

    const initialize = async () => {
      await checkAuth();
      if (isActive) {
        await fetchData();
      }
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [status]);

  useEffect(() => {
    if (!user?.username) return;

    return subscribeToCreatorDonations(user.username, ({ donation }) => {
      toast.success(`Saweran baru dari ${donation.name}!`, { duration: 4000 });
      fetchData(false);
    });
  }, [user?.username]);

  // Prevent back button after logout
  useEffect(() => {
    const handlePopState = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  // Start session monitoring when user is authenticated
  useEffect(() => {
    if (user) {
      startMonitoring();
    }
    return () => stopMonitoring();
  }, [user, startMonitoring, stopMonitoring]);

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

  const fetchData = async (showNewDonationNotif = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [donationsRes, statsRes, profileRes] = await Promise.all([
        axios.get('/api/dashboard/donations?limit=50', config),
        axios.get('/api/stats', config),
        axios.get('/api/user/profile', config)
      ]);

      if (profileRes.data.user) {
        const updatedUser = profileRes.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      if (profileRes.data.creator?.donationSettings?.isEnabled !== undefined) {
        setDonationEnabled(profileRes.data.creator.donationSettings.isEnabled);
      }
      if (profileRes.data.creator?.donationSettings?.mediaShareEnabled !== undefined) {
        setMediaShareEnabled(profileRes.data.creator.donationSettings.mediaShareEnabled);
      }
      setTtsEnabled(profileRes.data.creator?.overlayConfig?.notifications?.ttsEnabled ?? true);

      const allDonations = donationsRes.data.data || [];
      const todayDonations = getTodayDonations(allDonations);

      if (showNewDonationNotif && donations.length > 0 && todayDonations.length > donations.length) {
        const newCount = todayDonations.length - donations.length;
        toast.success(`${newCount} saweran baru masuk!`, { duration: 4000 });
      }

      setDonations(todayDonations);
      setStats(statsRes.data.stats || {});
      lastDonationCountRef.current = todayDonations.length;

      // Juga fetch leaderboard mini
      fetchLeaderboardData();
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status !== 401) {
        setError('Gagal memuat data dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/dashboard/leaderboard', config);
      setLeaderboardData(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const handleLogout = () => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <span className="font-bold text-sm text-[#0F2A5F]">Yakin ingin keluar?</span>
        <div className="flex gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                stopMonitoring();
                const { sessionManager } = await import('@/utils/sessionManager');
                sessionManager.isManualLogout = true;
                
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                if (session) {
                  await signOut({ redirect: false, callbackUrl: '/login' });
                }
                
                toast.success('Berhasil keluar!');
                setTimeout(() => {
                  router.replace('/');
                  sessionManager.isManualLogout = false;
                }, 500);
              } catch (error) {
                console.error('Logout error:', error);
                toast.error('Gagal keluar.');
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            Ya, Keluar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 hover:bg-gray-300 text-[#0F2A5F] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const toggleDonationStatus = async () => {
    try {
      setTogglingDonation(true);
      const token = localStorage.getItem('token');
      const newStatus = !donationEnabled;
      
      await axios.put(
        '/api/creator/toggle-donation',
        { isEnabled: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDonationEnabled(newStatus);
      toast.success(newStatus ? 'Halaman donasi dibuka' : 'Halaman donasi ditutup');
    } catch (error) {
      console.error('Error toggling donation:', error);
      toast.error('Gagal mengubah status donasi');
    } finally {
      setTogglingDonation(false);
    }
  };

  const toggleMediaShareStatus = async () => {
    try {
      setTogglingMediaShare(true);
      const token = localStorage.getItem('token');
      const newStatus = !mediaShareEnabled;
      
      await axios.put(
        '/api/creator/toggle-mediashare',
        { mediaShareEnabled: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMediaShareEnabled(newStatus);
      toast.success(newStatus ? 'Media Share aktif' : 'Media Share nonaktif');
    } catch (error) {
      console.error('Error toggling media share:', error);
      toast.error('Gagal mengubah status media share');
    } finally {
      setTogglingMediaShare(false);
    }
  };

  const toggleTtsStatus = async () => {
    try {
      setTogglingTts(true);
      const token = localStorage.getItem('token');
      const newStatus = !ttsEnabled;

      await axios.put(
        '/api/overlay-config',
        { notifications: { ttsEnabled: newStatus } },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTtsEnabled(newStatus);
      setUser((currentUser) => {
        const updatedUser = {
          ...currentUser,
          overlayConfig: {
            ...(currentUser?.overlayConfig || {}),
            notifications: {
              ...(currentUser?.overlayConfig?.notifications || {}),
              ttsEnabled: newStatus
            }
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      toast.success(newStatus ? 'Auto baca pesan aktif' : 'Auto baca pesan nonaktif');
    } catch (error) {
      console.error('Error toggling TTS:', error);
      toast.error('Gagal mengubah auto baca pesan');
    } finally {
      setTogglingTts(false);
    }
  };

  const showNotificationPreview = async (donation) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (donation.mediaShareRequest?.enabled && donation.mediaShareRequest?.youtubeUrl) {
        const mediaShareData = {
          donorName: donation.name,
          amount: donation.amount,
          youtubeUrl: donation.mediaShareRequest.youtubeUrl,
          duration: donation.mediaShareRequest.duration || 30,
          message: donation.message || '',
          timestamp: Date.now(),
          isReplay: true
        };
        
        await axios.post(`/api/overlay/replay-trigger?username=${user.username}&type=mediashare`, {
          data: mediaShareData
        }, config);
        
        localStorage.setItem('mediashare-replay-trigger', JSON.stringify(mediaShareData));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'mediashare-replay-trigger',
          newValue: JSON.stringify(mediaShareData)
        }));
        
        toast.success('Preview media share dikirim ke overlay!');
        return;
      }
      
      const { data } = await axios.get('/api/creator/filtered-words', config);
      
      const filteredWords = data.filteredWords || [];
      const filteredMessageText = filterMessage(donation.message || '', filteredWords);
      
      const notificationData = {
        message: `Donasi baru dari ${donation.name} sebesar ${formatRupiah(donation.amount)}`,
        donorName: donation.name,
        amountLabel: formatRupiah(donation.amount),
        detail: filteredMessageText,
        speechText: ttsEnabled
          ? `${numberToIndonesianWords(donation.amount)} dari ${donation.name}.${filteredMessageText ? ` Pesan: ${filteredMessageText}` : ' Tanpa pesan.'}`
          : '',
        time: new Date(donation.createdAt).toLocaleTimeString('id-ID'),
        timestamp: Date.now()
      };
      
      await axios.post(`/api/overlay/replay-trigger?username=${user.username}&type=notification`, {
        data: notificationData
      }, config);
      
      localStorage.setItem('overlay-notification-trigger', JSON.stringify(notificationData));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'overlay-notification-trigger',
        newValue: JSON.stringify(notificationData)
      }));
      
      toast.success('Preview notifikasi dikirim ke overlay!');
    } catch (error) {
      console.error('Error preview notification:', error);
      toast.error('Gagal mengirim ke overlay');
    }
  };

  const triggerTestSound = async () => {
    if (!user?.username) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const speechResponse = await axios.post('/api/overlay/preview-speech-url', {}, config);
      const testNotification = {
        message: 'Donasi baru dari Budi sebesar Rp25.000',
        donorName: 'Budi',
        amountLabel: 'Rp25.000',
        detail: 'Semangat terus live-nya!',
        speechText: 'Dua puluh lima ribu dari Budi. Pesan: semangat terus live-nya!',
        audioUrl: speechResponse.data.audioUrl,
        time: new Date().toLocaleTimeString('id-ID'),
        timestamp: Date.now()
      };

      await axios.post(`/api/overlay/replay-trigger?username=${user.username}&type=notification`, {
        data: testNotification
      }, config);

      toast.success('Data dummy dikirim ke overlay!');
    } catch (error) {
      console.error('Error testing overlay:', error);
      toast.error('Gagal mengirim data dummy ke overlay');
    }
  };

  if (status === 'loading' || loading) {
    return null;
  }

  if (!user && status !== 'authenticated') {
    return null;
  }

  // Filter donations according to selected tab
  const filteredDonations = donations.filter((d) => {
    if (filterType === 'MEDIASHARE') return d.mediaShareRequest?.enabled;
    if (filterType === 'DONATION') return !d.mediaShareRequest?.enabled;
    return true;
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <CreatorAppLayout user={user} onLogout={handleLogout}>
      {/* Warning Banners */}
      {(!user?.username || user?.username === '') && (
        <div className="admin-panel-card flex flex-col items-start justify-between gap-3 border-l-4 border-amber-400 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-extrabold text-sm text-[#0F2A5F]">Username belum diatur</h4>
              <p className="text-xs font-medium text-[#526987] mt-0.5">Atur username agar tautan donasi bisa dibagikan.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="shrink-0 cursor-pointer rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            Setup Sekarang
          </button>
        </div>
      )}

      {user?.username && !user?.isPayoutReady && (
        <div className="admin-panel-card flex flex-col items-start justify-between gap-3 border-l-4 border-[#2563EB] p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <h4 className="font-extrabold text-sm text-[#0F2A5F]">Rekening pencairan belum diisi</h4>
              <p className="text-xs font-medium text-[#526987] mt-0.5">Lengkapi rekening agar kamu bisa mencairkan saldo.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/profile?section=payout')}
            className="shrink-0 cursor-pointer rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            Isi Rekening
          </button>
        </div>
      )}

      {/* Donation Link Bar */}
      <div className="admin-panel-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex-1 w-full min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#8392AB]">Tautan Donasi</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex flex-1 select-all items-center overflow-hidden rounded-lg border border-[#D2D6DA] bg-[#F8F9FA] px-4 py-2.5 text-sm font-medium text-[#10264D]">
                <span className="truncate">localhost:3000/donate/{user?.username || 'namamu'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = `${baseUrl}/donate/${user?.username}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Tautan disalin!');
                  }}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Salin
                </button>
                {user?.username && (
                  <a
                    href={`/donate/${user.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-[#D2D6DA] bg-white px-4 py-2.5 text-center text-xs font-semibold text-[#10264D] shadow-sm hover:bg-[#F8F9FA]"
                  >
                    Buka
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Status Toggles */}
          {user?.username && (
            <div className="flex w-full flex-wrap items-center gap-6 border-t border-slate-200 pt-4 lg:w-auto lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#526987]">Donasi</span>
                  <span className={`text-xs font-semibold ${donationEnabled ? 'text-emerald-700' : 'text-[#607697]'}`}>
                    {donationEnabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleDonationStatus}
                  disabled={togglingDonation}
                  aria-label="Toggle Donasi"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
                    donationEnabled ? 'bg-emerald-500' : 'bg-[#DBEAFE]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      donationEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#526987]">Media Share</span>
                  <span className={`text-xs font-semibold ${mediaShareEnabled ? 'text-blue-700' : 'text-[#607697]'}`}>
                    {mediaShareEnabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleMediaShareStatus}
                  disabled={togglingMediaShare}
                  aria-label="Toggle Media Share"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
                    mediaShareEnabled ? 'bg-blue-500' : 'bg-[#DBEAFE]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      mediaShareEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-[#526987]">Auto Baca</span>
                  <span className={`text-xs font-semibold ${ttsEnabled ? 'text-[#1D4ED8]' : 'text-[#607697]'}`}>
                    {ttsEnabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ttsEnabled}
                  onClick={toggleTtsStatus}
                  disabled={togglingTts}
                  aria-label="Aktifkan atau nonaktifkan auto baca pesan donasi"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-50 ${
                    ttsEnabled ? 'bg-[#2563EB]' : 'bg-[#DBEAFE]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      ttsEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Saldo siap cair', value: formatRupiah(stats?.paidAmount || stats?.totalAmount || 0), helper: 'Siap diajukan', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 11h2m4 0h2M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /> },
          { label: 'Donasi hari ini', value: formatRupiah(stats?.todayAmount || 0), helper: `${stats?.todayDonations || 0} donasi masuk`, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 6.65-7 11-7 11Z" /> },
          { label: 'Total donasi', value: formatRupiah(stats?.totalAmount || 0), helper: 'Akumulasi seluruh waktu', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
          { label: 'Donatur tercatat', value: donations.length.toLocaleString('id-ID'), helper: 'Riwayat dukungan', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87" /> },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card flex min-h-[126px] items-start justify-between gap-4 p-5">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#8392AB]">{item.label}</p><p className="mt-2 truncate text-xl font-bold tracking-tight text-[#10264D] sm:text-2xl">{item.value}</p><p className="mt-2 text-xs text-[#67748E]">{item.helper}</p></div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0F2A5F] text-white shadow-[0_7px_16px_rgba(37,99,235,0.3)]"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg></span>
          </div>
        ))}
      </div>

      {/* Feed Saweran */}
      <div className="admin-panel-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="text-base font-bold text-[#10264D]">Saweran hari ini</h3>
            <p className="mt-1 text-xs text-[#67748E]">Apresiasi dalam 24 jam terakhir.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#F1F3F5] p-1">
            {[
              { key: 'ALL', label: `Semua (${donations.length})` },
              { key: 'DONATION', label: 'Saweran' },
              { key: 'MEDIASHARE', label: 'Media Share' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === tab.key
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#67748E] hover:text-[#10264D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Donation Items */}
        {filteredDonations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredDonations.map((donation) => {
              const isPending = donation.status === 'PENDING';
              const isMediaShare = donation.mediaShareRequest?.enabled;

              return (
                <div
                  key={donation._id}
                  className={`px-5 py-4 transition hover:bg-[#F8FBFF] sm:px-6 ${isPending ? 'opacity-50' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <Avatar name={donation.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#10264D]">{donation.name || 'Anonim'}</span>
                          <span className="text-xs text-[#8392AB]">
                            {new Date(donation.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMediaShare && (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Media Share
                            </span>
                          )}
                          {isPending && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              Pending
                            </span>
                          )}
                        </div>

                        {donation.message ? (
                          <p className="mt-2 break-words rounded-lg bg-[#F8F9FA] p-2.5 text-sm text-[#52637A]">
                            {donation.message}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-[#607697] italic">Tanpa pesan</p>
                        )}

                        {isMediaShare && donation.mediaShareRequest?.youtubeUrl && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-800 font-mono font-bold truncate">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">{donation.mediaShareRequest.youtubeUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3 shrink-0 sm:ml-4">
                      <span className="text-base font-bold text-[#10264D]">
                        {formatRupiah(donation.amount)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isPending && (
                          <button
                            type="button"
                            onClick={() => showNotificationPreview(donation)}
                          className="cursor-pointer rounded-lg bg-[#EFF6FF] p-2 text-[#2563EB] transition hover:bg-[#DBEAFE]"
                            title="Replay di overlay"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <img
              src="/logo-blue.png"
              alt="Logo Johen Donate"
              className="h-16 w-16 object-contain select-none opacity-60 mx-auto mb-3"
            />
            <h4 className="font-extrabold text-sm text-[#0F2A5F]">
              Belum ada saweran hari ini
            </h4>
            <p className="mt-1 text-xs font-medium text-[#526987] max-w-xs mx-auto">
              Bagikan tautan donasimu di bio sosmed atau deskripsi stream.
            </p>
            <button
              type="button"
              onClick={() => {
                const url = `${baseUrl}/donate/${user?.username}`;
                navigator.clipboard.writeText(url);
                toast.success('Tautan disalin!');
              }}
              className="mt-4 cursor-pointer rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
            >
              Salin Tautan
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="admin-panel-card p-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-[#10264D]">Top donatur bulan ini</h3>
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          {leaderboardData.length > 0 ? (
            <div className="space-y-2">
              {leaderboardData.slice(0, 5).map((donor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[10px] font-bold text-[#2563EB]">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-[#10264D]">{donor.name}</span>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#10264D]">{formatRupiah(donor.totalAmount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-bold text-[#607697] text-center py-4">Belum ada donatur bulan ini.</p>
          )}
        </div>

      </div>

      {/* Modals */}
      {showLeaderboard && (
        <LeaderboardModal 
          onClose={() => setShowLeaderboard(false)} 
          leaderboardData={leaderboardData} 
        />
      )}
    </CreatorAppLayout>
  );
}
