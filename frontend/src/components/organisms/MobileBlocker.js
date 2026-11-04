'use client'

import { useEffect, useState } from 'react';

export default function MobileBlocker({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="jd-public-page flex min-h-screen items-center justify-center p-4">
        <div className="jd-surface max-w-md p-8 text-center">
          <div className="text-6xl mb-6">🖥️</div>
          <h1 className="text-3xl font-extrabold text-[#0F2A5F] mb-4">
            Desktop Only
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Halaman dashboard dan admin hanya bisa diakses melalui <strong>desktop</strong> atau <strong>laptop</strong>.
          </p>
          <div className="mb-6 rounded-xl bg-[#EFF6FF] p-4">
            <p className="font-medium text-[#0F2A5F]">
              Silakan buka website ini di komputer/laptop untuk mengakses fitur lengkap.
            </p>
          </div>
          <a
            href="/"
            className="jd-btn-primary inline-block px-8 py-3 font-bold"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
