'use client';

export default function ComingSoon() {
  return (
    <div className="jd-public-page flex h-screen w-screen items-center justify-center overflow-hidden px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Coming Soon Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0F2A5F] leading-tight">
            Coming Soon
          </h1>
          <div className="flex justify-center">
            <div className="h-1.5 w-32 bg-[#0F2A5F] rounded-full"></div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 py-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F2A5F]">
            Halaman Sedang Dalam Pengembangan
          </h2>
          <p className="text-base md:text-lg text-[#0F2A5F] max-w-xl mx-auto leading-relaxed">
            Kami sedang mempersiapkan sesuatu yang menarik untuk Anda. Nantikan pembaruan selanjutnya!
          </p>
        </div>
      </div>
    </div>
  );
}
