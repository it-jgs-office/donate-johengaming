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
      <div className="px-5 py-3.5 flex justify-between items-center border-b border-[#e8edf2] bg-[#f8fbfd]">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm text-[#0F2A5F]">{dayData.date}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#dce8ee] bg-white text-[#52637A]">
            {dayData.count} donasi
          </span>
        </div>
        <div className="text-right">
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
