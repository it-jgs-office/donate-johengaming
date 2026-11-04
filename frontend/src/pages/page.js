'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('Rp25.000');
  const [demoAlertActive, setDemoAlertActive] = useState(false);

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

  const handleLoginClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      toast.error('Dashboard hanya bisa diakses melalui desktop. Silakan buka website ini di komputer/laptop.', {
        duration: 5000,
        icon: '🖥️',
      });
      return;
    }
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

  const handleTestDonation = () => {
    setDemoAlertActive(true);
    setTimeout(() => {
      setDemoAlertActive(false);
    }, 4000);
  };

  const previewName = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'namamu';

  // Multiply creators list to guarantee a smooth, seamless infinite marquee
  const marqueeCreators = creators.length > 0 ? [...creators, ...creators, ...creators] : [];

  return (
    <main className="jd-app-shell font-sans text-[#10264D] antialiased selection:bg-[#BFDBFE] selection:text-[#10264D]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E1E7EF] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[#10264D]">Johen Donate</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#607697] md:flex">
            <a href="#cara-kerja" className="transition hover:text-[#1D4ED8]">Cara kerja</a>
            <a href="#fitur" className="transition hover:text-[#1D4ED8]">Fitur</a>
            <a href="#biaya" className="transition hover:text-[#1D4ED8]">Biaya</a>
          </nav>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleLoginClick}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#334E73] transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
            >
              Masuk
            </button>
            <Link
              href="/creator/register"
              className="jd-btn-primary inline-flex items-center px-5 py-2.5 text-sm font-semibold"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 md:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          {/* Kolom Kiri: Headline & Input Klaim */}
          <div>
            <div className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-semibold text-[#1D4ED8]">
              Platform Saweran & Apresiasi Kreator
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-[-0.035em] text-[#10264D] sm:text-5xl lg:text-[3.6rem] lg:leading-[1.08]">
              Bikin karya. <br />
              <span className="text-[#2563EB]">
                Biar mereka dukung.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base font-normal leading-7 text-[#607697] sm:text-lg">
              Satu tautan praktis untuk menerima saweran dan apresiasi langsung dari penikmat karya atau siaranmu.
            </p>

            {/* Input Klaim Username (The Hook) */}
            <form
              onSubmit={handleClaimSubmit}
              className="mt-8 flex max-w-lg flex-col gap-2 rounded-2xl border border-[#D9E2EB] bg-white p-2 shadow-[0_12px_32px_rgba(15,42,95,0.08)] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-sm">
                <span className="shrink-0 font-medium text-[#64748B]">localhost:3000/donate/</span>
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
                className="jd-btn-primary shrink-0 px-5 py-2.5 text-sm font-semibold"
              >
                Buat Halaman
              </button>
            </form>

            {/* Micro Points */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#607697]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> Gratis digunakan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> Pembayaran instan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> Langsung siap pakai
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Interaktif dengan Hook Notifikasi */}
          <div className="relative mx-auto w-full max-w-[420px]">
            {/* Kartu Halaman Kreator */}
            <div className="jd-surface relative p-6 shadow-[0_22px_55px_rgba(15,42,95,0.12)]">
              <div className="flex items-center justify-between border-b border-[#E1E7EF] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FDA4AF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FCD34D]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />
                </div>
                <span className="truncate pl-3 text-xs font-medium text-[#64748B]">
                  localhost:3000/donate/{previewName}
                </span>
              </div>

              {/* Profil Kreator */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold uppercase text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)]">
                  {previewName.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold capitalize text-[#10264D]">
                    {previewName}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">
                    @{previewName}
                  </p>
                </div>
              </div>

              {/* Simulasi Interaktif: Pop-up Notifikasi Alert */}
              {demoAlertActive ? (
                <div className="mt-5 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 transition-all">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
                    <span>Saweran masuk</span>
                    <span className="rounded-lg bg-[#2563EB] px-2.5 py-1 text-white">
                      {selectedAmount}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#10264D]">
                    Budi <span className="font-normal">mendukung</span> @{previewName}
                  </p>
                  <div className="mt-2 rounded-xl border border-[#DBEAFE] bg-white p-3 text-xs leading-5 text-[#526987]">
                    "Semangat terus ngontennya bang, ditunggu karya berikutnya!"
                  </div>
                </div>
              ) : (
                /* Pilihan Nominal Biasa */
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#607697]">Pilih nominal dukungan</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['Rp10.000', 'Rp25.000', 'Rp50.000'].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedAmount(amount)}
                        className={`rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition ${
                          selectedAmount === amount
                            ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-[0_6px_14px_rgba(37,99,235,0.2)]'
                            : 'border-[#D9E2EB] bg-white text-[#526987] hover:border-[#93C5FD] hover:bg-[#F8FBFF]'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleTestDonation}
                    className="jd-btn-primary mt-4 w-full py-2.5 text-center text-sm font-semibold"
                  >
                    Coba Kirim {selectedAmount}
                  </button>
                </div>
              )}

              <p className="mt-3 text-center text-[11px] font-normal text-[#7A8CA5]">
                {demoAlertActive ? 'Notifikasi otomatis tampil saat ada dukungan' : 'Klik tombol untuk melihat simulasi notifikasi'}
              </p>
            </div>

            {/* Logo Johen Donate */}
            <div className="pointer-events-none absolute -bottom-7 -right-4 w-20 drop-shadow-md sm:w-24">
              <img
                src="/logo-blue.png"
                alt="Logo Johen Donate"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Kategori Kreator */}
      <section className="border-y border-[#E1E7EF] bg-white/75 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2.5 px-5 text-xs font-medium text-[#334E73] sm:px-8 sm:gap-3">
          <span className="mr-1 text-[#7A8CA5]">Untuk kamu yang:</span>
          <span className="rounded-full border border-[#D9E2EB] bg-white px-3.5 py-1.5">
            Live Streaming
          </span>
          <span className="rounded-full border border-[#D9E2EB] bg-white px-3.5 py-1.5">
            Bikin Komik & Ilustrasi
          </span>
          <span className="rounded-full border border-[#D9E2EB] bg-white px-3.5 py-1.5">
            Rekam Podcast
          </span>
          <span className="rounded-full border border-[#D9E2EB] bg-white px-3.5 py-1.5">
            Bikin Musik
          </span>
          <span className="rounded-full border border-[#D9E2EB] bg-white px-3.5 py-1.5">
            Bangun Komunitas
          </span>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Cara kerja</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">
              Mulai menerima dukungan dalam tiga langkah
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#64748B] sm:text-base">
              Buat halaman kreator, bagikan tautan donasi, lalu kelola semua dukungan dari satu dashboard.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Buat halaman kreator', 'Daftar dan tentukan username untuk mendapatkan tautan donasi pribadi.'],
              ['02', 'Bagikan tautan donasi', 'Letakkan tautan di bio, deskripsi konten, atau bagikan saat live streaming.'],
              ['03', 'Terima dan tarik saldo', 'Pantau donasi secara realtime dan tarik saldo ke rekening yang terdaftar.'],
            ].map(([number, title, description]) => (
              <article key={number} className="rounded-2xl border border-[#E1E7EF] bg-white p-6 shadow-[0_8px_24px_rgba(15,42,95,0.05)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-sm font-semibold text-[#2563EB]">
                  {number}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[#10264D]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur Utama */}
      <section id="fitur" className="scroll-mt-24 border-y border-[#E1E7EF] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Untuk kreator</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">
              Dari halaman donasi sampai overlay, semuanya terhubung
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#64748B] sm:text-base">
              Kelola dukungan, tampilkan interaksi saat live, dan bangun identitas kreatormu dari satu tempat.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="relative overflow-hidden rounded-3xl bg-[#10264D] p-6 shadow-[0_24px_60px_rgba(15,42,95,0.2)] sm:p-9">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#2563EB]/35 blur-3xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-6">
                <div className="flex items-center justify-between text-xs text-[#BFDBFE]">
                  <span>Notifikasi saweran</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4ADE80]" /> Realtime</span>
                </div>
                <div className="mt-5 rounded-2xl border border-[#60A5FA]/35 bg-[#0B1F47] p-5 text-center shadow-xl">
                  <p className="text-2xl font-semibold text-white sm:text-3xl">Rp 100.000</p>
                  <p className="mt-2 text-sm font-semibold text-[#DBEAFE]">Bambang</p>
                  <p className="mt-2 text-xs leading-5 text-[#93C5FD]">Semangat terus live-nya!</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['Alert', 'Media Share', 'Leaderboard'].map((item) => (
                    <span key={item} className="rounded-lg bg-white/10 px-2 py-2 text-center text-[10px] font-medium text-[#DBEAFE]">{item}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Untuk live streaming</span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Interaksi masuk tanpa perlu refresh</h3>
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

          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-2 lg:order-1">
              <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Untuk halaman kreator</span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Halaman donasi yang terasa milikmu</h3>
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

            <div className="order-1 rounded-3xl border border-[#D9E2EB] bg-[#F8FBFF] p-5 shadow-[0_20px_48px_rgba(15,42,95,0.1)] sm:p-7 lg:order-2">
              <div className="overflow-hidden rounded-2xl border border-[#E1E7EF] bg-white">
                <div className="h-24 bg-gradient-to-r from-[#1D4ED8] to-[#60A5FA]" />
                <div className="px-5 pb-5">
                  <div className="-mt-7 h-14 w-14 rounded-full border-4 border-white bg-[#DBEAFE] shadow-sm" />
                  <div className="mt-3 h-3 w-28 rounded-full bg-[#10264D]" />
                  <div className="mt-2 h-2 w-20 rounded-full bg-[#CBD5E1]" />
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {['10K', '25K', '50K'].map((amount) => (
                      <span key={amount} className="rounded-lg border border-[#D9E2EB] py-2 text-center text-[10px] font-semibold text-[#526987]">Rp {amount}</span>
                    ))}
                  </div>
                  <div className="mt-3 h-10 rounded-xl bg-[#2563EB]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biaya */}
      <section id="biaya" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Biaya transparan</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">
              Potongan jelas, penarikan tanpa biaya admin
            </h2>
            <p className="mt-4 text-base leading-7 text-[#607697]">
              Setiap transaksi donasi yang berhasil dikenakan biaya layanan sebesar <strong className="font-semibold text-[#10264D]">5%</strong>. Saat saldo ditarik ke rekening terdaftar, Johen Donate tidak mengenakan biaya admin penarikan.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
                <p className="text-sm font-medium text-[#526987]">Biaya layanan transaksi</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#1D4ED8]">5%</p>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">Dipotong otomatis dari donasi yang berhasil.</p>
              </div>
              <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
                <p className="text-sm font-medium text-[#526987]">Biaya admin penarikan</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#1D4ED8]">Rp 0</p>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">Tidak ada potongan tambahan saat withdraw.</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#D9E2EB] bg-white p-6 shadow-[0_20px_48px_rgba(15,42,95,0.1)] sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E1E7EF] pb-5">
              <div>
                <p className="text-sm font-semibold text-[#10264D]">Contoh perhitungan</p>
                <p className="mt-1 text-xs text-[#7A8CA5]">Donasi berhasil</p>
              </div>
              <span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">Transparan</span>
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
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F8FBFF] px-4 py-3 text-[#526987]">
                <dt>Biaya saat ditarik</dt>
                <dd className="font-semibold text-[#1D4ED8]">Rp 0</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Auto-scrolling Marquee Kreator (Dengan margin kontainer sejajar) */}
      {creators.length > 0 && (
        <section className="mx-auto max-w-6xl overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
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
                  className="flex min-w-[230px] items-center gap-3.5 rounded-2xl border border-[#E1E7EF] bg-white p-4 shadow-[0_8px_24px_rgba(15,42,95,0.06)] transition hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_14px_30px_rgba(15,42,95,0.1)]"
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
        </section>
      )}

      {/* Manifesto Singkat dengan Maskot */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-[#D9E7FA] bg-[#EFF6FF] p-8 shadow-[0_18px_45px_rgba(15,42,95,0.08)] sm:p-12">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block rounded-full border border-[#BFDBFE] bg-white px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                Manifesto Johen Donate
              </span>
              <p className="mt-5 text-2xl font-semibold leading-snug tracking-tight text-[#10264D] sm:text-3xl">
                "Karya dan siaranmu selalu punya tempat di hati orang yang tepat."
              </p>
              <p className="mt-4 text-sm font-normal leading-6 text-[#607697]">
                Dukungan dari komunitas adalah bahan bakar terbesar untuk terus berkarya. Kami hadir agar apresiasi itu bisa sampai kepadamu dengan cara yang paling menyenangkan.
              </p>
            </div>

            {/* Logo Johen Donate */}
            <div className="w-28 shrink-0 drop-shadow-md sm:w-36">
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
      <section className="border-y border-[#E1E7EF] bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">Pertanyaan umum</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10264D] sm:text-4xl">Hal yang perlu kamu tahu</h2>
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
              <details key={question} className="group py-5">
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
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#10264D] px-7 py-9 text-center shadow-[0_20px_48px_rgba(15,42,95,0.18)] sm:px-10 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Siap menerima dukungan?</h2>
            <p className="mt-2 text-sm leading-6 text-[#BFDBFE]">Buat halaman kreatormu dan mulai bagikan tautan donasi hari ini.</p>
          </div>
          <Link href="/creator/register" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF]">
            Buat halaman gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E1E7EF] bg-white pt-12 text-sm text-[#64748B]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 sm:px-8 md:grid-cols-[1.5fr_0.75fr_0.75fr]">
          <div className="max-w-sm">
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
              <Link href="/faq" className="transition hover:text-[#1D4ED8]">FAQ</Link>
              <Link href="/contact" className="transition hover:text-[#1D4ED8]">Kontak</Link>
              <Link href="/privacy" className="transition hover:text-[#1D4ED8]">Kebijakan privasi</Link>
              <Link href="/terms" className="transition hover:text-[#1D4ED8]">Syarat & ketentuan</Link>
            </div>
          </nav>
        </div>

        <div className="border-t border-[#E1E7EF]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs font-medium sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>© {new Date().getFullYear()} Johen Donate</span>
            <span>Dibuat untuk mendukung kreator Indonesia.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
