'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { signOut } from 'next-auth/react';

const resolvePageTitle = (pathname) => {
  if (pathname === '/dashboard/payout') return 'Pencairan Saldo';
  if (pathname === '/dashboard/profile') return 'Pengaturan Akun';
  if (pathname === '/dashboard/feedback') return 'Feedback & Laporan';
  if (pathname === '/history') return 'Riwayat Donasi';
  if (pathname?.startsWith('/overlay')) return 'Overlay & OBS';
  return 'Dashboard';
};

export default function CreatorAppLayout({ user, onLogout, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitle = resolvePageTitle(pathname);
  const showShellHeader = pathname === '/dashboard';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-13h6V4h-6v3Z" /> },
    { label: 'Pencairan Saldo', href: '/dashboard/payout', active: pathname === '/dashboard/payout', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 11h2m4 0h2M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /> },
    { label: 'Riwayat Donasi', href: '/history', active: pathname === '/history', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
    { label: 'Overlay & OBS', href: user?.username ? `/overlay/${user.username}` : '#', active: pathname?.startsWith('/overlay'), disabled: !user?.username, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17 9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" /> },
    { label: 'Feedback & Laporan', href: '/dashboard/feedback', active: pathname === '/dashboard/feedback', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8ZM8 8h8M8 12h5" /> },
    { label: 'Pengaturan Akun', href: '/dashboard/profile', active: pathname === '/dashboard/profile', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.35 7.35 0 0 0-.1-1.2l2-1.55-2-3.46-2.35.95a7.07 7.07 0 0 0-2.08-1.2L14.5 3h-4l-.37 2.54a7.07 7.07 0 0 0-2.08 1.2L5.7 5.8l-2 3.46 2 1.55a7.35 7.35 0 0 0 0 2.4l-2 1.55 2 3.46 2.35-.95a7.07 7.07 0 0 0 2.08 1.2L10.5 21h4l.37-2.54a7.07 7.07 0 0 0 2.08-1.2l2.35.95 2-3.46-2-1.55c.07-.4.1-.8.1-1.2Z" /> },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    toast((toastItem) => (
      <div className="flex flex-col gap-2 p-1">
        <span className="text-sm font-bold text-[#0F2A5F]">Keluar dari akun kreator?</span>
        <div className="mt-1 flex gap-2">
          <button onClick={async () => { toast.dismiss(toastItem.id); try { localStorage.removeItem('token'); localStorage.removeItem('user'); await signOut({ redirect: false }); toast.success('Berhasil keluar'); router.replace('/'); } catch { router.replace('/login'); } }} className="jd-btn-primary cursor-pointer px-4 py-2 text-xs font-semibold">Ya, keluar</button>
          <button onClick={() => toast.dismiss(toastItem.id)} className="jd-btn-secondary cursor-pointer px-4 py-2 text-xs font-semibold">Batal</button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const openPage = (item) => {
    setSidebarOpen(false);
    if (item.disabled) {
      toast.error('Lengkapi username terlebih dahulu');
      return;
    }
    router.push(item.href);
  };

  const profileName = user?.displayName || user?.username || 'Kreator';

  return (
    <div className="jd-app-shell jd-creator-shell flex w-full overflow-x-hidden font-sans text-[#10264D] antialiased">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/15 bg-[#0F2A5F]/95 px-3 text-white backdrop-blur-xl sm:px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white"><img src="/logo-blue.png" alt="Johen Donate" className="h-7 w-7 object-contain" /></span>
          <div><p className="text-sm font-bold">Johen Donate</p><p className="text-[10px] text-blue-100">{pageTitle}</p></div>
        </Link>
        <button type="button" onClick={() => setSidebarOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20" aria-label="Buka navigasi">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
        </button>
      </header>

      {sidebarOpen && <button type="button" aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed bottom-3 left-3 top-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[264px] flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#2B5BAF] via-[#1E478A] to-[#0F2A5F] text-white shadow-[0_20px_45px_rgba(15,42,95,0.28)] transition-transform duration-200 lg:bottom-4 lg:left-4 lg:top-4 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
        <div className="flex min-h-20 items-center gap-3 border-b border-white/15 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"><img src="/logo-blue.png" alt="Johen Donate" className="h-8 w-8 object-contain" /></span>
          <div><h1 className="text-sm font-bold">Johen Donate</h1><p className="mt-0.5 text-[11px] text-blue-100">Creator dashboard</p></div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Navigasi kreator">
          {navItems.map((item) => (
            <button key={item.label} type="button" disabled={item.disabled} onClick={() => openPage(item)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all ${item.active ? 'bg-white text-[#1D4ED8] shadow-[0_8px_18px_rgba(15,42,95,0.2)]' : 'text-blue-100 hover:bg-white/10 hover:text-white'} ${item.disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.active ? 'bg-[#2563EB] text-white shadow-[0_5px_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 text-white ring-1 ring-white/10'}`}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg></span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="m-4 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-xs font-bold text-[#1D4ED8]">
              {user?.profileImage || user?.profileImageUrl ? <img src={user.profileImage || user.profileImageUrl} alt={profileName} className="h-full w-full object-cover" /> : profileName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{profileName}</p><p className="truncate text-[10px] text-blue-100">@{user?.username || 'kreator'}</p></div>
          </div>
          <button type="button" onClick={handleLogout} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 17l5-5-5-5m5 5H3m11-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>Keluar</button>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 w-full max-w-full flex-grow overflow-x-hidden pt-16 lg:pl-[296px] lg:pt-0">
        {showShellHeader && (
          <header className="flex h-20 items-center justify-between px-4 text-white sm:h-24 sm:px-7 lg:h-28 lg:px-8">
            <div><div className="flex items-center gap-2 text-xs font-medium text-blue-100"><span>Kreator</span><span>/</span><span>{pageTitle}</span></div><h1 className="mt-1 text-xl font-bold tracking-tight">{pageTitle}</h1></div>
            <div className="hidden items-center gap-3 sm:flex"><div className="text-right"><p className="text-xs font-semibold">{profileName}</p><p className="mt-0.5 text-[11px] text-blue-100">@{user?.username || 'kreator'}</p></div><div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/25">{user?.profileImage || user?.profileImageUrl ? <img src={user.profileImage || user.profileImageUrl} alt={profileName} className="h-full w-full object-cover" /> : profileName.charAt(0).toUpperCase()}</div></div>
          </header>
        )}
        <div className={`mx-auto min-h-[calc(100dvh-7rem)] max-w-[1600px] space-y-4 px-3 pb-6 sm:space-y-6 sm:px-7 sm:pb-8 lg:px-8 ${showShellHeader ? '' : 'pt-4 sm:pt-6 lg:pt-8'}`}>{children}</div>
      </main>
    </div>
  );
}
