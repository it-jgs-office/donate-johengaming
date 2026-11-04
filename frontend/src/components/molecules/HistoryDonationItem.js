import React from 'react';
import Avatar from '../atoms/Avatar';
import { formatRupiah } from '@/utils/format';

const HistoryDonationItem = ({ 
  donation, 
  className = '' 
}) => {
  const formattedTime = new Date(donation.createdAt).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const isMediaShare = donation.mediaShareRequest?.enabled;

  return (
    <div className={`px-5 py-4 hover:bg-[#f7fcff] transition-colors ${className}`}>
      <div className="flex items-start gap-3.5">
        <Avatar name={donation.name} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-extrabold text-sm text-[#0F2A5F] truncate">{donation.name}</span>
              <span className="text-xs font-mono font-bold text-[#607697]">{formattedTime}</span>
              {isMediaShare && (
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-[#0F2A5F] bg-blue-100 text-blue-900 shadow-[1px_1px_0px_#0F2A5F]">
                  Media Share
                </span>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="block text-base font-black text-[#0F2A5F]">{formatRupiah(donation.netAmount ?? donation.amount)}</span>
              {(donation.serviceFeeAmount || 0) > 0 && (
                <span className="block text-[11px] font-semibold text-[#64748B]">Masuk {formatRupiah(donation.amount)} · Potongan {formatRupiah(donation.serviceFeeAmount)}</span>
              )}
            </div>
          </div>

          {donation.message ? (
            <p className="mt-2 text-sm font-medium text-[#0F2A5F] break-words bg-[#f7fcff] p-2.5 rounded-xl border border-[#0F2A5F]/20">
              {donation.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#607697] italic">Tanpa pesan</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDonationItem;
