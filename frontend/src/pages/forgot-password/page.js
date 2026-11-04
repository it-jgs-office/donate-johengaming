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
    <div className="jd-public-page flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="jd-surface w-full max-w-md space-y-8 p-6 sm:p-8">
        <div>
          <div className="flex justify-center mb-4">
            <img src="/logo-blue.png" alt="Logo Johen Donate" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-[#2563EB] font-mono">Lupa Password</h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-[#2563EB]/80">Masukkan email Anda untuk menerima kode OTP</p>
        </div>

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={requestOtp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2563EB] font-mono mb-2">Email Address</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="relative block w-full px-3 py-2 sm:py-3 border border-[#2563EB] placeholder-[#2563EB]/50 text-[#2563EB] bg-[#0F2A5F] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm sm:text-base font-mono" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-[#0F2A5F] bg-[#2563EB] hover:bg-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 font-mono transition-all duration-200">{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</button>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <Link href="/login" className="text-[#2563EB] hover:text-[#60A5FA] underline font-mono">← Kembali ke login</Link>
              <Link href="/creator/register" className="text-[#2563EB] hover:text-[#60A5FA] underline font-mono">Belum punya akun?</Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={verifyOtp}>
            <div>
              <label className="block text-sm font-medium text-[#2563EB] font-mono mb-2">Kode OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full px-3 py-2 sm:py-3 border border-[#2563EB] placeholder-[#2563EB]/50 text-[#2563EB] bg-[#0F2A5F] rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2563EB] font-mono mb-2">Password Baru</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 sm:py-3 border border-[#2563EB] placeholder-[#2563EB]/50 text-[#2563EB] bg-[#0F2A5F] rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2563EB] font-mono mb-2">Konfirmasi Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full px-3 py-2 sm:py-3 border border-[#2563EB] placeholder-[#2563EB]/50 text-[#2563EB] bg-[#0F2A5F] rounded-md" />
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full py-3 text-[#0F2A5F] bg-[#2563EB] rounded-md">{loading ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
            </div>
            <div className="text-xs text-[#2563EB]">Belum menerima kode? <button type="button" onClick={requestOtp} className="underline">Kirim ulang</button></div>
          </form>
        )}
      </div>
    </div>
  );
}
