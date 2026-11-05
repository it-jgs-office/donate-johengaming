<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function __construct(private readonly JwtTokenService $jwtTokenService) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[a-zA-Z0-9_-]+$/', 'unique:users,username'],
            'displayName' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'description' => ['nullable', 'string', 'max:500'],
            'recaptchaToken' => ['required', 'string'],
        ]);

        if (! $this->validRecaptcha($request, $data['recaptchaToken'])) {
            return response()->json(['error' => 'Verifikasi reCAPTCHA gagal. Silakan centang kembali.'], 422);
        }

        $user = User::create([
            'name' => $data['displayName'],
            'display_name' => $data['displayName'],
            'username' => strtolower($data['username']),
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'bio' => $data['description'] ?? '',
            'role' => 'creator',
            'donation_settings' => $this->defaultDonationSettings(),
            'payout_settings' => [],
            'social_links' => [],
            'overlay_config' => [],
            'stats' => [],
        ]);

        try {
            $this->sendVerificationCode($user);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'error' => 'Akun berhasil dibuat, tetapi kode verifikasi gagal dikirim. Silakan masuk untuk mengirim ulang kode.',
                'verification_required' => true,
                'email' => $user->email,
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode verifikasi telah dikirim ke email Anda.',
            'email' => $user->email,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
            'recaptchaToken' => ['required', 'string'],
        ]);

        if (! $this->validRecaptcha($request, $credentials['recaptchaToken'])) {
            return response()->json(['error' => 'Verifikasi reCAPTCHA gagal. Silakan centang kembali.'], 422);
        }

        $user = User::where('email', strtolower($credentials['email']))->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password) || ! $user->is_active) {
            return response()->json(['error' => 'Email atau password salah'], 422);
        }

        $user->forceFill(['last_login_at' => now(), 'login_count' => $user->login_count + 1])->save();
        $rememberBrowser = (bool) ($credentials['remember'] ?? false);
        $token = $this->jwtTokenService->issue($user, $rememberBrowser);

        return response()->json([
            'success' => true,
            'token' => $token['token'],
            'token_type' => 'Bearer',
            'expires_in' => $token['expires_in'],
            'remembered' => $rememberBrowser,
            'user' => $user->toFrontendArray(),
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'user' => $request->user()->toFrontendArray()]);
    }

    public function checkUsername(Request $request): JsonResponse
    {
        $username = strtolower((string) $request->query('username'));

        return response()->json(['available' => $username !== '' && ! User::where('username', $username)->exists()]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'digits:6'],
        ]);
        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! $this->validVerificationToken($user->email, $data['token'])) {
            return response()->json(['error' => 'Kode verifikasi tidak valid atau kedaluwarsa.'], 422);
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        DB::table('email_verification_tokens')->where('email', $user->email)->delete();

        return response()->json(['success' => true, 'message' => 'Email berhasil diverifikasi. Silakan masuk.']);
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower($data['email']))->first();

        if ($user && ! $user->email_verified_at) {
            $this->sendVerificationCode($user);
        }

        return response()->json(['success' => true, 'message' => 'Jika email terdaftar dan belum diverifikasi, kode baru telah dikirim.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower($data['email']))->first();
        if ($user) {
            $otp = (string) random_int(100000, 999999);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($otp), 'created_at' => now()],
            );
            Mail::raw("Kode reset password Johen Donate Anda: {$otp}", fn ($mail) => $mail->to($user->email)->subject('Reset Password Johen Donate'));
        }

        return response()->json(['success' => true, 'message' => 'Jika email terdaftar, kode reset telah dikirim.']);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'token' => ['required', 'string']]);

        return response()->json(['success' => $this->validResetToken($data['email'], $data['token'])], $this->validResetToken($data['email'], $data['token']) ? 200 : 422);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'token' => ['required', 'string'], 'password' => ['required', 'min:6']]);
        if (! $this->validResetToken($data['email'], $data['token'])) {
            return response()->json(['error' => 'Kode reset tidak valid atau kedaluwarsa'], 422);
        }
        User::where('email', strtolower($data['email']))->update(['password' => Hash::make($data['password'])]);
        DB::table('password_reset_tokens')->where('email', strtolower($data['email']))->delete();

        return response()->json(['success' => true]);
    }

    private function validResetToken(string $email, string $token): bool
    {
        $record = DB::table('password_reset_tokens')->where('email', strtolower($email))->first();

        return $record && now()->diffInMinutes($record->created_at) <= 15 && Hash::check($token, $record->token);
    }

    private function sendVerificationCode(User $user): void
    {
        $token = (string) random_int(100000, 999999);

        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()],
        );

        Mail::raw(
            "Kode verifikasi Johen Gaming Anda: {$token}\n\nKode berlaku selama 15 menit.",
            fn ($mail) => $mail->to($user->email)->subject('Kode Verifikasi Johen Gaming'),
        );
    }

    private function validVerificationToken(string $email, string $token): bool
    {
        $record = DB::table('email_verification_tokens')->where('email', strtolower($email))->first();

        return $record && now()->diffInMinutes($record->created_at) <= 15 && Hash::check($token, $record->token);
    }

    private function validRecaptcha(Request $request, string $token): bool
    {
        $secret = config('services.recaptcha.secret');

        if (! is_string($secret) || $secret === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

            return $response->successful() && $response->json('success') === true;
        } catch (\Throwable $exception) {
            report($exception);

            return false;
        }
    }

    private function defaultDonationSettings(): array
    {
        return ['minAmount' => 5000, 'maxAmount' => 10000000, 'isEnabled' => true, 'mediaShareEnabled' => true, 'customMessage' => 'Terima kasih atas dukungannya!'];
    }
}
