"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import Link from 'next/link';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import ImageCropModal from '@/components/molecules/ImageCropModal';
import PayoutFields from '@/components/molecules/PayoutFields';
import { getStoredUser } from '@/utils/sessionManager';

export const dynamic = 'force-dynamic';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');

  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(() => !getStoredUser());
  const [saving, setSaving] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [cropTarget, setCropTarget] = useState('profile');

  const [formData, setFormData] = useState(() => {
    const storedUser = getStoredUser() || {};

    return {
      displayName: storedUser.displayName || '',
      username: storedUser.username || '',
      email: storedUser.email || '',
      bio: storedUser.bio || '',
      profileImageUrl: storedUser.profileImage || storedUser.profileImageUrl || '',
      coverImageUrl: storedUser.coverImage || storedUser.coverImageUrl || '',
      socialLinks: {
        twitch: storedUser.socialLinks?.twitch || '',
        youtube: storedUser.socialLinks?.youtube || '',
        instagram: storedUser.socialLinks?.instagram || '',
        tiktok: storedUser.socialLinks?.tiktok || '',
        twitter: storedUser.socialLinks?.twitter || ''
      },
      payoutBankName: storedUser.payoutBankName || storedUser.payoutBank || '',
      payoutAccountNumber: storedUser.payoutAccountNumber || '',
      payoutAccountHolder: storedUser.payoutAccountHolder || storedUser.payoutAccountName || ''
    };
  });

  const payoutSectionRef = useRef(null);
  const basicSectionRef = useRef(null);
  const socialSectionRef = useRef(null);

  const payoutLocked = !!(user?.payoutAccountNumber && user?.payoutAccountHolder);

  // Check auth and load user profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.replace('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      loadUserProfile(token, parsed);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // Handle URL section scroll (e.g. ?section=payout or #payout)
  useEffect(() => {
    if (!loading) {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (sectionParam === 'payout' || hash === '#payout') {
        setTimeout(() => {
          payoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }
  }, [loading, sectionParam]);

  const loadUserProfile = async (token, initialUser) => {
    try {
      const res = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedUser = res.data.user || initialUser;
      setUser(fetchedUser);

      setFormData({
        displayName: fetchedUser.displayName || '',
        username: fetchedUser.username || '',
        email: fetchedUser.email || '',
        bio: fetchedUser.bio || '',
        profileImageUrl: fetchedUser.profileImage || fetchedUser.profileImageUrl || '',
        coverImageUrl: fetchedUser.coverImage || fetchedUser.coverImageUrl || '',
        socialLinks: {
          twitch: fetchedUser.socialLinks?.twitch || '',
          youtube: fetchedUser.socialLinks?.youtube || '',
          instagram: fetchedUser.socialLinks?.instagram || '',
          tiktok: fetchedUser.socialLinks?.tiktok || '',
          twitter: fetchedUser.socialLinks?.twitter || ''
        },
        payoutBankName: fetchedUser.payoutBankName || fetchedUser.payoutBank || '',
        payoutAccountNumber: fetchedUser.payoutAccountNumber || '',
        payoutAccountHolder: fetchedUser.payoutAccountHolder || fetchedUser.payoutAccountName || ''
      });
    } catch (error) {
      console.error('Failed to load full profile:', error);
      // Fallback to cached initialUser
      setFormData({
        displayName: initialUser.displayName || '',
        username: initialUser.username || '',
        email: initialUser.email || '',
        bio: initialUser.bio || '',
        profileImageUrl: initialUser.profileImage || initialUser.profileImageUrl || '',
        coverImageUrl: initialUser.coverImage || initialUser.coverImageUrl || '',
        socialLinks: {
          twitch: initialUser.socialLinks?.twitch || '',
          youtube: initialUser.socialLinks?.youtube || '',
          instagram: initialUser.socialLinks?.instagram || '',
          tiktok: initialUser.socialLinks?.tiktok || '',
          twitter: initialUser.socialLinks?.twitter || ''
        },
        payoutBankName: initialUser.payoutBankName || initialUser.payoutBank || '',
        payoutAccountNumber: initialUser.payoutAccountNumber || '',
        payoutAccountHolder: initialUser.payoutAccountHolder || initialUser.payoutAccountName || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = (e, target = 'profile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const maximumSize = target === 'cover' ? 5 : 2;
    if (file.size > maximumSize * 1024 * 1024) {
      toast.error(`Ukuran gambar maksimal ${maximumSize}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropTarget(target);
      setTempImageSrc(reader.result);
      setShowCropModal(true);
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage) => {
    const isCover = cropTarget === 'cover';
    const imageField = isCover ? 'coverImageUrl' : 'profileImageUrl';
    const uploadEndpoint = isCover ? '/api/user/upload-cover-image' : '/api/user/upload-image';
    const originalImage = formData[imageField];
    setFormData(prev => ({ ...prev, [imageField]: croppedImage }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageData: croppedImage }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengunggah foto');
      }

      const imageUrlWithCache = `${data.imageUrl}?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, [imageField]: imageUrlWithCache }));

      // Update cached user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = isCover
        ? { ...currentUser, coverImage: imageUrlWithCache, coverImageUrl: imageUrlWithCache }
        : { ...currentUser, profileImage: imageUrlWithCache, profileImageUrl: imageUrlWithCache };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success(isCover ? 'Foto sampul berhasil diperbarui!' : 'Foto profil berhasil diperbarui!');
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error(uploadError.message || 'Gagal mengunggah foto');
      setFormData(prev => ({ ...prev, [imageField]: originalImage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName?.trim() || !formData.username?.trim()) {
      toast.error('Nama tampilan dan username wajib diisi!');
      return;
    }

    if (!/^[-_a-zA-Z0-9]+$/.test(formData.username)) {
      toast.error('Username hanya boleh berisi huruf, angka, underscore, dan dash!');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let profileUpdate = {
        displayName: formData.displayName.trim(),
        username: formData.username.trim().toLowerCase(),
        bio: formData.bio || '',
        profileImageUrl: formData.profileImageUrl,
        socialLinks: formData.socialLinks
      };

      if (!payoutLocked) {
        profileUpdate = {
          ...profileUpdate,
          payoutBankName: formData.payoutBankName || '',
          payoutAccountNumber: formData.payoutAccountNumber || '',
          payoutAccountHolder: formData.payoutAccountHolder || ''
        };
      }

      const response = await axios.put('/api/user/profile', profileUpdate, config);
      toast.success('Profil berhasil disimpan!');

      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <CreatorAppLayout user={user}>
      {/* Header Halaman */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-100">
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <span>/</span>
          <span className="font-semibold text-white">Profil & Akun</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pengaturan Profil</h1>
        <p className="mt-0.5 text-sm font-medium text-blue-100">
          Kelola informasi kreator, halaman donasi publik, dan data rekening pencairan saweran.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Card: Avatar & Overview */}
        <div className="jd-surface p-6 sm:p-7">
          <div className="mb-7">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#0F2A5F]">Foto Sampul Halaman Donasi</h3>
                <p className="mt-0.5 text-xs font-medium text-[#526987]">Tampil sebagai bagian paling atas halaman donasi publik. JPG, PNG, atau WebP maks. 5MB.</p>
              </div>
              <span className="hidden text-[11px] font-bold text-[#607697] sm:block">Rasio 16:5</span>
            </div>

            <div className="group relative aspect-[16/5] w-full rounded-2xl border-2 border-dashed border-[#BFDBFE] bg-[#EFF6FF]">
              {formData.coverImageUrl ? (
                <img src={formData.coverImageUrl} alt="Sampul halaman donasi" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-[#607697]">
                  <svg className="h-7 w-7 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m3 16 5-5 4 4 3-3 6 6M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Zm10-12h.01" />
                  </svg>
                  <span className="text-xs font-bold">Belum ada foto sampul</span>
                </div>
              )}

              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-[#0F2A5F]/0 transition group-hover:bg-[#0F2A5F]/35">
                <span className="translate-y-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#0F2A5F] opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                  {formData.coverImageUrl ? 'Ganti Foto Sampul' : 'Pilih Foto Sampul'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageFileSelect(event, 'cover')}
                />
              </label>
              <div className="absolute bottom-0 left-1/2 z-10 h-24 w-24 -translate-x-1/2 translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_12px_28px_rgba(15,42,95,0.28)] sm:h-28 sm:w-28">
                <img
                  src={formData.profileImageUrl || '/default-avatar.png'}
                  alt="Foto profil"
                  className="h-full w-full object-cover"
                  onError={(event) => { event.currentTarget.src = '/default-avatar.png'; }}
                />
                <label
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#0F2A5F] text-white shadow-md transition hover:bg-[#1D4ED8] sm:h-9 sm:w-9"
                  title="Ganti foto profil"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileSelect}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-14 text-center sm:pt-16">
            <div className="hidden">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border border-[#dce4ec] bg-[#DBEAFE] shadow-[0_12px_30px_rgba(15,42,95,0.12)]">
                <img
                  src={formData.profileImageUrl || '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              </div>
              <label
                className="absolute bottom-0 right-0 bg-[#0F2A5F] hover:bg-black text-[#f7fcff] rounded-full p-2.5 cursor-pointer border-2 border-[#0F2A5F] shadow-[2px_2px_0px_#2563EB] hover:scale-105 active:scale-95 transition"
                title="Ganti foto profil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileSelect}
                />
              </label>
            </div>

            <div className="w-full max-w-xl text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="max-w-[15rem] truncate text-xl font-black tracking-tight text-[#0F2A5F] sm:text-2xl">
                    {formData.displayName || 'Nama Kreator'}
                  </h3>
                  <img src="/icons/secure.gif" alt="Akun aman" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" />
                </div>
                <p className="font-mono text-sm font-bold text-[#607697]">@{formData.username || 'username'}</p>

                {formData.username && (
                  <a
                    href={`/donate/${formData.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[#0F2A5F] bg-[#f7fcff] text-[#0F2A5F] text-xs font-extrabold shadow-[2px_2px_0px_#0F2A5F] hover:bg-[#DBEAFE] transition active:translate-y-0.5"
                  >
                    <span>Lihat Halaman Donasi</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              <p className="mt-3 text-xs text-[#526987] font-medium max-w-xl">
                Format foto JPG, PNG, atau WebP maks. 2MB. Foto profil akan tampil pada kartu donasi dan widget overlay penonton siaranmu.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Informasi Dasar */}
        <div ref={basicSectionRef} className="jd-surface p-6 sm:p-7 space-y-4">
          <div className="border-b-2 border-[#0F2A5F]/10 pb-3">
            <h3 className="font-black text-base text-[#0F2A5F]">Informasi Dasar</h3>
            <p className="text-xs font-medium text-[#526987] mt-0.5">
              Identitas publik yang akan ditampilkan kepada para pendukung karya atau penontonmu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                Nama Tampilan (Display Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Contoh: Gus Creator"
                className="w-full px-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-bold text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                Username / Handle Donasi <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono text-sm font-bold text-[#607697]">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={payoutLocked ? undefined : (e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  disabled={payoutLocked}
                  placeholder="namamu"
                  className={`w-full pl-8 pr-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-mono font-bold text-[#0F2A5F] placeholder:text-[#607697] outline-none transition ${
                    payoutLocked ? 'bg-[#DBEAFE] cursor-not-allowed opacity-80' : 'focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F]'
                  }`}
                  required
                />
              </div>
              {payoutLocked ? (
                <p className="mt-1 text-[11px] font-bold text-[#607697]">
                  🔒 Username dikunci otomatis demi konsistensi rekening pencairan dana.
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-medium text-[#526987]">
                  Tautan donasi publik: <span className="font-mono font-bold text-[#0F2A5F]">localhost:3000/donate/{formData.username || 'namamu'}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
              Email Akun
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 bg-[#DBEAFE] border-2 border-[#0F2A5F] rounded-xl text-sm font-bold text-[#526987] cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] font-medium text-[#607697]">
              Email login utama terikat akun dan tidak dapat diubah secara langsung.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F]">
                Bio / Pesan Kreator
              </label>
              <span className="text-[11px] font-mono font-bold text-[#607697]">
                {(formData.bio || '').length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Ceritakan tentang karya, jadwal live streaming, atau tujuan donasimu..."
              className="w-full px-4 py-3 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] resize-none transition"
            />
          </div>
        </div>

        {/* Section 2: Media Sosial */}
        <div ref={socialSectionRef} className="jd-surface p-6 sm:p-7 space-y-4">
          <div className="border-b-2 border-[#0F2A5F]/10 pb-3">
            <h3 className="font-black text-base text-[#0F2A5F]">Tautan Media Sosial</h3>
            <p className="text-xs font-medium text-[#526987] mt-0.5">
              Ikon media sosial ini akan otomatis terpasang pada halaman donasi publikmu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                YouTube Channel
              </label>
              <input
                type="url"
                value={formData.socialLinks?.youtube || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                })}
                placeholder="https://youtube.com/@channelmu"
                className="w-full px-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                Instagram
              </label>
              <input
                type="url"
                value={formData.socialLinks?.instagram || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                TikTok
              </label>
              <input
                type="url"
                value={formData.socialLinks?.tiktok || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                })}
                placeholder="https://tiktok.com/@username"
                className="w-full px-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-[#0F2A5F] mb-1.5">
                Twitch Stream
              </label>
              <input
                type="url"
                value={formData.socialLinks?.twitch || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitch: e.target.value }
                })}
                placeholder="https://twitch.tv/username"
                className="w-full px-4 py-2.5 bg-[#f7fcff] border-2 border-[#0F2A5F] rounded-xl text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white focus:shadow-[2px_2px_0px_#0F2A5F] transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Rekening Pencairan */}
        <div ref={payoutSectionRef} className="jd-surface p-6 sm:p-7 space-y-4">
          <div className="border-b-2 border-[#0F2A5F]/10 pb-3">
            <h3 className="font-black text-base text-[#0F2A5F]">Rekening Pencairan Dana (Payout)</h3>
            <p className="text-xs font-medium text-[#526987] mt-0.5">
              Data rekening bank atau e-wallet tujuan saat kamu melakukan penarikan saldo saweran.
            </p>
          </div>

          {payoutLocked ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h5 className="font-black text-sm text-emerald-950">Rekening Sudah Terverifikasi & Terkunci</h5>
                <p className="text-xs font-medium text-emerald-900 mt-0.5">
                  Demi keamanan saldo donasimu, data rekening yang telah tersimpan tidak dapat diubah secara bebas. Hubungi tim dukungan apabila ada kesalahan penulisan.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h5 className="font-black text-sm text-amber-950">Perhatian Sebelum Mengisi</h5>
                <p className="text-xs font-medium text-amber-900 mt-0.5">
                  Pastikan nama pemilik rekening sama persis dengan nama pada akun perbankan/e-wallet milikmu untuk kelancaran verifikasi pencairan dana.
                </p>
              </div>
            </div>
          )}

          <PayoutFields formData={formData} onChange={setFormData} locked={payoutLocked} />
        </div>

        {/* Action Buttons Bar */}
        <div className="jd-surface p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-[#526987] text-center sm:text-left">
            Pastikan seluruh data sudah benar sebelum menyimpan perubahan.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border-2 border-[#0F2A5F] bg-[#f7fcff] text-[#0F2A5F] text-xs font-extrabold shadow-[2px_2px_0px_#0F2A5F] hover:bg-[#DBEAFE] transition text-center active:translate-y-0.5"
            >
              Kembali
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] text-[#0F2A5F] text-xs font-black shadow-[3px_3px_0px_#0F2A5F] hover:bg-[#3B82F6] transition cursor-pointer active:translate-y-0.5 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </div>
      </form>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setTempImageSrc(null);
        }}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        title={cropTarget === 'cover' ? 'Sesuaikan Foto Sampul' : 'Sesuaikan Foto Profil'}
        aspect={cropTarget === 'cover' ? 16 / 5 : 1}
        cropShape={cropTarget === 'cover' ? 'rect' : 'round'}
        outputWidth={cropTarget === 'cover' ? 1280 : 512}
        outputHeight={cropTarget === 'cover' ? 400 : 512}
      />
    </CreatorAppLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}
