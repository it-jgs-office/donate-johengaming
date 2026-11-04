<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        ]);

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

        return response()->json(['success' => true, 'user' => $user->toFrontendArray()], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);
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

    private function defaultDonationSettings(): array
    {
        return ['minAmount' => 5000, 'maxAmount' => 10000000, 'isEnabled' => true, 'mediaShareEnabled' => true, 'customMessage' => 'Terima kasih atas dukungannya!'];
    }
}
