'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { formatRupiah } from '@/utils/format';
import { subscribeToCreatorDonations, subscribeToCreatorEvent } from '@/lib/pusher';

const rankAppearance = (rank) => {
  if (rank === 1) return { badge: 'bg-gradient-to-br from-[#FFD966] to-[#F59E0B] text-white shadow-[0_4px_12px_rgba(245,158,11,0.38)]', row: 'border-[#FDE7A8] bg-[#FFF9E8]' };
  if (rank === 2) return { badge: 'bg-gradient-to-br from-[#E8F0FA] to-[#A8BAD2] text-[#24416A] shadow-[0_4px_12px_rgba(71,85,105,0.2)]', row: 'border-[#DCE8F8] bg-[#FAFCFF]' };
  if (rank === 3) return { badge: 'bg-gradient-to-br from-[#F5C394] to-[#D97725] text-white shadow-[0_4px_12px_rgba(217,119,37,0.26)]', row: 'border-[#F8E1CB] bg-[#FFFCFA]' };
  return { badge: 'bg-[#DBEAFE] text-[#1D4ED8]', row: 'border-[#E0ECFC] bg-white' };
};

function LeaderboardPanel({ leaderboardData }) {
  const hasData = leaderboardData.length > 0;

  return (
    <section className="w-[min(94vw,760px)] overflow-hidden rounded-[30px] border border-[#93C5FD] bg-white shadow-[0_24px_64px_rgba(29,78,216,0.28)]">
      <header className="px-6 py-6 text-center sm:px-8 sm:py-7">
        <div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-[#111827] sm:text-4xl">Sultan Bulan Ini</h1>
            <p className="mt-1 text-sm font-medium text-[#475569] sm:text-lg">Top 5 donatur paling royal bulan ini</p>
          </div>
        </div>
      </header>

      <div className="space-y-2.5 p-4 sm:p-5">
        {hasData ? leaderboardData.slice(0, 5).map((donor, index) => {
          const rank = index + 1;
          const appearance = rankAppearance(rank);

          return (
            <div key={`${donor.name}-${rank}`} className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-2.5 sm:gap-4 sm:px-4 ${appearance.row}`}>
              {rank <= 3 ? (
                <img
                  src={`/icons/top${rank}.png`}
                  alt={`Peringkat ${rank}`}
                  className="h-12 w-12 shrink-0 object-contain"
                />
              ) : (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${appearance.badge}`}>{rank}</span>
              )}
              <span className="min-w-0 flex-1 truncate text-base font-black text-[#0F2157] sm:text-xl">{donor.name || 'Anonim'}</span>
              <span className="shrink-0 text-sm font-black tabular-nums text-[#123AB7] sm:text-lg">{formatRupiah(donor.totalAmount)}</span>
            </div>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F7FBFF] px-5 py-10 text-center">
            <div className="text-4xl" aria-hidden="true">🏆</div>
            <p className="mt-3 text-base font-black text-[#123AB7]">Belum ada donasi bulan ini</p>
            <p className="mt-1 text-sm font-medium text-[#607697]">Peringkat donatur akan tampil otomatis setelah pembayaran berhasil.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function LeaderboardOverlay() {
  const params = useParams();
  const username = params?.username;
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [overlayConfig, setOverlayConfig] = useState({ showLeaderboard: true });

  useEffect(() => {
    if (!username) return undefined;
    let active = true;

    const fetchLeaderboardData = async () => {
      try {
        const response = await axios.get(`/api/overlay/leaderboard?username=${encodeURIComponent(username)}`, { skipGlobalLoading: true });
        if (active) setLeaderboardData(response.data?.success && Array.isArray(response.data.leaderboard) ? response.data.leaderboard : []);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        if (active) setLeaderboardData([]);
      }
    };

    const fetchOverlayConfig = async () => {
      try {
        const response = await axios.get(`/api/overlay-config?username=${encodeURIComponent(username)}`, { skipGlobalLoading: true });
        if (active) {
          setOverlayConfig((current) => ({
            ...current,
            ...(response.data || {}),
            showLeaderboard: response.data?.showLeaderboard ?? current.showLeaderboard,
          }));
        }
      } catch (error) {
        console.error('Error fetching overlay config:', error);
      }
    };

    fetchOverlayConfig();
    fetchLeaderboardData();

    const unsubscribeDonations = subscribeToCreatorDonations(username, fetchLeaderboardData);
    const unsubscribeConfig = subscribeToCreatorEvent(username, 'overlay.config', ({ config }) => {
      setOverlayConfig((current) => ({ ...current, ...(config?.leaderboard || {}) }));
    });

    return () => {
      active = false;
      unsubscribeDonations();
      unsubscribeConfig();
    };
  }, [username]);

  if (!username) return null;

  return (
    <div className="fixed inset-0 font-sans antialiased">
      {overlayConfig.showLeaderboard && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8">
          <LeaderboardPanel leaderboardData={leaderboardData} />
        </div>
      )}
    </div>
  );
}
