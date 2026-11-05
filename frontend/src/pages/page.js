'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SITE_DISPLAY_URL } from '@/lib/site';

const HERO_SUPPORT_PHRASES = [
  'Biar mereka dukung.',
  'Biar mereka support.',
  'Biar mereka terhibur.',
];

const DONATION_PREVIEWS = [
  { name: 'Raka', amount: 'Rp 50.000', message: 'Semangat terus live-nya!' },
  { name: 'Nadia', amount: 'Rp 25.000', message: 'Kontennya selalu seru.' },
  { name: 'Bima', amount: 'Rp 100.000', message: 'Lanjutkan karya kerenmu!' },
];

const PAYMENT_METHODS = [
  { src: '/payment/alfamanrt.webp', name: 'Alfamart' },
  { src: '/payment/Logo_Indomaret.webp', name: 'Indomaret' },
  { src: '/payment/bca.webp', name: 'BCA' },
  { src: '/payment/bni.webp', name: 'BNI' },
  { src: '/payment/bri.webp', name: 'BRI' },
  { src: '/payment/mandiri.webp', name: 'Mandiri' },
  { src: '/payment/permata-bank.webp', name: 'Permata Bank' },
  { src: '/payment/cimb.webp', name: 'CIMB Niaga' },
  { src: '/payment/dana.webp', name: 'DANA' },
  { src: '/payment/gopay.webp', name: 'GoPay' },
  { src: '/payment/ovo.webp', name: 'OVO' },
  { src: '/payment/shopepay.png', name: 'ShopeePay' },
  { src: '/payment/LinkAja.webp', name: 'LinkAja' },
  { src: '/payment/qris.webp', name: 'QRIS' },
];

export default function Home() {
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  const [heroSupportText, setHeroSupportText] = useState('');
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);
  const [donationPreviewIndex, setDonationPreviewIndex] = useState(0);
  const heroPatternRef = useRef(null);
  const landingPageRef = useRef(null);
  const donationPreview = DONATION_PREVIEWS[donationPreviewIndex];

  const handleHeroPointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;

    heroPatternRef.current?.style.setProperty('--hero-pointer-x', `${x}px`);
    heroPatternRef.current?.style.setProperty('--hero-pointer-y', `${y}px`);
  };

  const resetHeroPointer = () => {
    heroPatternRef.current?.style.setProperty('--hero-pointer-x', '0px');
    heroPatternRef.current?.style.setProperty('--hero-pointer-y', '0px');
  };

  // Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        JSON.parse(userData);
        router.replace('/dashboard');
        return;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    let cancelled = false;

    async function loadCreators() {
      try {
        const response = await fetch('/api/creators/list');
        const data = await response.json();
        if (!cancelled && data.success && Array.isArray(data.creators)) {
          setCreators(data.creators);
        }
      } catch (error) {
        console.error('Gagal memuat daftar kreator:', error);
      }
    }

    loadCreators();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const currentPhrase = HERO_SUPPORT_PHRASES[heroPhraseIndex];
    const isPhraseComplete = heroSupportText === currentPhrase;
    const delay = isDeletingHeroText ? 45 : isPhraseComplete ? 1600 : 85;

    const timer = setTimeout(() => {
      if (isDeletingHeroText) {
        if (heroSupportText === '') {
          setIsDeletingHeroText(false);
          setHeroPhraseIndex((current) => (current + 1) % HERO_SUPPORT_PHRASES.length);
          return;
        }

        setHeroSupportText((current) => current.slice(0, -1));
        return;
      }

      if (isPhraseComplete) {
        setIsDeletingHeroText(true);
        return;
      }

      setHeroSupportText(currentPhrase.slice(0, heroSupportText.length + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [heroPhraseIndex, heroSupportText, isDeletingHeroText]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDonationPreviewIndex((current) => (current + 1) % DONATION_PREVIEWS.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = landingPageRef.current?.querySelectorAll('.landing-scroll-section') ?? [];

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -8%' },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean) {
      router.push(`/creator/register?username=${encodeURIComponent(clean)}`);
    } else {
      router.push('/creator/register');
    }
  };

  // Multiply creators list to guarantee a smooth, seamless infinite marquee
  const marqueeCreators = creators.length > 0 ? [...creators, ...creators, ...creators] : [];

  return (
    <main ref={landingPageRef} className="jd-app-shell overflow-x-hidden font-sans text-[#10264D] antialiased selection:bg-[#BFDBFE] selection:text-[#10264D]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E1E7EF] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-8 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 transition hover:opacity-90 sm:gap-2.5">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
            <span className="truncate text-sm font-bold tracking-tight text-[#10264D] sm:text-lg">Johen Donate</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#607697] md:flex">
            <a href="#cara-kerja" className="transition hover:text-[#1D4ED8]">Cara kerja</a>
            <a href="#fitur" className="transition hover:text-[#1D4ED8]">Fitur</a>
            <a href="#biaya" className="transition hover:text-[#1D4ED8]">Biaya</a>
            <a href="#faq" className="transition hover:text-[#1D4ED8]">FAQ</a>
          </nav>

          <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={handleLoginClick}
              className="rounded-xl px-2.5 py-2 text-xs font-semibold text-[#334E73] transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8] sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Masuk
            </button>
            <Link
              href="/creator/register"
              className="jd-btn-primary inline-flex min-h-10 items-center px-3 py-2 text-xs font-semibold sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
        <section
          className="landing-scroll-section reveal-scale relative overflow-hidden bg-[#2D64E8] py-10 sm:py-20 md:py-24"
          onMouseMove={handleHeroPointerMove}
          onMouseLeave={resetHeroPointer}
        >
        <div
          aria-hidden="true"
            ref={heroPatternRef}
            className="hero-pattern-drift pointer-events-none absolute left-1/2 top-1/2 z-0 opacity-80"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/2 z-[1] h-36 w-[120%] -translate-x-1/2 rounded-[50%] bg-[#F5F8FC]" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 sm:gap-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          {/* Kolom Kiri: Headline & Input Klaim */}
          <div>
            <h1 className="text-3xl font-bold leading-[1.15] tracking-[-0.035em] text-[#10264D] sm:text-5xl lg:text-[3.6rem] lg:leading-[1.08]">
              Bikin karya. <br />
              <span className="block min-h-[1.25em] text-white sm:min-h-0">
                {heroSupportText}<span aria-hidden="true" className="ml-1 inline-block h-[0.9em] w-0.5 animate-pulse bg-white align-[-0.08em]" />
              </span>
            </h1>

            <p className="mt-2 max-w-lg text-sm font-normal leading-6 text-white/90 sm:mt-6 sm:text-lg sm:leading-7">
              Satu tautan praktis untuk menerima saweran dan apresiasi langsung dari penikmat karya atau siaranmu.
            </p>

            {/* Input Klaim Username (The Hook) */}
            <form
              onSubmit={handleClaimSubmit}
              className="mt-6 flex max-w-lg flex-col gap-2 rounded-2xl border border-[#D9E2EB] bg-white p-2 shadow-[0_12px_32px_rgba(15,42,95,0.08)] sm:mt-8 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center px-2 py-2 text-[11px] sm:px-3 sm:text-sm">
                <span className="shrink-0 font-medium text-[#64748B]">{SITE_DISPLAY_URL}/donate/</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="namamu"
                  maxLength={30}
                  className="min-w-0 w-full bg-transparent font-semibold text-[#10264D] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                  aria-label="Nama pengguna"
                />
              </div>
              <button
                type="submit"
                className="jd-btn-primary w-full shrink-0 px-5 py-2.5 text-sm font-semibold sm:w-auto"
              >
                Buat Halaman
              </button>
            </form>

            {/* Micro Points */}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-white/90 sm:mt-5 sm:gap-x-5 sm:text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Gratis digunakan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Pembayaran instan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" /> Langsung siap pakai
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Preview Fitur Johen Donate */}
          <div className="relative mx-auto h-[260px] w-full max-w-[390px] sm:h-[380px] sm:max-w-[500px]">
            <img
              src="/assets/card-profil.png"
              alt="Contoh halaman profil kreator"
              className="hero-card-bubble hero-card-bubble-one absolute left-[12%] top-0 z-0 w-[50%] cursor-pointer rounded-xl shadow-[0_14px_32px_rgba(15,42,95,0.16)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] sm:left-[16%] sm:w-[47%]"
            />
            <img
              src="/assets/card-gif.png"
              alt="Contoh alert donasi"
              className="hero-card-bubble hero-card-bubble-three absolute left-[56%] top-[44%] z-20 w-[42%] cursor-pointer rounded-xl shadow-[0_14px_32px_rgba(15,42,95,0.16)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] sm:left-[63%] sm:w-[43%]"
            />
            <img
              src="/assets/card-db.png"
              alt="Dashboard Johen Donate"
              className="hero-card-bubble hero-card-bubble-two absolute bottom-0 left-[2%] z-20 w-[62%] cursor-pointer rounded-xl shadow-[0_14px_32px_rgba(15,42,95,0.14)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] sm:-bottom-2 sm:left-[3%] sm:w-[60%]"
            />
            <div className="absolute bottom-0 left-1/2 z-10 w-[50%] -translate-x-1/2 sm:w-[47%]">
              <img
                src="/assets/karakter1.png"
                alt="Karakter Johen Donate"
                className="hero-character-bubble w-full cursor-pointer drop-shadow-[0_14px_18px_rgba(15,42,95,0.2)] transition-transform duration-300 ease-out hover:-translate-y-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="landing-scroll-section reveal-from-left scroll-mt-20 bg-[#F5F8FC] py-12 sm:scroll-mt-24 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Cara kerja</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">
              Mulai menerima dukungan dalam tiga langkah
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#64748B] sm:text-base">
              Buat halaman kreator, bagikan tautan donasi, lalu kelola semua dukungan dari satu dashboard.
            </p>
          </div>

          <div className="mt-8 grid items-center gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div style={{ '--reveal-delay': '180ms' }} className="landing-card-reveal relative mx-auto w-full max-w-md">
              <img src="/assets/live.png" alt="Ilustrasi live streaming" className="h-auto w-full" />
              <div key={donationPreviewIndex} aria-hidden="true" className="donation-preview-toast absolute top-4 z-10 flex max-w-[82%] items-center gap-2 rounded-xl border border-[#DCE5F0] bg-white px-2.5 py-2 shadow-[0_10px_24px_rgba(15,42,95,0.16)] sm:top-10 sm:gap-2.5 sm:px-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[10px] font-bold text-[#2563EB]">Rp</span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-medium text-[#64748B]">{donationPreview.name} baru donate</span>
                  <span className="block text-xs font-semibold text-[#10264D]">{donationPreview.amount}</span>
                  <span className="mt-0.5 block max-w-[180px] truncate text-[10px] text-[#64748B]">“{donationPreview.message}”</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['01', 'Buat halaman kreator', 'Daftar dan tentukan username untuk mendapatkan tautan donasi pribadi.'],
                ['02', 'Bagikan tautan donasi', 'Letakkan tautan di bio, deskripsi konten, atau bagikan saat live streaming.'],
                ['03', 'Terima dan tarik saldo', 'Pantau donasi secara realtime dan tarik saldo ke rekening yang terdaftar.'],
              ].map(([number, title, description], index) => (
                <article key={number} style={{ '--reveal-delay': `${440 + index * 180}ms` }} className="landing-card-reveal flex gap-3 rounded-2xl border border-[#E1E7EF] bg-white p-4 shadow-[0_8px_20px_rgba(15,42,95,0.05)] sm:gap-4 sm:p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-sm font-semibold text-[#1D4ED8]">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-[#10264D] sm:text-lg">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#64748B]">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-scroll-section reveal-fade border-y border-[#E1E7EF] bg-white py-8 sm:py-10" aria-label="Metode pembayaran">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8CA5]">Metode pembayaran tersedia</p>
        <div className="carousel-wrapper [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="payment-marquee gap-8 px-4 sm:gap-12">
            {[...PAYMENT_METHODS, ...PAYMENT_METHODS].map((method, index) => (
              <div key={`${method.name}-${index}`} className="flex h-9 w-20 shrink-0 items-center justify-center sm:h-11 sm:w-24" aria-hidden={index >= PAYMENT_METHODS.length}>
                <img src={method.src} alt={index < PAYMENT_METHODS.length ? method.name : ''} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur Utama */}
      <section id="fitur" className="landing-scroll-section reveal-from-right scroll-mt-20 border-y border-[#E1E7EF] bg-white py-12 sm:scroll-mt-24 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Untuk kreator</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">
              Dari halaman donasi sampai overlay, semuanya terhubung
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#64748B] sm:text-base">
              Kelola dukungan, tampilkan interaksi saat live, dan bangun identitas kreatormu dari satu tempat.
            </p>
          </div>

          <div className="mt-8 grid gap-7 sm:mt-12 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <img
              src="/assets/Untuk-live-streaming.png"
              alt="Fitur untuk live streaming"
              className="h-auto w-full rounded-2xl shadow-[0_18px_44px_rgba(15,42,95,0.12)] sm:rounded-3xl"
            />

            <div>
              <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Untuk live streaming</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Interaksi masuk tanpa perlu refresh</h3>
              <p className="mt-4 text-sm leading-7 text-[#64748B] sm:text-base">
                Donasi yang berhasil langsung dikirim ke overlay OBS. Tampilkan alert, putar media share, dan perbarui leaderboard secara realtime.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#526987]">
                {['Notifikasi realtime melalui Pusher', 'Alert dan tampilan overlay dapat disesuaikan', 'Media share dengan durasi otomatis'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[11px] font-bold text-[#1D4ED8]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-7 sm:mt-16 sm:gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-2 lg:order-1">
              <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Untuk halaman kreator</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Halaman donasi yang terasa milikmu</h3>
              <p className="mt-4 text-sm leading-7 text-[#64748B] sm:text-base">
                Gunakan foto sampul, profil, tautan sosial, serta media share untuk memberi pengalaman donasi yang sederhana dan konsisten dengan identitasmu.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#526987]">
                {['Tautan donasi pribadi yang mudah dibagikan', 'Nama pendukung tersimpan di browser', 'Pembayaran aman melalui Midtrans'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[11px] font-bold text-[#1D4ED8]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <img
              src="/assets/Untuk-halaman-kreator.png"
              alt="Fitur untuk halaman kreator"
              className="order-1 h-auto w-full rounded-2xl shadow-[0_18px_44px_rgba(15,42,95,0.12)] sm:rounded-3xl lg:order-2"
            />
          </div>
        </div>
      </section>

      {/* Biaya */}
      <section id="biaya" className="landing-scroll-section reveal-scale scroll-mt-20 bg-[#2D64E8] pb-8 pt-12 sm:scroll-mt-24 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:gap-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#BFDBFE]">Biaya transparan</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Potongan jelas, penarikan tanpa biaya admin
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
              Setiap transaksi donasi yang berhasil dikenakan biaya layanan sebesar <strong className="font-semibold text-white">5%</strong>. Saat saldo ditarik ke rekening terdaftar, Johen Donate tidak mengenakan biaya admin penarikan.
            </p>

            <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#DCE5F0] bg-white">
              <div className="flex min-w-0 flex-col justify-between gap-3 border-r border-[#E8EDF3] px-3 py-4 sm:px-6 sm:py-5">
                <div>
                  <p className="text-xs font-semibold text-[#10264D] sm:text-sm">Biaya layanan transaksi</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#64748B] sm:text-xs sm:leading-5">Dipotong otomatis dari donasi yang berhasil.</p>
                </div>
                <p className="text-xl font-semibold tracking-tight text-[#1D4ED8] sm:text-2xl">5%</p>
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-3 px-3 py-4 sm:px-6 sm:py-5">
                <div>
                  <p className="text-xs font-semibold text-[#10264D] sm:text-sm">Biaya admin penarikan</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#64748B] sm:text-xs sm:leading-5">Tidak ada potongan tambahan saat withdraw.</p>
                </div>
                <p className="text-xl font-semibold tracking-tight text-[#1D4ED8] sm:text-2xl">Rp 0</p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#DCE5F0] bg-white p-4 shadow-[0_12px_28px_rgba(15,42,95,0.07)] sm:p-7">
            <div className="border-b border-[#E8EDF3] pb-5">
              <div>
                <p className="text-sm font-semibold text-[#10264D]">Contoh transaksi</p>
                <p className="mt-1 text-xs text-[#7A8CA5]">Dari donasi sebesar Rp 100.000</p>
              </div>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 text-[#526987]">
                <dt>Nominal donasi</dt>
                <dd className="font-semibold text-[#10264D]">Rp 100.000</dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-[#526987]">
                <dt>Biaya layanan 5%</dt>
                <dd className="font-semibold text-[#10264D]">- Rp 5.000</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-dashed border-[#D9E2EB] pt-4">
                <dt className="font-semibold text-[#10264D]">Saldo kreator</dt>
                <dd className="text-lg font-semibold text-[#1D4ED8]">Rp 95.000</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[#EFF6FF] px-4 py-3 text-[#526987]">
                <dt>Biaya saat ditarik</dt>
                <dd className="font-semibold text-[#1D4ED8]">Rp 0</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Auto-scrolling Marquee Kreator (Dengan margin kontainer sejajar) */}
      {creators.length > 0 && (
        <section className="landing-scroll-section reveal-from-left border-b border-[#E1E7EF] bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-6xl overflow-hidden px-4 sm:px-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight text-[#10264D]">Kreator di Johen Donate</h2>
              <p className="mt-1 text-sm text-[#64748B]">Temukan dan dukung kreator favoritmu.</p>
            </div>

            <div className="carousel-wrapper py-3 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
              <div className="carousel-marquee gap-6">
                {marqueeCreators.map((creator, index) => (
                  <Link
                    key={`${creator.username}-${index}`}
                    href={creator.donationUrl || `/donate/${creator.username}`}
                    className="flex min-w-[210px] items-center gap-3 rounded-2xl border border-[#E1E7EF] bg-white p-3.5 shadow-[0_8px_24px_rgba(15,42,95,0.06)] transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_14px_30px_rgba(15,42,95,0.1)] sm:min-w-[230px] sm:gap-3.5 sm:p-4"
                  >
                    <img
                      src={creator.profileImage || '/default-avatar.png'}
                      alt={creator.displayName || creator.username}
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                      className="h-11 w-11 shrink-0 rounded-full border border-[#E1E7EF] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#10264D]">
                        {creator.displayName || creator.username}
                      </p>
                      <p className="truncate text-xs text-[#64748B]">@{creator.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Manifesto Singkat dengan Maskot */}
      <section className="landing-scroll-section reveal-fade mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-[#2D64E8] p-6 shadow-[0_18px_45px_rgba(15,42,95,0.14)] sm:rounded-3xl sm:p-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:gap-8 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Manifesto Johen Donate
              </span>
              <p className="mt-5 text-xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
                "Karya dan siaranmu selalu punya tempat di hati orang yang tepat."
              </p>
              <p className="mt-4 text-sm font-normal leading-6 text-white/80">
                Dukungan dari komunitas adalah bahan bakar terbesar untuk terus berkarya. Kami hadir agar apresiasi itu bisa sampai kepadamu dengan cara yang paling menyenangkan.
              </p>
            </div>

            {/* Logo Johen Donate */}
            <div className="w-24 shrink-0 rounded-2xl bg-white p-3 shadow-[0_10px_24px_rgba(15,42,95,0.18)] sm:w-36 sm:p-4">
              <img
                src="/logo-blue.png"
                alt="Logo Johen Donate"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="landing-scroll-section reveal-from-right scroll-mt-20 border-y border-[#E1E7EF] bg-white py-12 sm:scroll-mt-24 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:gap-10 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Pertanyaan umum</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">Hal yang perlu kamu tahu</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#64748B] sm:text-base">
              Informasi singkat tentang donasi, biaya layanan, penarikan saldo, dan penggunaan overlay.
            </p>
            <Link href="/faq" className="mt-6 inline-flex text-sm font-semibold text-[#1D4ED8] transition hover:text-[#2563EB]">
              Lihat semua pertanyaan →
            </Link>
          </div>

          <div className="divide-y divide-[#E1E7EF] border-y border-[#E1E7EF]">
            {[
              ['Berapa biaya layanan setiap donasi?', 'Johen Donate mengenakan biaya layanan 5% dari setiap transaksi donasi yang berhasil. Potongan tercatat pada riwayat transaksi.'],
              ['Apakah penarikan saldo dikenakan biaya admin?', 'Tidak. Penarikan saldo ke rekening yang terdaftar tidak dikenakan biaya admin tambahan oleh Johen Donate.'],
              ['Bagaimana donasi muncul di overlay OBS?', 'Setelah pembayaran berhasil, data dikirim secara realtime ke overlay notifikasi, media share, dan leaderboard milik kreator.'],
              ['Apakah tampilan alert dapat disesuaikan?', 'Bisa. Kreator dapat mengatur background, warna, font, partikel, dan elemen gambar tambahan dari dashboard.'],
            ].map(([question, answer]) => (
              <details key={question} className="group py-4 sm:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-semibold text-[#10264D] sm:text-base">
                  {question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-lg font-normal text-[#1D4ED8] transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pr-10 pt-3 text-sm leading-6 text-[#64748B]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-scroll-section reveal-scale mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-28">
        <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#2D64E8] py-7 pl-5 pr-28 shadow-[0_20px_48px_rgba(15,42,95,0.16)] sm:min-h-[210px] sm:rounded-3xl sm:py-9 sm:pl-10 sm:pr-[230px] md:min-h-[180px] md:pr-[310px]">
          <div className="relative z-10 text-left">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-3xl">Siap menerima dukungan?</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#BFDBFE]">Buat halaman kreatormu dan mulai bagikan tautan donasi hari ini.</p>
            </div>
            <Link href="/creator/register" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF] sm:w-auto">
              Buat halaman gratis
            </Link>
          </div>
          <img src="/assets/karakter2.png" alt="Karakter Johen Donate" className="cta-character-reveal pointer-events-none absolute -right-3 bottom-0 h-44 w-auto object-contain sm:right-0 sm:h-56 md:h-[270px] lg:h-[310px]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E1E7EF] bg-white pt-10 text-sm text-[#64748B] sm:pt-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 items-start gap-x-6 gap-y-8 px-4 pb-8 sm:px-8 sm:pb-10 md:grid-cols-[1.5fr_0.75fr_0.75fr] md:gap-10">
          <div className="col-span-2 max-w-sm md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/logo-blue.png" alt="Johen Donate" className="h-9 w-9 object-contain" />
              <span className="text-base font-bold text-[#10264D]">Johen Donate</span>
            </div>
            <p className="mt-4 text-sm leading-6">Platform dukungan untuk kreator, streamer, dan komunitas agar terus berkarya.</p>
          </div>

          <nav>
            <p className="font-semibold text-[#10264D]">Produk</p>
            <div className="mt-4 flex flex-col gap-3">
              <a href="#cara-kerja" className="transition hover:text-[#1D4ED8]">Cara kerja</a>
              <a href="#fitur" className="transition hover:text-[#1D4ED8]">Fitur kreator</a>
              <a href="#biaya" className="transition hover:text-[#1D4ED8]">Biaya layanan</a>
              <Link href="/creator/register" className="transition hover:text-[#1D4ED8]">Buat halaman</Link>
            </div>
          </nav>

          <nav>
            <p className="font-semibold text-[#10264D]">Informasi</p>
            <div className="mt-4 flex flex-col gap-3">
              <a href="#faq" className="transition hover:text-[#1D4ED8]">Pertanyaan umum</a>
              <Link href="/contact" className="transition hover:text-[#1D4ED8]">Kontak</Link>
              <Link href="/privacy" className="transition hover:text-[#1D4ED8]">Kebijakan privasi</Link>
              <Link href="/terms" className="transition hover:text-[#1D4ED8]">Syarat & ketentuan</Link>
            </div>
          </nav>
        </div>

        <div className="border-t border-[#E1E7EF]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-center text-xs font-medium sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
            <span>© {new Date().getFullYear()} Johen Donate</span>
            <span>Dibuat untuk mendukung kreator Indonesia.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
