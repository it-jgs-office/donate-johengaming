'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get('email') || '');
  }, [searchParams]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-email', { email, token });
      toast.success(response.data.message || 'Email berhasil diverifikasi.');
      router.push('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Kode verifikasi tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const response = await axios.post('/api/auth/resend-verification-email', { email });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Kode verifikasi gagal dikirim ulang.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="jd-app-shell jd-auth-shell flex min-h-screen items-center justify-center p-4 font-sans text-[#0F2A5F] antialiased sm:p-6">
      <div className="jd-surface jd-auth-card w-full max-w-md p-6 sm:p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 transition hover:opacity-85">
            <img src="/logo-blue.png" alt="Johen Donate" className="h-10 w-10 object-contain" />
            <span className="text-xl font-black tracking-tight">Johen Donate</span>
          </Link>
          <h1 className="mt-5 text-2xl font-black tracking-tight">Verifikasi Email</h1>
          <p className="mt-2 break-words text-sm text-[#526987]">
            Masukkan kode enam digit yang kami kirim ke {email || 'email Anda'}.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleVerify}>
          <div>
            <label htmlFor="verification-code" className="block text-xs font-bold uppercase tracking-wide">Kode verifikasi</label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="mt-1 w-full rounded-xl border-2 border-[#0F2A5F] bg-white px-3.5 py-3 text-center text-xl font-bold tracking-[0.35em] outline-none transition focus:bg-[#f7fcff] focus:shadow-[2px_2px_0px_#0F2A5F]"
            />
          </div>

          <button type="submit" disabled={loading || !email || token.length !== 6} className="jd-btn-primary flex w-full items-center justify-center py-2.5 text-sm font-extrabold disabled:opacity-50">
            {loading ? 'Memverifikasi...' : 'Verifikasi Email'}
          </button>
        </form>

        <div className="mt-5 border-t border-[#DBEAFE] pt-4 text-center">
          <p className="text-xs text-[#526987]">Belum menerima kode?</p>
          <button type="button" onClick={handleResend} disabled={resending || !email} className="mt-2 text-sm font-extrabold text-[#0F2A5F] underline disabled:opacity-50">
            {resending ? 'Mengirim ulang...' : 'Kirim ulang kode'}
          </button>
        </div>
      </div>
    </div>
  );
}
