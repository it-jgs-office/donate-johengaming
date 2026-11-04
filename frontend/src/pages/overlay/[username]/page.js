'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import MessageFilterSettings from '@/components/organisms/MessageFilterSettings';
import NotificationAlertSettings from '@/components/organisms/NotificationAlertSettings';
import MediaShareSettings from '@/components/organisms/MediaShareSettings';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import Link from 'next/link';
import { getStoredUser, validateStoredSession } from '@/utils/sessionManager';

export default function OverlayIndexPage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username;
  const [copiedKey, setCopiedKey] = useState(null);
  const [user, setUser] = useState(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredUser()));
  const [isLoading, setIsLoading] = useState(() => !getStoredUser());
  const [activeWidgetSettings, setActiveWidgetSettings] = useState('notifications');
  const qrCodeRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      try {
        const session = await validateStoredSession();

        if (!isActive) return;

        if (!session.valid) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Silakan login terlebih dahulu');
          router.replace('/login');
          return;
        }

        localStorage.setItem('user', JSON.stringify(session.user));
        setUser(session.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Gagal memvalidasi sesi overlay:', error);
        toast.error('Backend tidak dapat dihubungi');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!username || isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const handleCopy = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        toast.success('Tautan disalin!');
        setTimeout(() => setCopiedKey(null), 2000);
      });
    }
  };

  const overlayLinks = [
    {
      key: 'notifications',
      title: 'Notifikasi Saweran',
      description: 'Popup animasi & bunyi saat ada saweran masuk.',
      size: '800 x 600 px',
      url: `${baseUrl}/overlay/${username}/notifications`
    },
    {
      key: 'mediashare',
      title: 'Media Share (YouTube)',
      description: 'Tampilkan video kiriman donatur secara otomatis.',
      size: '1920 x 1080 px',
      url: `${baseUrl}/overlay/${username}/mediashare`
    },
    {
      key: 'leaderboard',
      title: 'Leaderboard',
      description: 'Daftar donatur tertinggi bulan ini.',
      size: '400 x 600 px',
      url: `${baseUrl}/overlay/${username}/leaderboard`
    }
  ];

  const donateUrl = `${baseUrl}/donate/${username}`;

  const downloadQrCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (!canvas) {
      toast.error('QR Code belum siap');
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.download = `johen-donate-${username}.png`;
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.click();
    toast.success('QR Code berhasil diunduh');
  };

  return (
    <CreatorAppLayout user={user}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-100">
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
            <span>/</span>
            <span className="font-semibold text-white">Overlay & OBS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Widget & Sensor Pesan</h1>
          <p className="mt-0.5 text-sm font-medium text-blue-100">Salin tautan browser source untuk OBS dan kelola sensor kata.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            const testNotification = {
              donorName: 'Donatur Johen',
              amountLabel: 'Rp 50.000',
              message: 'Tes Notifikasi Johen Donate',
              detail: 'Semangat terus live-nya!',
              speechText: 'Lima puluh ribu dari Donatur Johen. Pesan: semangat terus live-nya!',
              time: new Date().toLocaleTimeString('id-ID'),
              timestamp: Date.now()
            };
            localStorage.setItem('overlay-notification-trigger', JSON.stringify(testNotification));
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'overlay-notification-trigger',
              newValue: JSON.stringify(testNotification)
            }));
            toast.success('Notifikasi tes dikirim!');
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#0F2A5F] bg-[#0F2A5F] text-white text-xs font-extrabold shadow-[2px_2px_0px_#2563EB] hover:bg-black transition cursor-pointer shrink-0 active:translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Uji Overlay
        </button>
      </div>

      {/* How-to Tip */}
      <div className="rounded-xl border-2 border-[#0F2A5F] bg-[#DBEAFE] px-4 py-3 text-xs font-medium text-[#0F2A5F] shadow-[3px_3px_0px_#0F2A5F]">
        <span className="font-black text-[#0F2A5F]">Cara pasang:</span> OBS Studio &rarr; Sources &rarr; tambah Browser &rarr; paste URL widget di bawah.
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Widget Links */}
        <div className="lg:col-span-7 space-y-4">
          {overlayLinks.map((link) => (
            <div key={link.key} className="rounded-2xl bg-[#ffffff] border-2 border-[#0F2A5F] shadow-[4px_4px_0px_#0F2A5F] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#0F2A5F]">{link.title}</h3>
                    {link.size && (
                      <span className="text-[10px] font-extrabold text-[#0F2A5F] bg-[#f7fcff] border border-[#0F2A5F] px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#0F2A5F]">
                        {link.size}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#526987] mt-1">{link.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border-2 border-[#0F2A5F] bg-[#ffffff] text-[#0F2A5F] shadow-[2px_2px_0px_#0F2A5F] hover:bg-[#DBEAFE] transition active:translate-y-0.5"
                  >
                    Buka
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(link.url, link.key)}
                    className="px-4 py-1.5 text-xs font-extrabold rounded-xl border-2 border-[#0F2A5F] bg-[#0F2A5F] text-white shadow-[2px_2px_0px_#2563EB] hover:bg-black transition cursor-pointer active:translate-y-0.5"
                  >
                    {copiedKey === link.key ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              {/* URL Display */}
              <div className="mt-3 px-3.5 py-2 rounded-xl border-2 border-[#0F2A5F] bg-[#f7fcff] font-mono text-xs font-bold text-[#0F2A5F] select-all truncate">
                {link.url}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-5">
          <section className="flex flex-col items-center rounded-2xl border-2 border-[#0F2A5F] bg-[#ffffff] p-5 text-center shadow-[4px_4px_0px_#0F2A5F] sm:p-6">
            <div className="mb-4 flex max-w-sm flex-col items-center">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#607697]">QR Code Donasi</p>
            </div>

            <div className="flex aspect-square w-full max-w-[292px] items-center justify-center rounded-2xl border-2 border-[#0F2A5F] bg-[#f7fcff] p-4 shadow-inner">
              <div ref={qrCodeRef} className="flex aspect-square w-full items-center justify-center rounded-xl bg-white p-3 shadow-[2px_2px_0px_#0F2A5F]">
                <QRCodeCanvas
                  value={donateUrl}
                  size={512}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#0F2A5F"
                  imageSettings={{
                    src: '/logo-blue.png',
                    height: 72,
                    width: 72,
                    excavate: true,
                  }}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  aria-label={`QR Code donasi untuk ${username}`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={downloadQrCode}
              className="mt-4 flex min-h-11 w-full max-w-[292px] items-center justify-center gap-2 rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] px-4 py-2.5 text-sm font-extrabold text-white shadow-[3px_3px_0px_#0F2A5F] transition hover:bg-[#3B82F6] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/35 active:translate-y-0.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
              </svg>
              Download QR PNG
            </button>
          </section>
        </div>

        <div className="lg:col-span-12">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-[#0F2A5F] bg-white p-3 shadow-[4px_4px_0px_#0F2A5F] sm:flex-row sm:items-center sm:justify-between">
            <div className="px-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#607697]">Pengaturan widget</p>
              <p className="mt-1 text-sm font-black text-[#0F2A5F]">Pilih widget yang ingin diatur</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#EFF6FF] p-1.5">
              <button
                type="button"
                onClick={() => setActiveWidgetSettings('notifications')}
                className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${activeWidgetSettings === 'notifications' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#526987] hover:bg-white'}`}
              >
                Notifikasi Saweran
              </button>
              <button
                type="button"
                onClick={() => setActiveWidgetSettings('mediashare')}
                className={`rounded-lg px-4 py-2 text-xs font-extrabold transition ${activeWidgetSettings === 'mediashare' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#526987] hover:bg-white'}`}
              >
                Media Share
              </button>
            </div>
          </div>

          {activeWidgetSettings === 'notifications' ? (
            <div className="space-y-5">
              <NotificationAlertSettings username={username} />
              <MessageFilterSettings />
            </div>
          ) : (
            <section className="rounded-2xl border-2 border-[#0F2A5F] bg-white p-5 shadow-[4px_4px_0px_#0F2A5F] sm:p-6">
              <div className="mb-5 flex flex-col gap-3 border-b-2 border-[#0F2A5F]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#607697]">Media Share YouTube</p>
                  <h3 className="mt-1 text-lg font-black text-[#0F2A5F]">Durasi otomatis berdasarkan donasi</h3>
                  <p className="mt-1 text-xs font-medium text-[#526987]">Durasi dikunci oleh sistem sesuai nominal dan video diputar otomatis di OBS.</p>
                </div>
                <a
                  href={`${baseUrl}/overlay/${username}/mediashare`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] px-4 py-2 text-xs font-extrabold text-white shadow-[2px_2px_0px_#0F2A5F]"
                >
                  Buka Media Share
                </a>
              </div>

              <MediaShareSettings username={username} />

              <p className="mt-4 rounded-xl bg-[#EFF6FF] px-4 py-3 text-xs font-semibold text-[#526987]">
                Hanya video YouTube publik. Video privat atau tidak tersedia otomatis dilewati.
              </p>
            </section>
          )}
        </div>
      </div>
    </CreatorAppLayout>
  );
}
