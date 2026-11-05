# Johen Donate Laravel API

Backend REST API Laravel untuk autentikasi, creator, donasi, Midtrans, GoPay incoming, dashboard, payout, admin, media share, dan overlay.

## Menjalankan

1. Salin `.env.example` menjadi `.env` dan isi database serta credential layanan.
2. Jalankan `composer install`.
3. Jalankan `php artisan migrate`.
4. Jalankan `php artisan storage:link` untuk gambar profil dan lampiran.
5. Jalankan `php artisan serve --port=8001`.

Endpoint API menggunakan prefix `/api`. Autentikasi frontend menggunakan Bearer token JWT.
