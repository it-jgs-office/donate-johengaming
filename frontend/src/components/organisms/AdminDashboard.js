import { useEffect, useMemo, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { formatRupiah } from '@/utils/format';

Chart.register(...registerables);

const donationStatus = {
  PAID: { label: 'Berhasil', classes: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Menunggu', classes: 'bg-amber-50 text-amber-700' },
  FAILED: { label: 'Gagal', classes: 'bg-red-50 text-red-700' },
  CANCELLED: { label: 'Dibatalkan', classes: 'bg-slate-100 text-slate-600' },
};

const statIcons = {
  gross: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M5 11h2m4 0h2M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
  fee: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  creators: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.99a4 4 0 0 1 0 7.75" />,
  payout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />,
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function StatCard({ label, value, helper, icon, emphasis }) {
  return (
    <article className="admin-stat-card flex min-h-[126px] items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#8392AB]">{label}</p>
        <p className="mt-2 truncate text-xl font-bold tracking-tight text-[#10264D] sm:text-2xl">{value}</p>
        <p className="mt-2 text-xs text-[#67748E]"><span className="font-bold text-[#2563EB]">{emphasis}</span> {helper}</p>
      </div>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#0F2A5F] text-white shadow-[0_7px_16px_rgba(37,99,235,0.3)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
      </span>
    </article>
  );
}

export default function AdminDashboard({ creators, payouts, donations }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const creatorsArray = Array.isArray(creators) ? creators : [];
  const payoutsArray = Array.isArray(payouts) ? payouts : [];
  const donationsArray = Array.isArray(donations) ? donations : [];
  const paidDonations = useMemo(() => donationsArray.filter((donation) => donation.status === 'PAID'), [donationsArray]);

  const financials = useMemo(() => paidDonations.reduce((total, donation) => ({
    gross: total.gross + Number(donation.amount || 0),
    fee: total.fee + Number(donation.serviceFeeAmount || 0),
    net: total.net + Number(donation.netAmount ?? donation.amount ?? 0),
  }), { gross: 0, fee: 0, net: 0 }), [paidDonations]);

  const actionablePayouts = payoutsArray.filter((payout) => ['PENDING', 'APPROVED'].includes(payout.status));
  const actionablePayoutAmount = actionablePayouts.reduce((total, payout) => total + Number(payout.amount || payout.finalAmount || 0), 0);
  const successRate = donationsArray.length > 0 ? Math.round((paidDonations.length / donationsArray.length) * 100) : 0;

  const topCreators = useMemo(() => {
    const totals = paidDonations.reduce((result, donation) => {
      const username = donation.createdByUsername || 'tanpa-username';
      result[username] = (result[username] || 0) + Number(donation.netAmount ?? donation.amount ?? 0);
      return result;
    }, {});
    return creatorsArray
      .map((creator) => ({
        username: creator.username,
        displayName: creator.displayName || creator.username,
        totalDonation: totals[creator.username] || 0,
      }))
      .filter((creator) => creator.totalDonation > 0)
      .sort((a, b) => b.totalDonation - a.totalDonation)
      .slice(0, 5);
  }, [paidDonations, creatorsArray]);

  const dailySeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    return days.map((date) => {
      const value = paidDonations.reduce((total, donation) => {
        const donationDate = new Date(donation.createdAt || 0);
        return donationDate.toDateString() === date.toDateString() ? total + Number(donation.amount || 0) : total;
      }, 0);
      return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), value };
    });
  }, [paidDonations]);

  const recentDonations = useMemo(() => [...donationsArray]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 7), [donationsArray]);

  useEffect(() => {
    chartInstanceRef.current?.destroy();
    if (!chartRef.current) return undefined;
    const context = chartRef.current.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: dailySeries.map((item) => item.label),
        datasets: [{
          data: dailySeries.map((item) => item.value),
          borderColor: '#2563EB',
          backgroundColor: gradient,
          fill: true,
          tension: 0.42,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#2563EB',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#10264D',
            padding: 11,
            displayColors: false,
            callbacks: { label: (contextValue) => formatRupiah(contextValue.parsed.y) },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8392AB', font: { size: 11 } } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#E9ECEF', borderDash: [5, 5] },
            ticks: { color: '#8392AB', font: { size: 11 }, callback: (value) => `Rp ${Number(value).toLocaleString('id-ID', { notation: 'compact' })}` },
          },
        },
        animation: { duration: 350 },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [dailySeries]);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Donasi masuk" value={formatRupiah(financials.gross)} emphasis={`${paidDonations.length}`} helper="transaksi berhasil" icon={statIcons.gross} />
        <StatCard label="Pendapatan layanan" value={formatRupiah(financials.fee)} emphasis={formatRupiah(financials.net)} helper="hak kreator" icon={statIcons.fee} />
        <StatCard label="Kreator" value={creatorsArray.length.toLocaleString('id-ID')} emphasis={`${successRate}%`} helper="transaksi berhasil" icon={statIcons.creators} />
        <StatCard label="Payout aktif" value={formatRupiah(actionablePayoutAmount)} emphasis={`${actionablePayouts.length}`} helper="perlu ditindak" icon={statIcons.payout} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="admin-panel-card overflow-hidden">
          <div className="px-6 pt-6">
            <h2 className="text-base font-bold text-[#10264D]">Aktivitas donasi</h2>
            <p className="mt-1 text-xs text-[#67748E]"><span className="font-bold text-emerald-500">{successRate}% berhasil</span> dalam tujuh hari terakhir</p>
          </div>
          <div className="h-[330px] px-4 pb-5 pt-6 sm:px-6">
            <canvas ref={chartRef} />
          </div>
        </article>

        <article className="admin-panel-card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-bold text-[#10264D]">Kreator teratas</h2>
            <p className="mt-1 text-xs text-[#67748E]">Berdasarkan saldo bersih donasi.</p>
          </div>
          <div className="divide-y divide-slate-100 px-6">
            {topCreators.length > 0 ? topCreators.map((creator, index) => (
              <div key={creator.username} className="flex items-center gap-3 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-xs font-bold text-[#2563EB]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#10264D]">{creator.displayName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8392AB]">@{creator.username}</p>
                </div>
                <p className="text-right text-xs font-bold tabular-nums text-[#10264D]">{formatRupiah(creator.totalDonation)}</p>
              </div>
            )) : (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-[#10264D]">Belum ada data</p>
                <p className="mt-1 text-xs text-[#8392AB]">Kreator tampil setelah donasi berhasil.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-panel-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-[#10264D]">Transaksi terbaru</h2>
            <p className="mt-1 text-xs text-[#67748E]">Rincian donasi dan biaya layanan terbaru.</p>
          </div>
          <span className="text-xs font-medium text-[#8392AB]">{recentDonations.length} transaksi</span>
        </div>
        {recentDonations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table w-full min-w-[820px] text-left">
              <thead><tr><th className="px-6 py-3.5">Donatur</th><th className="px-4 py-3.5">Kreator</th><th className="px-4 py-3.5 text-right">Nominal</th><th className="px-4 py-3.5 text-right">Biaya</th><th className="px-4 py-3.5 text-right">Bersih</th><th className="px-4 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Waktu</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentDonations.map((donation) => {
                  const status = donationStatus[donation.status] || donationStatus.PENDING;
                  return (
                    <tr key={donation._id || donation.id}>
                      <td className="px-6 py-4"><p className="max-w-[170px] truncate text-sm font-semibold text-[#10264D]">{donation.name || 'Anonim'}</p><p className="mt-0.5 max-w-[170px] truncate text-[11px] text-[#8392AB]">{donation.message || 'Tanpa pesan'}</p></td>
                      <td className="px-4 py-4 text-sm text-[#67748E]">@{donation.createdByUsername || '-'}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-[#10264D]">{formatRupiah(donation.amount)}</td>
                      <td className="px-4 py-4 text-right text-sm tabular-nums text-[#8392AB]">-{formatRupiah(donation.serviceFeeAmount || 0)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-[#10264D]">{formatRupiah(donation.netAmount ?? donation.amount)}</td>
                      <td className="px-4 py-4"><span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}>{status.label}</span></td>
                      <td className="px-6 py-4 text-right text-xs text-[#8392AB]">{formatDate(donation.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="px-6 py-14 text-center text-sm text-[#8392AB]">Belum ada transaksi.</div>}
      </section>
    </div>
  );
}
