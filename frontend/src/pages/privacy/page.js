'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PrivacyPolicy() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'admin' || userData.isAdmin) {
          setUserType('admin');
        } else {
          setUserType('creator');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleBack = () => {
    if (!isLoggedIn) {
      router.push('/');
    } else if (userType === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="jd-public-page flex items-center justify-center px-4 py-12">
      <div className="jd-surface w-full max-w-2xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#2563EB]">Kebijakan Privasi</h1>
          <button
            onClick={handleBack}
            className="jd-btn-primary px-4 py-2 text-sm font-bold"
          >
            ← Kembali
          </button>
        </div>
        <p className="mb-4 text-[#0F2A5F]">Kami menghargai privasi Anda. Data yang Anda berikan hanya digunakan untuk keperluan donasi dan tidak akan dibagikan ke pihak ketiga tanpa izin Anda.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-2 text-[#2563EB]">Data yang Dikumpulkan</h2>
        <ul className="list-disc ml-6 text-[#0F2A5F]">
          <li>Nama, email, dan username saat mendaftar</li>
          <li>Data donasi (jumlah, pesan, waktu)</li>
          <li>Data pembayaran (diproses melalui <strong>Midtrans</strong> dan <strong>GoPay</strong> - payment gateway tersertifikasi, tidak disimpan di server kami)</li>
          <li>Informasi profil creator (bio, foto, social media links) - opsional</li>
        </ul>
        
        <h2 className="text-xl font-bold mt-8 mb-2 text-[#2563EB]">Bagaimana Kami Menggunakan Data Anda</h2>
        <ul className="list-disc ml-6 text-[#0F2A5F]">
          <li>Membuat dan mengelola akun Anda</li>
          <li>Memproses transaksi donasi</li>
          <li>Mengirim notifikasi terkait donasi dan aktivitas akun</li>
          <li>Meningkatkan layanan dan pengalaman pengguna</li>
          <li>Mencegah fraud dan menjaga keamanan platform</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-2 text-[#2563EB]">Keamanan Data</h2>
        <ul className="list-disc ml-6 text-[#0F2A5F]">
          <li>Data disimpan dengan aman menggunakan database terenkripsi (MongoDB)</li>
          <li>Koneksi menggunakan HTTPS/SSL untuk melindungi data dalam transit</li>
          <li>Password di-hash menggunakan algoritma bcrypt</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-2 text-[#2563EB]">Hak Anda</h2>
        <ul className="list-disc ml-6 text-[#0F2A5F]">
          <li>Mengakses dan melihat data pribadi Anda kapan saja</li>
          <li>Mengubah atau memperbarui informasi profil</li>
          <li>Menghapus akun dan semua data terkait secara permanen</li>
          <li>Data Anda dilindungi dan <strong>tidak akan pernah dijual</strong> ke pihak ketiga</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-2 text-[#2563EB]">Pembagian Data dengan Pihak Ketiga</h2>
        <p className="text-[#0F2A5F] mb-2">Kami hanya membagikan data dengan pihak ketiga dalam konteks berikut:</p>
        <ul className="list-disc ml-6 text-[#0F2A5F]">
          <li><strong>Midtrans</strong> & <strong>GoPay</strong> - Payment gateway untuk memproses transaksi donasi secara aman (GoPay dapat digunakan langsung atau melalui Midtrans)</li>
          <li>Kami <strong>tidak menjual, menyewakan, atau membagikan</strong> data Anda untuk tujuan marketing</li>
        </ul>

  <p className="mt-8 text-[#0F2A5F]">Untuk pertanyaan lebih lanjut, <a href="/contact" className="underline text-[#2563EB] hover:text-[#0F2A5F]">hubungi tim kami</a>.</p>
      </div>
    </div>
  );
}
