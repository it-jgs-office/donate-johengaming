'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

const DEFAULT_RULES = {
  under10000: 15,
  from10000: 30,
  from20000: 60,
  from50000: 120,
  from100000: 300,
};

const DURATION_FIELDS = [
  ['under10000', 'Di bawah Rp 10.000'],
  ['from10000', 'Mulai Rp 10.000'],
  ['from20000', 'Mulai Rp 20.000'],
  ['from50000', 'Mulai Rp 50.000'],
  ['from100000', 'Mulai Rp 100.000'],
];

const secondsToMinutes = (seconds) => Number((Number(seconds || 0) / 60).toFixed(2));

export default function MediaShareSettings({ username }) {
  const [durationRules, setDurationRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const response = await api.get(`/api/overlay-config?username=${encodeURIComponent(username)}`);
        if (active) {
          setDurationRules({ ...DEFAULT_RULES, ...(response.data?.mediashare?.durationRules || {}) });
        }
      } catch (error) {
        console.error('Gagal memuat pengaturan durasi Media Share:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (username) loadSettings();
    return () => {
      active = false;
    };
  }, [username]);

  const updateDuration = (key, minutes) => {
    const seconds = Math.max(5, Math.min(3600, Math.round((Number(minutes) || 0) * 60)));
    setDurationRules((current) => ({ ...current, [key]: seconds }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/overlay-config', { mediashare: { durationRules } });
      toast.success('Durasi Media Share berhasil disimpan');
    } catch (error) {
      console.error('Gagal menyimpan durasi Media Share:', error);
      toast.error('Durasi Media Share gagal disimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl bg-[#F7FCFF] p-5 text-center text-xs font-bold text-[#607697]">Memuat durasi Media Share...</div>;
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DURATION_FIELDS.map(([key, label]) => (
          <label key={key} className="rounded-xl border-2 border-[#BFDBFE] bg-[#F7FCFF] p-4">
            <span className="block min-h-8 text-xs font-extrabold leading-tight text-[#0F2A5F]">{label}</span>
            <span className="mt-2 flex items-center overflow-hidden rounded-xl border-2 border-[#0F2A5F] bg-white">
              <input
                type="number"
                min="0.1"
                max="60"
                step="0.25"
                value={secondsToMinutes(durationRules[key])}
                onChange={(event) => updateDuration(key, event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-black text-[#0F2A5F] outline-none"
              />
              <span className="border-l-2 border-[#0F2A5F]/10 bg-[#EFF6FF] px-2.5 py-2 text-[11px] font-extrabold text-[#526987]">menit</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t-2 border-[#0F2A5F]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#607697]">Berlaku untuk donasi Media Share baru setelah pengaturan disimpan.</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white shadow-[2px_2px_0px_#0F2A5F] transition hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan durasi'}
        </button>
      </div>
    </div>
  );
}
