import React from 'react';
import HistoryDayCard from './HistoryDayCard';

const HistoryList = ({ 
  data, 
  searchQuery = '',
  totalDonations = 0,
  className = '' 
}) => {
  if (data.length === 0) {
    return (
      <div className="jd-surface text-center py-16 p-8">
        <img
          src="/logo-blue.png"
          alt="Logo Johen Donate"
          className="h-16 w-16 object-contain select-none opacity-60 mx-auto mb-3"
        />
        <div className="text-sm text-[#0F2A5F] font-black">
          {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat donasi'}
        </div>
        <p className="text-xs font-medium text-[#526987] mt-1 max-w-sm mx-auto">
          {searchQuery 
            ? 'Coba gunakan kata kunci pencarian yang berbeda.' 
            : 'Donasi yang berhasil masuk akan tercatat dan dikelompokkan per hari di sini.'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-5">
        {data.map((day, idx) => (
          <HistoryDayCard key={idx} dayData={day} />
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
