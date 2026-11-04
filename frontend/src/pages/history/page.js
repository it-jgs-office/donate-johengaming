"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import HistoryFilters from '@/components/organisms/HistoryFilters';
import HistoryList from '@/components/organisms/HistoryList';
import CreatorAppLayout from '@/components/dashboard/CreatorAppLayout';
import Link from 'next/link';
import { formatRupiah } from '@/utils/format';
import { subscribeToCreatorDonations } from '@/lib/pusher';
import { getStoredUser } from '@/utils/sessionManager';

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser);
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(() => !getStoredUser());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    fetchHistoryData();
  }, []);

  useEffect(() => {
    if (!user?.username) return;

    return subscribeToCreatorDonations(user.username, () => {
      fetchHistoryData();
    });
  }, [user?.username]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  };

  const fetchHistoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/dashboard/history', config);
      const allDonations = response.data.donations || [];
      
      const paidDonations = allDonations.filter(d => d.status === 'PAID');
      
      const grouped = paidDonations.reduce((acc, donation) => {
        const date = new Date(donation.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        if (!acc[date]) {
          acc[date] = { date, total: 0, serviceFee: 0, netTotal: 0, count: 0, donations: [] };
        }
        acc[date].total += donation.amount;
        acc[date].serviceFee += donation.serviceFeeAmount || 0;
        acc[date].netTotal += donation.netAmount ?? donation.amount;
        acc[date].count += 1;
        acc[date].donations.push(donation);
        return acc;
      }, {});

      const historyArray = Object.values(grouped).sort((a, b) => 
        new Date(b.donations[0]?.createdAt) - new Date(a.donations[0]?.createdAt)
      );
      
      setHistoryData(historyArray);
      setFilteredData(historyArray);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    if (!date) {
      setFilteredData(historyData);
    } else {
      setFilteredData(historyData.filter(day => day.date === date));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      handleDateFilter(selectedDate);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = historyData.map(day => ({
      ...day,
      donations: day.donations.filter(d => 
        (d.name && d.name.toLowerCase().includes(searchLower)) ||
        (d.message && d.message.toLowerCase().includes(searchLower))
      )
    })).filter(day => day.donations.length > 0);

    filtered.forEach(day => {
      day.total = day.donations.reduce((sum, d) => sum + d.amount, 0);
      day.serviceFee = day.donations.reduce((sum, d) => sum + (d.serviceFeeAmount || 0), 0);
      day.netTotal = day.donations.reduce((sum, d) => sum + (d.netAmount ?? d.amount), 0);
      day.count = day.donations.length;
    });

    setFilteredData(filtered);
  };

  const totalDonations = filteredData.reduce((sum, day) => sum + day.count, 0);
  const totalAmount = filteredData.reduce((sum, day) => sum + day.total, 0);
  const totalServiceFee = filteredData.reduce((sum, day) => sum + day.serviceFee, 0);
  const totalNetAmount = filteredData.reduce((sum, day) => sum + day.netTotal, 0);

  const dateOptions = historyData.map(day => ({
    value: day.date,
    label: `${day.date} (${day.count} donasi)`
  }));

  if (loading) {
    return null;
  }

  return (
    <CreatorAppLayout user={user}>
      {/* Page Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-100">
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <span>/</span>
          <span className="font-semibold text-white">Riwayat</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Riwayat Donasi</h1>
        <p className="mt-0.5 text-sm font-medium text-blue-100">Seluruh apresiasi yang berhasil diterima.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="jd-surface p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#607697] block">Total Transaksi</span>
          <span className="text-2xl font-black text-[#0F2A5F] mt-1 block">{totalDonations} donasi</span>
        </div>
        <div className="jd-surface-strong p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#BFDBFE] block">Total Masuk</span>
          <span className="text-2xl font-black text-white mt-1 block">{formatRupiah(totalAmount)}</span>
        </div>
        <div className="jd-surface p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#607697] block">Biaya Layanan</span>
          <span className="text-2xl font-black text-[#0F2A5F] mt-1 block">-{formatRupiah(totalServiceFee)}</span>
        </div>
        <div className="jd-surface p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#607697] block">Saldo Bersih</span>
          <span className="text-2xl font-black text-[#0F2A5F] mt-1 block">{formatRupiah(totalNetAmount)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="jd-surface p-5">
        <HistoryFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          selectedDate={selectedDate}
          onDateChange={handleDateFilter}
          dateOptions={dateOptions}
        />
      </div>

      {/* List */}
      <HistoryList
        data={filteredData}
        searchQuery={searchQuery}
        totalDonations={totalDonations}
      />
    </CreatorAppLayout>
  );
}
