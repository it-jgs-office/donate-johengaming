"use client";

import React from 'react';
import { formatRupiah } from '@/utils/format';
import { useRouter } from 'next/navigation';

const StatsSection = ({ stats, onHistoryClick, onLeaderboardClick }) => {
  const router = useRouter();
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {/* Kartu 1: Saldo / Total Terkumpul */}
      <div className="rounded-2xl border-2 border-[#0F2A5F] bg-[#ffffff] p-5 shadow-[4px_4px_0px_#0F2A5F] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B]">
            <span>Saldo Terkumpul</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0F2A5F] tracking-tight">
            {formatRupiah(stats.totalAmount || 0)}
          </div>
          <p className="mt-1 text-xs text-[#526987]">
            Akumulasi total donasi yang berhasil
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#0F2A5F]/10">
          <button
            onClick={() => router.push('/dashboard/payout')}
            className="w-full text-center text-xs font-extrabold text-[#0F2A5F] hover:underline flex items-center justify-between cursor-pointer"
          >
            <span>Kelola Pencairan</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Kartu 2: Donasi Hari Ini */}
      <div className="rounded-2xl border-2 border-[#0F2A5F] bg-[#ffffff] p-5 shadow-[4px_4px_0px_#0F2A5F] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B]">
            <span>Hari Ini</span>
            <span className="font-mono text-[10px] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#0F2A5F]/20 text-[#0F2A5F] font-bold">24 Jam</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0F2A5F] tracking-tight">
            {formatRupiah(stats.todayAmount || 0)}
          </div>
          <p className="mt-1 text-xs text-[#526987]">
            {stats.todayDonations || 0} donasi masuk sejak 00:00 WIB
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#0F2A5F]/10">
          <span className="text-xs font-semibold text-[#64748B]">
            Reset otomatis tengah malam
          </span>
        </div>
      </div>

      {/* Kartu 3: Total Transaksi Donasi */}
      <div className="rounded-2xl border-2 border-[#0F2A5F] bg-[#ffffff] p-5 shadow-[4px_4px_0px_#0F2A5F] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B]">
            <span>Total Dukungan</span>
            <span className="text-base">❤️</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0F2A5F] tracking-tight">
            {stats.totalDonations || 0}
            <span className="text-sm font-bold text-[#64748B] ml-1.5">kali</span>
          </div>
          <p className="mt-1 text-xs text-[#526987]">
            Semua dukungan dari penontonmu
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#0F2A5F]/10">
          <button
            onClick={() => onHistoryClick && onHistoryClick()}
            className="w-full text-center text-xs font-extrabold text-[#0F2A5F] hover:underline flex items-center justify-between cursor-pointer"
          >
            <span>Buka Riwayat Lengkap</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Kartu 4: Peringkat Donatur / Leaderboard */}
      <div className="rounded-2xl border-2 border-[#0F2A5F] bg-[#EFF6FF] p-5 shadow-[4px_4px_0px_#0F2A5F] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0F2A5F]">
            <span>Top Sultan Bulan Ini</span>
            <span className="text-base">🏆</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-[#0F2A5F] tracking-tight">
            Leaderboard
          </div>
          <p className="mt-1 text-xs text-[#4B6282]">
            Daftar donatur paling setia & loyal bulanan
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#0F2A5F]/15">
          <button
            onClick={() => onLeaderboardClick && onLeaderboardClick()}
            className="w-full py-2 px-3 rounded-xl border-2 border-[#0F2A5F] bg-white text-xs font-extrabold text-[#0F2A5F] shadow-[2px_2px_0px_#0F2A5F] transition hover:bg-[#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-y-0.5 cursor-pointer text-center block"
          >
            Lihat Peringkat Donatur
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
