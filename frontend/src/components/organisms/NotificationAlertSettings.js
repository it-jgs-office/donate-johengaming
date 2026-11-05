"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ALERT_FONT_FAMILIES, ALERT_FONT_OPTIONS } from '@/utils/alertFonts';
import { AMOUNT_STYLE_OPTIONS, getAmountStyle } from '@/utils/alertStyles';
import AlertParticles, { ALERT_PARTICLE_OPTIONS } from '@/components/atoms/AlertParticles';

const DEFAULT_STYLE = {
  backgroundColor: 'transparent',
  borderColor: '#2563EB',
  textColor: '#0F2A5F',
  amountColor: '#2563EB',
  backgroundImage: '',
  backgroundImageOpacity: 0.62,
  fontFamily: 'modern',
  amountStyle: 'solid',
  particleStyle: 'confetti',
  messagePrefix: '',
  messageSuffix: '',
  decorations: [],
};

const CUSTOM_STYLE = {
  ...DEFAULT_STYLE,
  backgroundColor: '#0B1F3A',
  textColor: '#FFFFFF',
  amountColor: '#60A5FA',
};

const isHexColor = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);
const MESSAGE_DECORATIONS = [
  { label: 'Tanpa hiasan', prefix: '', suffix: '' },
  { label: '✨ Kilau', prefix: '✨', suffix: '✨' },
  { label: '💙 Hati', prefix: '💙 ', suffix: ' 💙' },
  { label: '🔥 Api', prefix: '🔥 ', suffix: ' 🔥' },
  { label: '⭐ Bintang', prefix: '⭐ ', suffix: ' ⭐' },
  { label: '🎉 Pesta', prefix: '🎉 ', suffix: ' 🎉' },
];

const normalizeAlertStyle = (value = {}) => {
  const style = { ...CUSTOM_STYLE, ...value };

  if (Array.isArray(value.decorations)) {
    style.decorations = value.decorations;
  } else if (value.decorationImage) {
    style.decorations = [{
      id: 'legacy',
      image: value.decorationImage,
      imagePath: value.decorationImagePath,
      x: value.decorationX ?? 82,
      y: value.decorationY ?? 50,
      size: value.decorationSize ?? 18,
      rotation: value.decorationRotation ?? 0,
      flipX: value.decorationFlipX ?? false,
      flipY: value.decorationFlipY ?? false,
    }];
  }

  return style;
};

export default function NotificationAlertSettings({ username }) {
  const [alertStyle, setAlertStyle] = useState(CUSTOM_STYLE);
  const [appearanceMode, setAppearanceMode] = useState('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDecoration, setUploadingDecoration] = useState(false);
  const [selectedDecorationId, setSelectedDecorationId] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const response = await api.get(`/api/overlay-config/notifications?username=${encodeURIComponent(username)}`);
        if (active) {
          const style = normalizeAlertStyle(response.data?.alertStyle || {});
          setAlertStyle(style);
          setAppearanceMode(response.data?.alertMode === 'custom' ? 'custom' : 'default');
          setSelectedDecorationId(style.decorations[0]?.id || null);
        }
      } catch (error) {
        console.error('Gagal memuat tampilan notifikasi:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (username) loadConfig();

    return () => {
      active = false;
    };
  }, [username]);

  const displayedStyle = appearanceMode === 'custom' ? alertStyle : DEFAULT_STYLE;

  const previewStyle = useMemo(() => {
    return {
      backgroundColor: displayedStyle.backgroundColor,
      borderColor: displayedStyle.borderColor,
      fontFamily: ALERT_FONT_FAMILIES[displayedStyle.fontFamily] || ALERT_FONT_FAMILIES.modern,
    };
  }, [displayedStyle]);

  const previewImageStyle = useMemo(() => {
    const image = String(displayedStyle.backgroundImage || '').trim();
    if (!image) return null;

    return {
      backgroundImage: `url("${image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: Math.min(1, Math.max(0, Number(displayedStyle.backgroundImageOpacity) || 0)),
    };
  }, [displayedStyle.backgroundImage, displayedStyle.backgroundImageOpacity]);

  const updateStyle = (field, value) => {
    setAlertStyle((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (appearanceMode === 'custom' && !['backgroundColor', 'borderColor', 'textColor', 'amountColor'].every((field) => isHexColor(alertStyle[field]))) {
      toast.error('Gunakan warna hex lengkap, misalnya #2563EB');
      return;
    }

    try {
      setSaving(true);
      await api.put('/api/overlay-config', {
        notifications: {
          alertMode: appearanceMode,
          alertStyle,
        },
      });
      toast.success('Tampilan notifikasi berhasil disimpan');
    } catch (error) {
      console.error('Gagal menyimpan tampilan notifikasi:', error);
      if (error.response?.status !== 401) {
        toast.error('Tampilan notifikasi gagal disimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundUpload = async (event) => {
    const image = event.target.files?.[0];
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    try {
      setUploading(true);
      const response = await api.post('/api/user/upload-notification-background', formData);
      setAlertStyle((current) => ({
        ...current,
        backgroundImage: response.data.backgroundImage,
        backgroundImagePath: response.data.backgroundImagePath,
      }));
      toast.success('Gambar latar berhasil diunggah');
    } catch (error) {
      console.error('Gagal mengunggah gambar latar:', error);
      toast.error(error.response?.data?.message || 'Gambar latar gagal diunggah');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  };

  const handleDecorationUpload = async (event) => {
    const image = event.target.files?.[0];
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    try {
      setUploadingDecoration(true);
      const response = await api.post('/api/user/upload-notification-decoration', formData);
      const decoration = response.data.decoration;
      setAlertStyle((current) => ({ ...current, decorations: [...current.decorations, decoration] }));
      setSelectedDecorationId(decoration.id);
      toast.success('Foto tambahan berhasil diunggah');
    } catch (error) {
      console.error('Gagal mengunggah foto tambahan:', error);
      toast.error(error.response?.data?.message || 'Foto tambahan gagal diunggah');
    } finally {
      event.target.value = '';
      setUploadingDecoration(false);
    }
  };

  const handleDecorationDelete = async () => {
    if (!selectedDecorationId) return;

    try {
      await api.delete(`/api/user/notification-decoration/${encodeURIComponent(selectedDecorationId)}`);
      const decorations = alertStyle.decorations.filter((decoration) => decoration.id !== selectedDecorationId);
      setAlertStyle((current) => ({ ...current, decorations }));
      setSelectedDecorationId(decorations[0]?.id || null);
      toast.success('Foto tambahan berhasil dihapus');
    } catch (error) {
      console.error('Gagal menghapus foto tambahan:', error);
      toast.error('Foto tambahan gagal dihapus');
    }
  };

  const updateSelectedDecoration = (changes) => {
    if (!selectedDecorationId) return;
    setAlertStyle((current) => ({
      ...current,
      decorations: current.decorations.map((decoration) => (
        decoration.id === selectedDecorationId ? { ...decoration, ...changes } : decoration
      )),
    }));
  };

  const moveDecoration = (event, decorationId) => {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    setAlertStyle((current) => ({
      ...current,
      decorations: current.decorations.map((decoration) => (
        decoration.id === decorationId ? { ...decoration, x, y } : decoration
      )),
    }));
  };

  const handleDecorationPointerDown = (event, decorationId) => {
    event.preventDefault();
    setSelectedDecorationId(decorationId);
    event.currentTarget.setPointerCapture(event.pointerId);
    moveDecoration(event, decorationId);
  };

  const handleDecorationPointerMove = (event, decorationId) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moveDecoration(event, decorationId);
  };

  const selectedDecoration = alertStyle.decorations.find((decoration) => decoration.id === selectedDecorationId)
    || alertStyle.decorations[0]
    || null;

  if (loading) {
    return <div className="jd-surface p-5 text-center text-xs font-bold text-[#607697]">Memuat tampilan notifikasi...</div>;
  }

  const colorFields = [
    ['backgroundColor', 'Warna latar'],
    ['borderColor', 'Warna border'],
    ['textColor', 'Warna teks'],
    ['amountColor', 'Warna nominal'],
  ];

  return (
    <section className="jd-surface overflow-hidden p-5 sm:p-6">
      <div className="mb-5 border-b-2 border-[#0F2A5F]/10 pb-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#607697]">Notifikasi Saweran</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#526987]">Pilih tampilan sederhana atau atur desain alert sendiri.</p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAppearanceMode('default')}
            className={`rounded-2xl border-2 p-4 text-left transition ${appearanceMode === 'default' ? 'border-[#2563EB] bg-[#EFF6FF] shadow-[2px_2px_0px_#2563EB]' : 'border-[#BFDBFE] bg-white hover:bg-[#F7FCFF]'}`}
          >
            <span className="block text-sm font-black text-[#0F2A5F]">Tampilan default</span>
            <span className="mt-1 block text-xs font-medium leading-relaxed text-[#526987]">Bersih, transparan, dan siap dipakai tanpa gambar latar.</span>
          </button>
          <button
            type="button"
            onClick={() => setAppearanceMode('custom')}
            className={`rounded-2xl border-2 p-4 text-left transition ${appearanceMode === 'custom' ? 'border-[#2563EB] bg-[#EFF6FF] shadow-[2px_2px_0px_#2563EB]' : 'border-[#BFDBFE] bg-white hover:bg-[#F7FCFF]'}`}
          >
            <span className="block text-sm font-black text-[#0F2A5F]">Tampilan custom</span>
            <span className="mt-1 block text-xs font-medium leading-relaxed text-[#526987]">Atur warna, font, gambar, hiasan, dan animasi sendiri.</span>
          </button>
        </div>

        {appearanceMode === 'custom' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="mb-1.5 block text-xs font-extrabold text-[#0F2A5F]">Gambar atau GIF latar</span>
              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2563EB] bg-[#F0F7FF] px-3.5 py-2.5 text-xs font-extrabold text-[#0F2A5F] transition hover:bg-[#DBEAFE]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleBackgroundUpload}
                  disabled={uploading}
                  className="sr-only"
                />
                {uploading ? 'Mengunggah...' : alertStyle.backgroundImage ? 'Ganti gambar latar' : 'Pilih gambar latar'}
              </label>
              <span className="mt-1.5 block text-[11px] font-medium text-[#607697]">PNG, JPG, WebP, atau GIF hingga 5 MB.</span>
            </div>

            <label>
              <span className="mb-1.5 flex items-center justify-between text-xs font-extrabold text-[#0F2A5F]">
                Opasitas gambar
                <span className="font-mono text-[#2563EB]">{Math.round((Number(alertStyle.backgroundImageOpacity) || 0) * 100)}%</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={alertStyle.backgroundImageOpacity}
                onChange={(event) => updateStyle('backgroundImageOpacity', Number(event.target.value))}
                className="mt-3 w-full accent-[#2563EB]"
              />
              <span className="mt-2 block text-[11px] font-medium text-[#607697]">0% menyembunyikan gambar, 100% tampak penuh.</span>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-extrabold text-[#0F2A5F]">Font teks alert</span>
              <select
                value={alertStyle.fontFamily}
                onChange={(event) => updateStyle('fontFamily', event.target.value)}
                className="min-h-11 w-full rounded-xl border-2 border-[#0F2A5F] bg-[#F7FCFF] px-3 text-sm font-bold text-[#0F2A5F] outline-none focus:bg-white"
                style={{ fontFamily: ALERT_FONT_FAMILIES[alertStyle.fontFamily] || ALERT_FONT_FAMILIES.modern }}
              >
                {ALERT_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.family }}>
                    {font.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-[11px] font-medium text-[#607697]">Dipakai untuk nominal, nama, dan pesan.</span>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-extrabold text-[#0F2A5F]">Style nominal</span>
              <select
                value={alertStyle.amountStyle}
                onChange={(event) => updateStyle('amountStyle', event.target.value)}
                className="min-h-11 w-full rounded-xl border-2 border-[#0F2A5F] bg-[#F7FCFF] px-3 text-sm font-bold text-[#0F2A5F] outline-none focus:bg-white"
              >
                {AMOUNT_STYLE_OPTIONS.map((style) => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
              <span className="mt-2 block text-[11px] font-medium text-[#607697]">Hanya mengubah tampilan nominal harga.</span>
            </label>
          </div>

          <div className="rounded-2xl border-2 border-[#0F2A5F]/15 bg-[#F7FCFF] p-4">
            <div className="mb-3">
              <p className="text-xs font-extrabold text-[#0F2A5F]">Animasi partikel</p>
              <p className="mt-1 text-[11px] font-medium text-[#607697]">Pilih efek yang bergerak di dalam kartu notifikasi.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {ALERT_PARTICLE_OPTIONS.map((particle) => (
                <button
                  key={particle.value}
                  type="button"
                  onClick={() => updateStyle('particleStyle', particle.value)}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-extrabold transition ${alertStyle.particleStyle === particle.value ? 'border-[#2563EB] bg-[#DBEAFE] text-[#0F2A5F]' : 'border-[#BFDBFE] bg-white text-[#526987] hover:bg-[#EFF6FF]'}`}
                >
                  <span className="text-base" aria-hidden="true">{particle.icon}</span>
                  {particle.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#0F2A5F]/15 bg-[#F7FCFF] p-4">
            <div className="mb-3">
              <p className="text-xs font-extrabold text-[#0F2A5F]">Hiasan pesan donatur</p>
              <p className="mt-1 text-[11px] font-medium text-[#607697]">Tambahkan emoji atau teks otomatis sebelum dan sesudah pesan.</p>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {MESSAGE_DECORATIONS.map((decoration) => {
                const selected = alertStyle.messagePrefix === decoration.prefix && alertStyle.messageSuffix === decoration.suffix;

                return (
                  <button
                    key={decoration.label}
                    type="button"
                    onClick={() => setAlertStyle((current) => ({
                      ...current,
                      messagePrefix: decoration.prefix,
                      messageSuffix: decoration.suffix,
                    }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${selected ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-[#BFDBFE] bg-white text-[#0F2A5F] hover:bg-[#DBEAFE]'}`}
                  >
                    {decoration.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#0F2A5F]">Awalan custom</span>
                <input
                  type="text"
                  value={alertStyle.messagePrefix}
                  onChange={(event) => updateStyle('messagePrefix', event.target.value)}
                  maxLength={24}
                  placeholder="Contoh: ✨"
                  className="min-h-11 w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3 text-sm font-semibold text-[#0F2A5F] outline-none placeholder:text-[#94A3B8]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#0F2A5F]">Akhiran custom</span>
                <input
                  type="text"
                  value={alertStyle.messageSuffix}
                  onChange={(event) => updateStyle('messageSuffix', event.target.value)}
                  maxLength={24}
                  placeholder="Contoh: ✨"
                  className="min-h-11 w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3 text-sm font-semibold text-[#0F2A5F] outline-none placeholder:text-[#94A3B8]"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {colorFields.map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-1.5 block text-xs font-extrabold text-[#0F2A5F]">{label}</span>
                <span className="flex h-11 items-center gap-2 rounded-xl border-2 border-[#0F2A5F] bg-[#F7FCFF] px-2.5">
                  <input
                    type="color"
                    value={alertStyle[field]}
                    onChange={(event) => updateStyle(field, event.target.value.toUpperCase())}
                    className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label={label}
                  />
                  <input
                    type="text"
                    value={alertStyle[field]}
                    onChange={(event) => updateStyle(field, event.target.value)}
                    maxLength={7}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs font-bold uppercase text-[#0F2A5F] outline-none"
                    aria-label={`${label} hex`}
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-[#0F2A5F]/15 bg-[#F7FCFF] p-4">
            <div className="mb-3">
              <p className="text-xs font-extrabold text-[#0F2A5F]">Foto tambahan</p>
              <p className="mt-1 text-[11px] font-medium text-[#607697]">Tambahkan beberapa dekorasi, pilih fotonya, lalu geser langsung pada preview.</p>
            </div>

            {alertStyle.decorations.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {alertStyle.decorations.map((decoration, index) => (
                  <button
                    key={decoration.id}
                    type="button"
                    onClick={() => setSelectedDecorationId(decoration.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-xs font-extrabold transition ${selectedDecoration?.id === decoration.id ? 'border-[#2563EB] bg-[#DBEAFE] text-[#0F2A5F]' : 'border-[#BFDBFE] bg-white text-[#526987]'}`}
                  >
                    <img src={decoration.image} alt="" className="h-7 w-7 rounded-md object-contain" />
                    Foto {index + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#2563EB] bg-white px-4 text-xs font-extrabold text-[#0F2A5F] transition hover:bg-[#DBEAFE]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleDecorationUpload}
                  disabled={uploadingDecoration}
                  className="sr-only"
                />
                {uploadingDecoration ? 'Mengunggah...' : 'Tambah foto'}
              </label>

              <label>
                <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#0F2A5F]">
                  Ukuran foto
                  <span className="font-mono text-[#2563EB]">{Math.round(Number(selectedDecoration?.size) || 18)}%</span>
                </span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={selectedDecoration?.size ?? 18}
                  onChange={(event) => updateSelectedDecoration({ size: Number(event.target.value) })}
                  disabled={!selectedDecoration}
                  className="w-full accent-[#2563EB]"
                />
              </label>

              <label>
                <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#0F2A5F]">
                  Rotasi
                  <span className="font-mono text-[#2563EB]">{Math.round(Number(selectedDecoration?.rotation) || 0)}°</span>
                </span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedDecoration?.rotation ?? 0}
                  onChange={(event) => updateSelectedDecoration({ rotation: Number(event.target.value) })}
                  disabled={!selectedDecoration}
                  className="w-full accent-[#2563EB]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSelectedDecoration({ flipX: !selectedDecoration?.flipX })}
                  disabled={!selectedDecoration}
                  className={`min-h-10 rounded-xl border-2 px-2 text-[11px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40 ${selectedDecoration?.flipX ? 'border-[#2563EB] bg-[#DBEAFE] text-[#0F2A5F]' : 'border-[#0F2A5F] bg-white text-[#0F2A5F]'}`}
                >
                  Cermin ↔
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedDecoration({ flipY: !selectedDecoration?.flipY })}
                  disabled={!selectedDecoration}
                  className={`min-h-10 rounded-xl border-2 px-2 text-[11px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40 ${selectedDecoration?.flipY ? 'border-[#2563EB] bg-[#DBEAFE] text-[#0F2A5F]' : 'border-[#0F2A5F] bg-white text-[#0F2A5F]'}`}
                >
                  Cermin ↕
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedDecoration({ x: 50, y: 50, rotation: 0, flipX: false, flipY: false })}
                  disabled={!selectedDecoration}
                  className="min-h-10 rounded-xl border-2 border-[#0F2A5F] bg-white px-2 text-[11px] font-extrabold text-[#0F2A5F] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleDecorationDelete}
                  disabled={!selectedDecoration}
                  className="min-h-10 rounded-xl border-2 border-red-600 bg-red-50 px-2 text-[11px] font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        <div className={`relative flex aspect-[720/220] min-h-[120px] w-full items-center justify-center overflow-hidden rounded-[18px] border-[3px] p-2 text-center shadow-[0_8px_22px_rgba(15,42,95,0.12)] sm:min-h-0 sm:rounded-[26px] sm:border-[4px] sm:p-4 ${appearanceMode === 'default' ? 'bg-[linear-gradient(45deg,#EFF6FF_25%,transparent_25%,transparent_75%,#EFF6FF_75%),linear-gradient(45deg,#EFF6FF_25%,transparent_25%,transparent_75%,#EFF6FF_75%)] bg-[length:22px_22px] bg-[position:0_0,11px_11px]' : ''}`} ref={previewRef} style={previewStyle}>
          {previewImageStyle && <div className="absolute inset-0" style={previewImageStyle} />}
          {displayedStyle.decorations.map((decoration, index) => (
            <img
              key={decoration.id}
              src={decoration.image}
              alt={`Foto tambahan ${index + 1}`}
              draggable="false"
              onPointerDown={(event) => handleDecorationPointerDown(event, decoration.id)}
              onPointerMove={(event) => handleDecorationPointerMove(event, decoration.id)}
              onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
              className="absolute cursor-grab select-none object-contain active:cursor-grabbing"
              style={{
                zIndex: selectedDecoration?.id === decoration.id ? 15 : 10,
                left: `${decoration.x}%`,
                top: `${decoration.y}%`,
                width: `${decoration.size}%`,
                maxHeight: '90%',
                transform: `translate(-50%, -50%) rotate(${decoration.rotation}deg) scaleX(${decoration.flipX ? -1 : 1}) scaleY(${decoration.flipY ? -1 : 1})`,
                touchAction: 'none',
                filter: selectedDecoration?.id === decoration.id ? 'drop-shadow(0 0 3px #2563EB)' : undefined,
              }}
            />
          ))}
          <AlertParticles type={displayedStyle.particleStyle} color={displayedStyle.amountColor} />
          <div className="relative z-20 min-w-0 max-w-full">
            <p className="whitespace-nowrap text-3xl font-black leading-none sm:text-7xl" style={getAmountStyle(displayedStyle.amountStyle, displayedStyle.amountColor, displayedStyle.textColor)}>Rp 50.000</p>
            <p className="mt-1 truncate text-base font-black leading-tight sm:mt-3 sm:text-3xl" style={{ color: displayedStyle.textColor }}>Nama Donatur</p>
            <p className="mt-1 truncate text-xs font-semibold sm:mt-3 sm:text-xl" style={{ color: displayedStyle.textColor, opacity: 0.9 }}>{displayedStyle.messagePrefix}Hallo bang{displayedStyle.messageSuffix}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t-2 border-[#0F2A5F]/10 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white shadow-[2px_2px_0px_#0F2A5F] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? 'Menyimpan...' : 'Simpan tampilan'}
        </button>
      </div>
    </section>
  );
}
