
'use client'

import { useState, useEffect } from 'react';
import { formatRupiah } from '@/utils/format';
import { useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import ShareModal from '@/components/organisms/ShareModal';
import { subscribeToCreatorDonations } from '@/lib/pusher';

const getYouTubeVideoId = (value) => {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) return videoId;

      const [type, id] = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(type)) return id || null;
    }
  } catch {
    return null;
  }

  return null;
};

const getExternalUrl = (value) => {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const DONOR_NAME_STORAGE_KEY = 'johen-donate:donor-name';

const getStoredDonorName = () => {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem(DONOR_NAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const SocialIcon = ({ platform }) => {
  const iconClass = 'h-4 w-4 sm:h-[18px] sm:w-[18px]';

  if (platform === 'youtube') {
    return <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
  }

  if (platform === 'instagram') {
    return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r=".8" fill="currentColor" stroke="none" /></svg>;
  }

  if (platform === 'tiktok') {
    return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M14 4v10.2a3.7 3.7 0 1 1-2.5-3.5M14 4c1.1 2.4 2.8 3.8 5 4" /></svg>;
  }

  if (platform === 'twitch') {
    return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h15v10l-5 5h-4l-3 2v-2H5V4Zm5 4v4m4-4v4" /></svg>;
  }

  return <span className="text-xs font-bold">X</span>;
};


export default function DonatePage() {
  const params = useParams();
  const username = params.username;
  
  // All state and variables must be declared before any useEffect
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => ({
    name: getStoredDonorName(),
    amount: '',
    message: '',
  }));
  const [donating, setDonating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pendingRef, setPendingRef] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [completedDonationId, setCompletedDonationId] = useState(null);
  const [todayShares, setTodayShares] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [enableMediaShare, setEnableMediaShare] = useState(false);
  const presetAmounts = [5000, 10000, 25000, 50000, 100000];

  // Check if media share is enabled for this creator
  const isMediaShareEnabled = creator?.donationSettings?.mediaShareEnabled !== false;

  useEffect(() => {
    if (username) {
      fetchCreatorData();
      fetchShareStats();
    }
  }, [username]);

  const fetchCreatorData = async () => {
    try {
      const response = await axios.get(`/api/donate/${username}`);
      const data = response.data;
      
      // Check if donation is disabled (status 200 but disabled flag)
      if (data.disabled) {
        setCreator(data.creator);
        setError(data.error);
      } else {
        setCreator(data.creator);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
      
      if (error.response?.status === 404) {
        setError('Creator tidak ditemukan');
      } else if (error.response?.status === 403) {
        setError('Creator belum mengaktifkan donasi');
      } else {
        setError('Gagal memuat data creator');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShareStats = async () => {
    try {
      const response = await axios.get(`/api/donate/share-stats/${username}`);
      setTodayShares(response.data.totalShares ?? 0);
    } catch (error) {
      console.error('Error fetching share stats:', error);
      // Silently fail, tidak perlu show error
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'name' && !isAnonymous) {
      try {
        if (value.trim()) {
          localStorage.setItem(DONOR_NAME_STORAGE_KEY, value);
        } else {
          localStorage.removeItem(DONOR_NAME_STORAGE_KEY);
        }
      } catch {}
    }
  };

  const handleAnonymousToggle = (e) => {
    const checked = e.target.checked;
    setIsAnonymous(checked);
    if (checked) {
      setFormData({ ...formData, name: 'Anonim' });
    } else {
      setFormData({ ...formData, name: getStoredDonorName() });
    }
  };

  const handleAmountSelect = (amount) => {
    setFormData({
      ...formData,
      amount: amount.toString()
    });
  };

  // Format amount with thousand separator for display
  const formatAmountDisplay = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle amount input change - strip non-numeric and store raw value
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({
      ...formData,
      amount: rawValue
    });
  };

  // Durasi Media Share selalu ditentukan oleh nominal donasi.
  const getMediaDuration = (amount) => {
    const amt = parseInt(amount) || 0;
    const rules = {
      under10000: 15,
      from10000: 30,
      from20000: 60,
      from50000: 120,
      from100000: 300,
      ...(creator?.donationSettings?.mediaShareDurationRules || {}),
    };
    if (amt >= 100000) return rules.from100000;
    if (amt >= 50000) return rules.from50000;
    if (amt >= 20000) return rules.from20000;
    if (amt >= 10000) return rules.from10000;
    return rules.under10000;
  };

  const formatMediaDuration = (seconds) => {
    const value = Number(seconds) || 0;
    if (value < 60) return `${value} detik`;
    const minutes = value / 60;
    return `${Number(minutes.toFixed(2)).toLocaleString('id-ID')} menit`;
  };

  const mediaDuration = getMediaDuration(formData.amount);
  const youtubeVideoId = getYouTubeVideoId(youtubeUrl);
  const socialLinks = [
    ['youtube', 'YouTube'],
    ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'],
    ['twitch', 'Twitch'],
    ['twitter', 'X / Twitter'],
  ].map(([platform, label]) => ({ platform, label, url: getExternalUrl(creator?.socialLinks?.[platform]) }))
    .filter(({ url }) => url);

  // Receive paid status in real time from the backend webhook.
  useEffect(() => {
    if (!username || !pendingRef || !completedDonationId) return;

    return subscribeToCreatorDonations(username, ({ donation }) => {
      const paidDonationId = String(donation?._id || donation?.id || '');
      if (paidDonationId === String(completedDonationId)) {
        handlePaymentSuccess(completedDonationId);
      }
    });
  }, [username, pendingRef, completedDonationId]);

  const handlePaymentSuccess = (donationId) => {
    toast.success('Pembayaran berhasil!');
    fetchShareStats(); // refresh share count
    setSuccess(true);
    setCompletedDonationId(donationId);
    setShowShareModal(true);
    setFormData({ name: getStoredDonorName(), amount: '', message: '' });
    setAgreedToTerms(false);
    setEnableMediaShare(false);
    setYoutubeUrl('');
    setPendingRef(null);
  };

  const loadSnapScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('midtrans-snap')) return resolve();
      const script = document.createElement('script');
      script.id = 'midtrans-snap';
      const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
      script.src = isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDonating(true);
    setError('');

    // Frontend validation
    if (!formData.name || !formData.amount) {
      toast.error('Semua field wajib diisi!');
      setDonating(false);
      return;
    }

    if (!agreedToTerms) {
      toast.error('Anda harus menyetujui syarat dan ketentuan!');
      setDonating(false);
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount < 1) {
      toast.error('Minimal donasi adalah Rp 1!');
      setDonating(false);
      return;
    }

    if (amount > 10000000) {
      toast.error('Maksimal donasi adalah Rp 10.000.000!');
      setDonating(false);
      return;
    }

    if (formData.name.length < 2) {
      toast.error('Nama minimal 2 karakter!');
      setDonating(false);
      return;
    }

    // Validate media share if URL is provided
    if (youtubeUrl) {
      if (!youtubeVideoId) {
        toast.error('Format URL YouTube tidak valid!');
        setDonating(false);
        return;
      }

    }

    try {
      // Prepare donation data
      const donationData = { ...formData, payment_method: 'midtrans' };

      // Add media share request if URL provided
      if (youtubeUrl) {
        donationData.mediaShare = {
          enabled: true,
          youtubeUrl: youtubeUrl.trim()
        };
      }

      const response = await axios.post(`/api/donate/${username}`, donationData);
      if (response.data.success) {
        const token = response.data.payment?.token;
        const merchantRef = response.data.donation.merchant_ref;
        const donationId = response.data.donation._id;
        setCompletedDonationId(donationId);
        setPendingRef(merchantRef);
        await loadSnapScript();
    if (window.snap && token) {
          window.snap.pay(token, {
            onSuccess: async function() {
              try {
                const statusCheck = await axios.post('/api/check-payment-status', { merchant_ref: merchantRef });

                if (statusCheck.data.status !== 'PAID') {
                  toast('Pembayaran diterima, menunggu konfirmasi Midtrans...');
                  setPendingRef(merchantRef);
                  return;
                }

                toast.success('Pembayaran berhasil!');

                if (youtubeUrl) {
                  toast.success('Media share akan segera diproses!');
                }
              } catch (err) {
                console.error('Failed to check payment status:', err);
                toast('Pembayaran diterima, menunggu konfirmasi Midtrans...');
                setPendingRef(merchantRef);
                return;
              }
              fetchShareStats(); // Refresh share count
              
              setSuccess(true);
              setCompletedDonationId(donationId);
              setShowShareModal(true);
              setFormData({ name: getStoredDonorName(), amount: '', message: '' });
              setAgreedToTerms(false);
              setEnableMediaShare(false);
              setYoutubeUrl('');
              setPendingRef(null);
            },
            onPending: function() {
      toast('Menunggu pembayaran...');
              setPendingRef(merchantRef);
            },
            onError: function() {
              toast.error('Pembayaran gagal');
              setPendingRef(null);
            },
            onClose: async function() {
              // When user closes popup, check payment status
              toast('Mengecek status pembayaran...');
              
              try {
                const statusCheck = await axios.post('/api/check-payment-status', { 
                  merchant_ref: merchantRef 
                });
                
                if (statusCheck.data.status === 'PAID') {
                  toast.success('Pembayaran berhasil!');
                  setSuccess(true);
                  setCompletedDonationId(donationId);
                  setShowShareModal(true);
                  setFormData({ name: getStoredDonorName(), amount: '', message: '' });
                  setAgreedToTerms(false);
                  setPendingRef(null);
                } else if (statusCheck.data.status === 'PENDING') {
                  toast('Pembayaran masih pending. Silakan selesaikan pembayaran.');
                  setPendingRef(merchantRef);
                } else {
                  toast('Popup pembayaran ditutup');
                }
              } catch (err) {
                console.error('Failed to check payment status:', err);
                toast('Popup pembayaran ditutup');
              }
            }
          });
        } else {
          toast.error('Gagal memuat pembayaran');
        }
      }      
    } catch (error) {
      let errorMessage = error.response?.data?.error || 'Terjadi kesalahan';
      
      // Check if donation is disabled
      if (error.response?.data?.disabled) {
        setError(error.response.data.error);
      } else if (error.response?.status === 403) {
        errorMessage = 'Donasi belum aktif untuk creator ini';
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setDonating(false);
    }
  };

  // (Simulation helpers removed for production)

  if (loading) {
    return null;
  }

  if (error && !creator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_20px_45px_rgba(15,42,95,0.14)]">
          <img src="/logo-blue.png" alt="Johen Donate" className="mx-auto mb-5 h-20 w-20 object-contain" />
          <h1 className="mb-2 text-2xl font-extrabold text-[#0F2A5F]">Creator tidak ditemukan</h1>
          <p className="text-sm text-[#526987]">{error}</p>
          <a href="/" className="mt-6 inline-flex rounded-xl bg-[#0F2A5F] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]">
            Kembali ke beranda
          </a>
        </div>
      </div>
    );
  }

  // Jika creator ada tapi error karena belum aktifkan donasi
  if (creator && ['Creator belum mengaktifkan donasi', 'Creator belum melengkapi pengaturan pencairan dana'].includes(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
        <div className="max-w-md w-full mx-auto py-8">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_20px_45px_rgba(15,42,95,0.14)]">
            <img src={creator.profileImage || '/logo-blue.png'} alt={creator.displayName} className="mx-auto mb-4 h-20 w-20 rounded-2xl border-2 border-[#BFDBFE] bg-white object-cover p-1" />
            <h2 className="mb-3 text-2xl font-extrabold text-[#0F2A5F]">Donasi belum aktif</h2>
            <p className="text-sm leading-relaxed text-[#526987]">Creator ini belum melengkapi informasi pencairan dana untuk menerima donasi.</p>
          </div>
        </div>
      </div>
    );
  }

  // Jika creator menonaktifkan donasi
  if (creator && error === 'Donasi sedang tidak aktif') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
        <div className="max-w-md w-full mx-auto py-8">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_20px_45px_rgba(15,42,95,0.14)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 9V7a4 4 0 0 0-8 0v2m-2 0h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F2A5F] mb-4">Donasi Sedang Tidak Aktif</h2>
            <p className="text-[#4B6282] mb-2">
              <strong>{creator.displayName}</strong> sedang menonaktifkan fitur donasi untuk sementara waktu.
            </p>
            <p className="text-[#607697] text-sm">
              Silakan coba lagi nanti. Terima kasih atas pengertiannya.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F9FA] px-3 py-5 font-sans sm:px-6 sm:py-8 lg:px-8">
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            fetchShareStats(); // Refresh share count when modal closed
          }}
          onShare={() => {
            // Refresh page after share/copy
            window.location.reload();
          }}
          creatorUsername={creator?.username}
          donationId={completedDonationId}
        />
      )}

      {/* Main Container - wider on desktop only when media share enabled */}
      <div className={`relative z-10 mx-auto w-full ${isMediaShareEnabled ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <header className="mb-5 flex items-center justify-between px-1 text-[#10264D] sm:mb-6">
          <a href="/" className="flex items-center gap-3 transition hover:opacity-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
              <img src="/logo-blue.png" alt="Johen Donate" className="h-8 w-8 object-contain" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">Johen Donate</p>
              <p className="mt-0.5 text-[11px] text-[#67748E]">Dukungan untuk kreator</p>
            </div>
          </a>
          <div className="hidden items-center gap-2 rounded-lg border border-[#DCE6F3] bg-white px-3 py-2 text-xs font-semibold text-[#2563EB] shadow-sm sm:flex">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75 11.25 15 15 9.75M12 3l7 3v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Z" /></svg>
            Pembayaran aman
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_20px_45px_rgba(15,42,95,0.16)]">
          {creator.coverImage && (
            <div className="relative aspect-[16/5] w-full bg-[#EFF6FF]">
              <img
                src={creator.coverImage}
                alt={`Sampul ${creator.displayName}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <section className="border-b border-[#E2E8F0] px-5 pb-6 text-center sm:px-8">
            <div className={`relative z-10 flex flex-col items-center ${creator.coverImage ? '-mt-12' : 'pt-7'}`}>
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_10px_24px_rgba(15,42,95,0.2)] sm:h-28 sm:w-28">
                <img
                  src={creator.profileImage || '/logo-blue.png'}
                  alt={`Foto profil ${creator.displayName}`}
                  onError={(event) => { event.currentTarget.src = '/logo-blue.png'; }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex max-w-full items-center justify-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-[#10264D] sm:text-xl">{creator.displayName}</h1>
                <img src="/icons/secure.gif" alt="Akun aman" className="h-6 w-6 shrink-0 object-contain" />
              </div>
              <p className="mt-0.5 text-xs font-medium text-[#67748E]">@{creator.username}</p>
            </div>

            {todayShares > 0 && (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#52637A]">
                <svg className="h-4 w-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15m3.15 5.85a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.14-1.14" />
                </svg>
                <span><strong>{todayShares} orang</strong> sudah membagikan link ini hari ini</span>
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {socialLinks.map(({ platform, label, url }) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE6F3] bg-white text-[#2563EB] transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] sm:w-auto sm:gap-2 sm:px-3 sm:text-xs sm:font-semibold"
                  >
                    <span className="flex items-center justify-center">
                      <SocialIcon platform={platform} />
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <div className="p-5 sm:p-8 lg:p-9">
          {error && (
            <div className="mb-5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
              <div className="text-xs font-semibold text-[#1D4ED8] sm:text-sm">{error}</div>
            </div>
          )}

          {/* Form with 2 columns on desktop when media share enabled */}
          <form onSubmit={handleSubmit}>
            <div className={isMediaShareEnabled ? 'lg:grid lg:grid-cols-5 lg:gap-8' : ''}>
              {/* Left Column - Basic Info (3/5 width when media share on, full width when off) */}
              <div className={`space-y-5 ${isMediaShareEnabled ? 'lg:col-span-3' : ''}`}>
                {/* Nama */}
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#10264D]">
                    Nama Anda <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6478A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                    </svg>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isAnonymous}
                      className="min-h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#F8FAFC] py-3 pl-12 pr-4 text-sm font-medium text-[#10264D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={handleAnonymousToggle}
                      className="h-5 w-5 cursor-pointer rounded accent-[#2563EB]"
                    />
                    <label htmlFor="anonymous" className="cursor-pointer text-sm font-medium text-[#64748B]">
                      Sembunyikan nama saya
                    </label>
                  </div>
                </div>

                {/* Jumlah */}
                <div>
                  <label htmlFor="amount" className="mb-3 block text-sm font-semibold text-[#10264D]">
                    Jumlah Donasi <span className="text-red-400">*</span>
                  </label>
                  <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`min-h-11 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                          formData.amount === amount.toString()
                            ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-sm'
                            : 'border-[#DCE6F3] bg-white text-[#334E73] hover:border-[#93C5FD] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {formatRupiah(amount)}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Zm0 0V6a2 2 0 0 1 2-2h11m1 9h.01" />
                    </svg>
                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-base font-extrabold text-[#2563EB]">Rp</span>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      value={formatAmountDisplay(formData.amount)}
                      onChange={handleAmountChange}
                      required
                      inputMode="numeric"
                      className="min-h-14 w-full rounded-xl border border-[#DCE6F3] bg-[#F8FAFC] py-3 pl-20 pr-4 text-lg font-bold tabular-nums text-[#10264D] placeholder:text-sm placeholder:font-normal placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10"
                      placeholder="Jumlah custom"
                    />
                  </div>
                </div>

                {/* Pesan */}
                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-semibold text-[#10264D]">
                    Pesan (Opsional)
                  </label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#6478A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                    </svg>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={500}
                      rows="4"
                      className="min-h-32 w-full resize-none rounded-xl border border-[#DCE6F3] bg-[#F8FAFC] py-3.5 pl-12 pr-4 text-sm leading-relaxed text-[#10264D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10"
                      placeholder="Tulis pesan dukungan Anda..."
                    />
                    <span className="pointer-events-none absolute bottom-3 right-4 text-[11px] font-semibold tabular-nums text-[#94A3B8]">{formData.message.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Media Share (2/5 width) */}
              {isMediaShareEnabled && (
                <div className="mt-6 lg:mt-0 lg:col-span-2">
                  <div className="flex h-full flex-col rounded-xl border border-[#DCE6F3] bg-[#F8FAFC] p-5 sm:p-6">
                    {/* Header */}
                    <div className="mb-5 flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m10 8 6 4-6 4V8Z" />
                        </svg>
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-[#10264D] sm:text-lg">Media Share <span className="font-medium text-[#67748E]">(Opsional)</span></h2>
                        <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                        Tambahkan video YouTube jika ingin mengirim media share.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col space-y-4">
                      {/* YouTube URL Input */}
                      <div>
                        <label htmlFor="youtubeUrl" className="mb-2 block text-sm font-semibold text-[#10264D]">
                          URL YouTube
                        </label>
                        <div className="relative">
                          <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6478A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15m3.15 5.85a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.14-1.14" />
                          </svg>
                          <input
                            type="url"
                            id="youtubeUrl"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="min-h-12 w-full rounded-xl border border-[#DCE6F3] bg-white py-3 pl-12 pr-4 text-sm text-[#10264D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      </div>

                      {/* Durasi terkunci berdasarkan nominal donasi */}
                      {youtubeUrl && (
                        <div className="rounded-xl border border-[#DCE6F3] bg-white p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm10-12V7a4 4 0 0 0-8 0v2" />
                                </svg>
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0F2A5F]">Durasi otomatis</p>
                                <p className="text-[11px] text-[#64748B]">Dikunci sesuai nominal donasi</p>
                              </div>
                            </div>
                            <span className="rounded-lg bg-[#10264D] px-3 py-1.5 text-sm font-bold text-white tabular-nums">
                              {formData.amount ? formatMediaDuration(mediaDuration) : '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-3">
                        <div className="overflow-hidden rounded-xl border border-[#DCE6F3] bg-[#EFF6FF]">
                          {youtubeVideoId ? (
                            <div className="aspect-video w-full bg-black">
                              <iframe
                                className="h-full w-full"
                                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                                title="Preview video Media Share"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-5 text-center">
                              <span className="flex h-11 w-14 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" /></svg>
                              </span>
                              <p className="text-[11px] font-bold text-[#526987]">Preview video tampil setelah URL YouTube valid.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pembayaran Midtrans, lalu Checkbox dan Button - Full Width */}
            <div className="mt-8 space-y-5 border-t border-[#E2E8F0] pt-7">
              <div>
                <h2 className="mb-4 text-lg font-bold text-[#10264D]">Metode Pembayaran</h2>
                <div className="flex items-center gap-4 rounded-xl border border-[#93C5FD] bg-[#F8FBFF] p-4 sm:p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#EFF6FF]" aria-hidden="true">
                    <span className="h-6 w-1.5 rounded-full bg-[#93C5FD]" />
                    <span className="h-9 w-1.5 rounded-full bg-[#3B82F6]" />
                    <span className="h-7 w-1.5 rounded-full bg-[#2563EB]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#10264D] sm:text-base">Midtrans Sandbox</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#67748E] sm:text-sm">Pilih metode pembayaran di jendela Midtrans.</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-sm" aria-hidden="true">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="m6 12 4 4 8-8" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#2563EB]"
                />
                <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#64748B] sm:text-sm">
                  Saya menyetujui bahwa donasi ini bersifat sukarela dan tidak dapat dikembalikan. Saya telah membaca dan menyetujui{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="font-bold text-[#1D4ED8] underline underline-offset-2 transition hover:text-[#3B82F6]">syarat dan ketentuan</a> Johen Donate.
                </label>
              </div>

              <button
                type="submit"
                disabled={donating || !agreedToTerms}
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-transparent bg-[#2563EB] px-5 py-3.5 text-base font-bold text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition duration-200 hover:bg-[#1D4ED8] hover:shadow-[0_12px_26px_rgba(37,99,235,0.26)] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
              >
                {donating ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                    </svg>
                    <span>Donasi {formatRupiah(formData.amount ? parseInt(formData.amount) : 0)}</span>
                    <svg className="ml-auto h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
