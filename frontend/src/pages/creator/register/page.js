'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
    description: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialUsername = params.get('username') || params.get('u');
      if (initialUsername) {
        const clean = initialUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        setFormData(prev => ({
          ...prev,
          username: clean,
          displayName: clean.charAt(0).toUpperCase() + clean.slice(1)
        }));
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUsernameChange = (e) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setFormData({
      ...formData,
      username: clean
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username || !formData.displayName || !formData.email || !formData.password) {
      toast.error('Semua field bertanda * wajib diisi!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter!');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid!');
      setLoading(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username hanya boleh berisi huruf, angka, underscore, dan strip!');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username minimal 3 karakter!');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', formData);
      
      if (response.data.success) {
        toast.success('Pendaftaran berhasil! Silakan masuk.');
        router.push('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jd-app-shell flex flex-col items-center justify-center text-[#0F2A5F] font-sans antialiased p-4 sm:p-6">
      {/* Kartu Register Sederhana & Bersih */}
      <div className="jd-surface w-full max-w-md p-6 sm:p-8">
        
        {/* Header Bersih */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 transition hover:opacity-85">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-10 w-10 object-contain" />
            <span className="text-xl font-black tracking-tight text-[#0F2A5F]">Johen Donate</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#0F2A5F]">
            Daftar Akun Baru
          </h1>
          <p className="mt-1 text-xs text-[#526987]">
            Buat halaman apresiasi untuk karyamu dalam 1 menit
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border-2 border-red-500 bg-red-50 p-2.5 text-xs font-bold text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Pendaftaran */}
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F] mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B] select-none">@</span>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="namamu"
                value={formData.username}
                onChange={handleUsernameChange}
                className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white pl-8 pr-3.5 py-2 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
              />
            </div>
            {formData.username && (
              <p className="mt-1 text-[11px] font-mono text-[#526987]">
                localhost:3000/donate/{formData.username}
              </p>
            )}
          </div>

          {/* Nama Tampilan */}
          <div>
            <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F] mb-1">
              Nama Tampilan <span className="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="Nama Lengkap atau Channel"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3.5 py-2 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3.5 py-2 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
            />
          </div>

          {/* Password dengan Show/Hide */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F]">
                Password <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] ${formData.password.length >= 6 ? 'text-green-600 font-bold' : 'text-[#64748B]'}`}>
                Min. 6 karakter
              </span>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white pl-3.5 pr-10 py-2 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F2A5F] p-1 transition cursor-pointer"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="jd-btn-primary w-full py-2.5 text-sm font-extrabold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <span>Daftar Sekarang</span>
            )}
          </button>

        </form>

        {/* Tautan Masuk */}
        <div className="mt-6 pt-4 border-t border-[#DBEAFE] text-center">
          <p className="text-xs text-[#526987]">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-extrabold text-[#0F2A5F] underline hover:text-[#607697]">
              Masuk di sini ↗
            </Link>
          </p>
        </div>
      </div>

      {/* Navigasi Balik ke Beranda */}
      <div className="mt-4 text-center">
        <Link href="/" className="text-xs font-semibold text-[#64748B] hover:text-[#0F2A5F] hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
