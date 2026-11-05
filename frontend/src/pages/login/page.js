// src/app/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import toast from 'react-hot-toast';
import RecaptchaCheckbox from '@/components/atoms/RecaptchaCheckbox';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberBrowser, setRememberBrowser] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user.userType === 'admin' || user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expires_at');
        localStorage.removeItem('remember_browser');
        setChecking(false);
      }
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      toast.error('Email dan password wajib diisi!');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid!');
      setLoading(false);
      return;
    }

    if (!recaptchaToken) {
      toast.error('Centang reCAPTCHA terlebih dahulu!');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/auth/login", { email, password, remember: rememberBrowser, recaptchaToken });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token_expires_at", String(Date.now() + (res.data.expires_in * 1000)));
      localStorage.setItem("remember_browser", rememberBrowser ? "1" : "0");
      toast.success('Login berhasil!');
      
      if (res.data.user.userType === "admin" || res.data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setRecaptchaToken('');
      setRecaptchaResetKey((current) => current + 1);

      if (err.response?.data?.verification_required) {
        router.push(`/verify-email?email=${encodeURIComponent(err.response.data.email || email)}`);
        return;
      }

      const errorMessage = err.response?.data?.error || "Login gagal. Periksa kembali email dan password.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null;
  }

  return (
    <div className="jd-app-shell jd-auth-shell flex flex-col items-center justify-center text-[#0F2A5F] font-sans antialiased p-4 sm:p-6">
      {/* Kartu Login Sederhana & Bersih */}
      <div className="jd-surface jd-auth-card w-full max-w-md p-6 sm:p-8">
        
        {/* Header Bersih */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 transition hover:opacity-85">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-10 w-10 object-contain" />
            <span className="text-xl font-black tracking-tight text-[#0F2A5F]">Johen Donate</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#0F2A5F]">
            Masuk ke Akun
          </h1>
          <p className="mt-1 text-xs text-[#526987]">
            Masukkan email dan password untuk mengakses dashboard
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

        {/* Form Input */}
        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F] mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
            />
          </div>

          {/* Password dengan Show/Hide */}
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-[#0F2A5F]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#64748B] hover:text-[#0F2A5F] hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-[#0F2A5F] bg-white pl-3.5 pr-10 py-2.5 text-sm font-semibold text-[#0F2A5F] placeholder:text-[#94A3B8] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
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

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#DBEAFE] bg-[#f7fcff] px-3 py-2.5">
            <input
              type="checkbox"
              checked={rememberBrowser}
              onChange={(e) => setRememberBrowser(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#0F2A5F]"
            />
            <span>
              <span className="block text-xs font-bold text-[#0F2A5F]">Ingat saya di browser ini</span>
              <span className="block text-[11px] text-[#64748B]">Tetap login selama 30 hari di perangkat ini.</span>
            </span>
          </label>

          <RecaptchaCheckbox onChange={setRecaptchaToken} resetKey={recaptchaResetKey} />

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={loading || !recaptchaToken}
            className="jd-btn-primary w-full py-2.5 text-sm font-extrabold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk ke Dashboard</span>
            )}
          </button>

        </form>

        {/* Tautan Daftar */}
        <div className="mt-6 pt-4 border-t border-[#DBEAFE] text-center">
          <p className="text-xs text-[#526987]">
            Belum punya akun?{' '}
            <Link href="/creator/register" className="font-extrabold text-[#0F2A5F] underline hover:text-[#607697]">
              Daftar sekarang ↗
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
