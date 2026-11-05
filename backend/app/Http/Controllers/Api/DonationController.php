<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\DonationShare;
use App\Models\FilteredWord;
use App\Models\MediaShare;
use App\Models\User;
use App\Services\DonationPaymentSynchronizer;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DonationController extends Controller
{
    public function show(Request $request, string $username): JsonResponse
    {
        $creator = $this->creator($username);
        if (! $creator->hasCompletePayoutSettings()) {
            return response()->json([
                'success' => false,
                'disabled' => true,
                'error' => 'Creator belum melengkapi pengaturan pencairan dana',
                'creator' => $this->creatorPayload($creator),
            ]);
        }

        $settings = $creator->donation_settings ?? [];
        if (! ($settings['isEnabled'] ?? true)) {
            return response()->json(['success' => false, 'disabled' => true, 'error' => 'Donasi sedang tidak aktif', 'creator' => $this->creatorPayload($creator)]);
        }

        $query = Donation::where('created_by', $creator->id)->where('status', 'PAID')->latest();
        if (! $request->boolean('all')) {
            $query->limit(10);
        }
        $donations = $query->get()->map->toFrontendArray();

        $stats = Donation::where('created_by', $creator->id)->where('status', 'PAID')
            ->selectRaw('COALESCE(SUM(amount), 0) total_amount, COUNT(*) total_donations, COUNT(DISTINCT name) unique_donors')->first();

        return response()->json([
            'success' => true,
            'creator' => $this->creatorPayload($creator),
            'donations' => $donations,
            'stats' => ['totalAmount' => (int) $stats->total_amount, 'totalDonations' => (int) $stats->total_donations, 'uniqueDonors' => (int) $stats->unique_donors],
        ]);
    }

    public function store(Request $request, string $username, MidtransService $midtrans): JsonResponse
    {
        $creator = $this->creator($username);
        if (! $creator->hasCompletePayoutSettings()) {
            return response()->json(['error' => 'Creator belum mengaktifkan donasi'], 403);
        }
        $settings = $creator->donation_settings ?? [];
        if (! ($settings['isEnabled'] ?? true)) {
            return response()->json(['error' => 'Donasi sedang tidak aktif', 'disabled' => true], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email'],
            'amount' => ['required', 'integer', 'min:1', 'max:10000000'],
            'message' => ['nullable', 'string', 'max:500'],
            'mediaShare.enabled' => ['nullable', 'boolean'],
            'mediaShare.youtubeUrl' => ['nullable', 'url'],
            'mediaShare.duration' => ['prohibited'],
        ]);

        $message = $this->filterMessage($creator->id, $data['message'] ?? '');
        $serviceFeePercentage = $this->serviceFeePercentage();
        $serviceFeeAmount = (int) round($data['amount'] * ($serviceFeePercentage / 100));
        $media = $data['mediaShare'] ?? [];
        $durationRules = data_get($creator->overlay_config, 'mediashare.durationRules', MediaShare::defaultDurationRules());
        if (($media['enabled'] ?? false) && ! ($settings['mediaShareEnabled'] ?? true)) {
            return response()->json(['error' => 'Media Share sedang tidak aktif'], 422);
        }

        $donation = Donation::create([
            'created_by' => $creator->id,
            'created_by_username' => $creator->username,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'amount' => $data['amount'],
            'service_fee_percentage' => $serviceFeePercentage,
            'service_fee_amount' => $serviceFeeAmount,
            'net_amount' => max(0, $data['amount'] - $serviceFeeAmount),
            'message' => $message,
            'merchant_ref' => 'DON'.now()->format('YmdHis').strtoupper(Str::random(6)),
            'status' => 'PENDING',
            'payment_method' => 'midtrans',
            'media_share_request' => ($media['enabled'] ?? false) ? [
                'enabled' => true,
                'youtubeUrl' => $media['youtubeUrl'] ?? '',
                'duration' => MediaShare::durationForAmount((int) $data['amount'], is_array($durationRules) ? $durationRules : null),
                'processed' => false,
            ] : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        try {
            $payment = $midtrans->createTransaction($donation);
        } catch (\Throwable $error) {
            $donation->delete();
            report($error);

            return response()->json(['error' => 'Gagal memproses pembayaran'], 502);
        }

        return response()->json([
            'success' => true,
            'donation' => $donation->toFrontendArray(),
            'payment' => ['token' => $payment['token'] ?? null, 'redirect_url' => $payment['redirect_url'] ?? null],
        ], 201);
    }

    public function paymentStatus(Request $request, DonationPaymentSynchronizer $synchronizer): JsonResponse
    {
        $reference = $request->input('merchant_ref', $request->query('merchant_ref'));
        $donation = Donation::where('merchant_ref', $reference)->firstOrFail();

        if ($donation->status === 'PENDING') {
            try {
                $donation = $synchronizer->sync($donation);
            } catch (\Throwable $error) {
                report($error);
            }
        }

        return response()->json(['success' => true, 'status' => $donation->status, 'donation' => $donation->toFrontendArray()]);
    }

    public function trackShare(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string'], 'platform' => ['nullable', 'string', 'max:30']]);
        $creator = $this->creator($data['username']);
        DonationShare::create(['creator_id' => $creator->id, 'platform' => $data['platform'] ?? null, 'ip_address' => $request->ip()]);

        return response()->json(['success' => true]);
    }

    public function shareStats(string $username): JsonResponse
    {
        $creator = $this->creator($username);

        return response()->json(['success' => true, 'totalShares' => DonationShare::where('creator_id', $creator->id)->count()]);
    }

    private function creator(string $username): User
    {
        return User::where('username', strtolower($username))->where('role', 'creator')->where('is_active', true)->firstOrFail();
    }

    private function creatorPayload(User $creator): array
    {
        $assetVersion = $creator->updated_at?->timestamp ?? 0;

        return [
            'username' => $creator->username,
            'displayName' => $creator->display_name,
            'description' => $creator->bio,
            'profileImage' => $creator->profile_image_path ? url('/api/user/profile-image/'.$creator->id).'?v='.$assetVersion : null,
            'coverImage' => $creator->cover_image_path ? url('/api/user/cover-image/'.$creator->id).'?v='.$assetVersion : null,
            'socialLinks' => $creator->social_links ?? [],
            'donationSettings' => [
                'mediaShareEnabled' => ($creator->donation_settings['mediaShareEnabled'] ?? true),
                'mediaShareDurationRules' => data_get($creator->overlay_config, 'mediashare.durationRules', MediaShare::defaultDurationRules()),
            ],
        ];
    }

    private function filterMessage(int $creatorId, string $message): string
    {
        $words = FilteredWord::where('creator_id', $creatorId)->first()?->words ?? [];
        foreach ($words as $word) {
            if ($word !== '') {
                $message = preg_replace('/'.preg_quote($word, '/').'/iu', str_repeat('*', mb_strlen($word)), $message);
            }
        }

        return $message;
    }

    private function serviceFeePercentage(): float
    {
        $percentage = (float) (DB::table('system_settings')
            ->where('key', 'service_fee_percentage')
            ->value('value') ?? 0);

        return min(100, max(0, $percentage));
    }
}
