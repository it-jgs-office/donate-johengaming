import React from 'react';
import HistoryDonationItem from '../molecules/HistoryDonationItem';
import { formatRupiah } from '@/utils/format';

const HistoryDayCard = ({ 
  dayData, 
  className = '' 
}) => {
  return (
    <div className={`jd-surface overflow-hidden ${className}`}>
      {/* Date Header */}
      <div className="flex flex-col gap-3 border-b border-[#e8edf2] bg-[#f8fbfd] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-black text-sm text-[#0F2A5F]">{dayData.date}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#dce8ee] bg-white text-[#52637A]">
            {dayData.count} donasi
          </span>
        </div>
        <div className="text-left sm:text-right">
          <span className="block text-sm font-black text-[#0F2A5F]">{formatRupiah(dayData.netTotal ?? dayData.total)}</span>
          {(dayData.serviceFee || 0) > 0 && <span className="text-[11px] font-semibold text-[#64748B]">Masuk {formatRupiah(dayData.total)}</span>}
        </div>
      </div>

      {/* Donations List */}
      <div className="divide-y divide-[#e8edf2]">
        {dayData.donations.map((donation, idx) => (
          <HistoryDonationItem key={donation._id || idx} donation={donation} />
        ))}
      </div>
    </div>
  );
};

export default HistoryDayCard;
