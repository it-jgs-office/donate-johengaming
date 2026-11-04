import Card from '../atoms/Card';

export default function StatsCard({ title, value, icon, color = 'blue' }) {
  return (
    <Card className="p-5 sm:p-6 flex items-center justify-between gap-4 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#2563EB]/10" aria-hidden="true" />
      <div className="relative">
        <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.12em]">{title}</p>
        <p className="text-[#10264D] text-3xl font-black mt-2 tabular-nums">{value}</p>
      </div>
    </Card>
  );
}
