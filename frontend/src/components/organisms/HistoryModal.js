import React from 'react';
import { formatRupiah } from '@/utils/format';
import Modal from '../atoms/Modal';
import Card from '../atoms/Card';

const HistoryModal = ({ 
  onClose, 
  historyData, 
  selectedDate, 
  onDateFilterChange 
}) => {
  // Calculate total stats
  const totalDonations = historyData.reduce((sum, day) => sum + day.count, 0);
  const totalAmount = historyData.reduce((sum, day) => sum + day.total, 0);

  return (
    <Modal isOpen={true} onClose={onClose} title="📜 Riwayat Donasi" maxWidth="max-w-4xl">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center shadow-neon">
              <span className="text-lg">🎁</span>
            </div>
            <div>
              <div className="text-[#2563EB] text-sm font-mono">Total Donasi</div>
              <div className="text-xl font-extrabold text-[#2563EB] font-mono">{totalDonations}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center shadow-neon">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <div className="text-[#2563EB] text-sm font-mono">Total Pendapatan</div>
              <div className="text-xl font-extrabold text-[#2563EB] font-mono">{formatRupiah(totalAmount)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="mb-4">
        <div className="relative">
          <select
            value={selectedDate}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="w-full px-4 py-3 border-4 border-[#2563EB] bg-[#0F2A5F] text-[#2563EB] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all appearance-none cursor-pointer"
          >
            <option value="">📅 Semua tanggal</option>
            {historyData.map((day, idx) => (
              <option key={idx} value={day.date}>
                {day.date} • {formatRupiah(day.total)} • {day.count} donasi
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#2563EB]">
            ▼
          </div>
        </div>
      </div>

      {/* Donation List */}
      <div className="max-h-[calc(100vh-24rem)] overflow-y-auto space-y-4 pr-1">
        {historyData.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-[#2563EB] font-bold font-mono">
              {selectedDate ? 'Tidak ada donasi pada tanggal tersebut' : 'Belum ada riwayat donasi'}
            </div>
          </Card>
        ) : (
          historyData.map((day, idx) => (
            <Card key={idx} className="overflow-hidden">
              {/* Date Header */}
              <div className="bg-[#2563EB]/10 px-4 py-3 flex justify-between items-center border-b-2 border-[#2563EB]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center shadow-neon">
                    <span className="text-sm">📅</span>
                  </div>
                  <span className="font-extrabold text-[#2563EB] font-mono">{day.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-[#2563EB]/20 px-3 py-1 rounded-lg text-[#2563EB] font-bold font-mono border-2 border-[#2563EB]">
                    {day.count} donasi
                  </span>
                  <span className="bg-[#2563EB] text-white px-3 py-1 rounded-lg font-extrabold font-mono">
                    {formatRupiah(day.total)}
                  </span>
                </div>
              </div>

              {/* Donations */}
              <div className="divide-y-2 divide-[#2563EB]/30">
                {day.donations.map((donation, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-[#2563EB]/10 transition-all">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-neon font-mono">
                          {donation.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#2563EB] truncate font-mono">{donation.name}</div>
                          {donation.message ? (
                            <p className="text-sm text-[#2563EB]/70 mt-1 font-mono">
                              💬 {donation.message}
                            </p>
                          ) : (
                            <p className="text-sm text-[#2563EB]/50 mt-1 italic font-mono">— Tanpa pesan —</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-extrabold text-[#2563EB] whitespace-nowrap font-mono">
                          {formatRupiah(donation.amount)}
                        </div>
                        <div className="text-xs text-[#2563EB]/60 mt-1 font-mono">
                          {new Date(donation.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </Modal>
  );
};

export default HistoryModal;
