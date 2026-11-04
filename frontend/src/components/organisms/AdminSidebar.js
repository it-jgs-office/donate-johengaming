'use client';

import { useState } from 'react';

const navItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-13h6V4h-6v3Z" />,
  },
  {
    key: 'creator',
    label: 'Kreator',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.99a4 4 0 0 1 0 7.75" />,
  },
  {
    key: 'payout',
    label: 'Payout',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 11h2m4 0h2M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
  },
  {
    key: 'feedback',
    label: 'Feedback',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  },
  {
    key: 'settings',
    label: 'Biaya layanan',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.35 7.35 0 0 0-.1-1.2l2-1.55-2-3.46-2.35.95a7.07 7.07 0 0 0-2.08-1.2L14.5 3h-4l-.37 2.54a7.07 7.07 0 0 0-2.08 1.2L5.7 5.8l-2 3.46 2 1.55a7.35 7.35 0 0 0 0 2.4l-2 1.55 2 3.46 2.35-.95a7.07 7.07 0 0 0 2.08 1.2L10.5 21h4l.37-2.54a7.07 7.07 0 0 0 2.08-1.2l2.35.95 2-3.46-2-1.55c.07-.4.1-.8.1-1.2Z" />,
  },
];

export default function AdminSidebar({ activeSection, setActiveSection, onLogout, user, payoutPendingCount = 0 }) {
  const [open, setOpen] = useState(false);

  const selectSection = (section) => {
    setActiveSection(section);
    setOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/15 bg-[#0F2A5F]/95 px-4 text-white backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-7 w-7 object-contain" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Johen Donate</p>
            <p className="text-[10px] text-blue-100">Admin dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Buka navigasi admin"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </header>

      {open && <button type="button" aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed bottom-4 left-4 top-4 z-50 flex w-[264px] flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#2B5BAF] via-[#1E478A] to-[#0F2A5F] text-white shadow-[0_20px_45px_rgba(15,42,95,0.28)] transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
        <div className="flex min-h-20 items-center gap-3 border-b border-white/15 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <img src="/logo-blue.png" alt="Logo Johen Donate" className="h-8 w-8 object-contain" />
          </span>
          <div>
            <h1 className="text-sm font-bold text-white">Johen Donate</h1>
            <p className="mt-0.5 text-[11px] text-blue-100">Admin dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Navigasi admin">
          {navItems.map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all ${active ? 'bg-white text-[#1D4ED8] shadow-[0_8px_18px_rgba(15,42,95,0.2)]' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}
                onClick={() => selectSection(item.key)}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#2563EB] text-white shadow-[0_5px_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 text-white ring-1 ring-white/10'}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{item.icon}</svg>
                </span>
                {item.label}
                {item.key === 'payout' && payoutPendingCount > 0 && (
                  <span
                    className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-[#2563EB] text-white' : 'bg-white text-[#1D4ED8]'}`}
                    aria-label={`${payoutPendingCount} pengajuan payout menunggu`}
                  >
                    {payoutPendingCount > 99 ? '99+' : payoutPendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="m-4 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#1D4ED8]">
              {(user?.displayName || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.displayName || user?.username || 'Administrator'}</p>
              <p className="truncate text-[10px] text-blue-100">{user?.email || 'admin'}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 17l5-5-5-5m5 5H3m11-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
