import React from "react";
import Card from '../atoms/Card';

export default function CreatorDetailModal({ creator, onClose }) {
  if (!creator) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        className="relative max-h-full w-full max-w-md overflow-hidden !rounded-2xl !border-0 !bg-white !p-6 !shadow-[0_24px_70px_rgba(15,42,95,0.22)]"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563EB]">Data akun</span>
        <h3 className="mb-2 mt-1 text-xl font-bold text-[#10264D]">Detail kreator</h3>
        <button
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-lg font-bold leading-none text-[#67748E] hover:bg-[#EFF6FF]"
        >
          &times;
        </button>
        <div className="mt-5 max-h-[calc(100vh-8rem)] overflow-y-auto divide-y divide-slate-100 rounded-xl bg-[#F8F9FA] px-4">
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Username</span><span className="text-sm font-bold text-[#10264D]">@{creator.username}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Email</span><span className="text-sm text-[#10264D] break-all">{creator.email}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Nama</span><span className="text-sm text-[#10264D]">{creator.displayName}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Nomor payout</span><span className="text-sm text-[#10264D]">{creator.payoutSettings?.accountNumber || '-'}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Pemilik payout</span><span className="text-sm text-[#10264D]">{creator.payoutSettings?.accountHolder || '-'}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Jenis payout</span><span className="text-sm text-[#10264D]">{creator.payoutSettings?.type || '-'}</span></div>
          <div className="py-3"><span className="text-xs font-bold text-[#94A3B8] block">Tanggal daftar</span><span className="text-sm text-[#10264D]">{creator.createdAt ? new Date(creator.createdAt).toLocaleString('id-ID') : '-'}</span></div>
        </div>
      </Card>
    </div>
  );
}
