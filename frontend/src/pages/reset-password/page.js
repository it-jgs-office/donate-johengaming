"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('otp'); // 'otp' | 'password'
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read token/email from URL on client-side to avoid SSR hooks
    try {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('token') || '';
      const e = p.get('email') || '';
      setToken(t);
      setEmail(e);
      if (t && e) {
        setStep('password'); // If both token and email are in URL, go directly to password step
      } else if (!e) {
        // If no email in URL, redirect to forgot-password
        toast.error('Email tidak ditemukan. Silakan mulai dari forgot password.');
        router.push('/forgot-password');
      }
    } catch (err) {
      // ignore
    }
  }, [router]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return toast.error('Masukkan kode OTP');
    if (!email) return toast.error('Email tidak ditemukan');

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, token });
      toast.success('Kode OTP valid! Silakan masukkan password baru.');
      setStep('password');
    } catch (err) {
      const msg = err.response?.data?.error || 'Kode OTP tidak valid';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Password tidak cocok');
    if (password.length < 6) return toast.error('Password minimal 6 karakter');

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', { email, token, password });
      toast.success(res.data.message || 'Password berhasil diubah');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengganti password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jd-app-shell jd-auth-shell flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="jd-surface jd-auth-card w-full max-w-md space-y-8 p-6 sm:p-8">
        <div>
          <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Reset Password</h2>
          <p className="mt-2 text-center text-xs text-[#64748B] sm:text-sm">
            {step === 'otp' ? 'Masukkan kode OTP yang dikirim ke email Anda.' : 'Masukkan password baru untuk akun Anda.'}
          </p>
        </div>

        {email && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2">
            <svg className="h-5 w-5 flex-shrink-0 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">Email tujuan reset:</span>
            <span className="min-w-0 flex-1 break-all text-sm text-[#10264D]">{email}</span>
            <span className="ml-1 h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          </div>
        )}

        {step === 'otp' ? (
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Kode OTP</label>
              <input 
                type="text" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                required 
                className="jd-input w-full px-3 py-3 text-sm"
                placeholder="Masukkan 6 digit kode OTP"
                maxLength={6}
              />
            </div>

            <div>
              <button type="submit" disabled={loading} className="jd-btn-primary group relative flex w-full justify-center px-4 py-3 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Password Baru</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="jd-input w-full px-3 py-3 text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Konfirmasi Password</label>
              <input 
                type="password" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
                className="jd-input w-full px-3 py-3 text-sm"
                placeholder="Ulangi password baru"
              />
            </div>

            <div>
              <button type="submit" disabled={loading} className="jd-btn-primary group relative flex w-full justify-center px-4 py-3 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep('otp')} 
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                ← Kembali ke OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
