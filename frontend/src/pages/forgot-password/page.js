"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const requestOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid!');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('Kode OTP telah dikirim ke email Anda');
      // Redirect user to the reset page where they can enter OTP + new password
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Gagal mengirim kode OTP';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Password tidak cocok');
    if (password.length < 6) return toast.error('Password minimal 6 karakter');

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', { email, token: otp, password });
      toast.success(res.data.message || 'Password berhasil diubah');
      setTimeout(() => router.push('/login'), 1200);
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
          <div className="flex justify-center mb-4">
            <img src="/logo-blue.png" alt="Logo Johen Donate" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight text-[#10264D] sm:text-3xl">Lupa Password</h2>
          <p className="mt-2 text-center text-xs text-[#64748B] sm:text-sm">Masukkan email Anda untuk menerima kode OTP</p>
        </div>

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={requestOtp}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#10264D]">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="jd-input relative block w-full px-3 py-2 text-sm sm:py-3 sm:text-base" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <button type="submit" disabled={loading} className="jd-btn-primary group relative flex w-full justify-center px-4 py-3 text-sm font-semibold disabled:opacity-50 sm:py-4 sm:text-base">{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</button>
            </div>

            <div className="flex flex-col items-start gap-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
              <Link href="/login" className="text-[#2563EB] hover:text-[#60A5FA] underline font-mono">← Kembali ke login</Link>
              <Link href="/creator/register" className="text-[#2563EB] hover:text-[#60A5FA] underline font-mono">Belum punya akun?</Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={verifyOtp}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Kode OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="jd-input w-full px-3 py-2 sm:py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Password Baru</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="jd-input w-full px-3 py-2 sm:py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#10264D]">Konfirmasi Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="jd-input w-full px-3 py-2 sm:py-3" />
            </div>
            <div>
              <button type="submit" disabled={loading} className="jd-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
            </div>
            <div className="text-xs text-[#64748B]">Belum menerima kode? <button type="button" onClick={requestOtp} className="font-semibold text-[#2563EB] underline">Kirim ulang</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
