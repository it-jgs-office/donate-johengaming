<?php

namespace App\Http\Controllers\Api;

use App\Events\DonationPaid;
use App\Events\OverlayReplay;
use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\MediaShare;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OverlayController extends Controller
{
    public function latestDonations(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string'], 'since' => ['nullable', 'date']]);
        $query = Donation::where('created_by_username', strtolower($data['username']))->where('status', 'PAID')
            ->where(fn ($q) => $q->whereNull('media_share_request')->orWhereJsonContains('media_share_request->enabled', false));
        if (! empty($data['since'])) {
            $query->where('updated_at', '>', $data['since']);
        }

        $donations = $query->latest()->limit(10)->get()
            ->map(fn (Donation $donation) => (new DonationPaid($donation))->donation);

        return response()->json(['success' => true, 'donations' => $donations, 'timestamp' => now()->toISOString()]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $creator = User::where('username', strtolower((string) $request->query('username')))->firstOrFail();
        $items = Donation::where('created_by', $creator->id)->where('status', 'PAID')->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->selectRaw('name, SUM(amount) total_amount, COUNT(*) donation_count')->groupBy('name')->orderByDesc('total_amount')->limit(5)->get()
            ->values()->map(fn ($item, $index) => ['rank' => $index + 1, 'name' => $item->name, 'totalAmount' => (int) $item->total_amount, 'donationCount' => (int) $item->donation_count]);

        return response()->json(['success' => true, 'leaderboard' => $items, 'monthYear' => now()->format('Y-m'), 'lastUpdated' => now()->toISOString()]);
    }

    public function replay(Request $request): JsonResponse
    {
        $data = $request->validate(['username' => ['required', 'string'], 'type' => ['required', 'in:notification,mediashare']]);
        if ($request->isMethod('post')) {
            abort_unless($request->user()?->username === strtolower($data['username']) || $request->user()?->role === 'admin', 403);
            $payload = $request->validate(['data' => ['required', 'array']]);
            OverlayReplay::dispatch(strtolower($data['username']), $data['type'], $payload['data']);

            return response()->json(['success' => true, 'message' => 'Replay trigger set']);
        }

        return response()->json(['success' => true, 'trigger' => null]);
    }

    public function mediaShares(Request $request, string $username): JsonResponse
    {
        if ($request->isMethod('get')) {
            $items = MediaShare::where('creator_username', strtolower($username))->whereIn('status', ['PENDING', 'PLAYING'])->where('is_approved', true)
                ->orderBy('queue_position')->limit(50)->get()->map(fn ($item) => $this->mediaPayload($item));

            return response()->json(['success' => true, 'data' => $items, 'total' => $items->count()]);
        }

        $data = $request->validate(['id' => ['required'], 'status' => ['required', 'in:PENDING,PLAYING,PLAYED,SKIPPED'], 'actualDuration' => ['nullable', 'integer']]);
        if (str_starts_with((string) $data['id'], 'replay-')) {
            return response()->json(['success' => true]);
        }
        $item = MediaShare::where('creator_username', strtolower($username))->findOrFail($data['id']);
        $item->update(['status' => $data['status']]);

        return response()->json(['success' => true, 'data' => $this->mediaPayload($item->fresh())]);
    }

    public function skipMediaShare(Request $request, string $username): JsonResponse
    {
        $data = $request->validate(['id' => ['required', 'integer']]);
        abort_unless($request->user()->username === strtolower($username), 403);
        MediaShare::where('creator_username', strtolower($username))->findOrFail($data['id'])->update(['status' => 'SKIPPED']);

        return response()->json(['success' => true]);
    }

    public function config(Request $request, string $section = ''): JsonResponse
    {
        $creator = User::where('username', strtolower((string) $request->query('username')))->firstOrFail();
        $config = $creator->overlay_config ?? [];
        if ($section !== '') {
            $config = $config[$section] ?? $this->defaultConfig($section);
        }
        if ($section === '' && $config === []) {
            $config = ['showLeaderboard' => true, 'leaderboardSize' => 'medium', 'leaderboardPosition' => 'top-right', 'showNotifications' => true, 'notificationDuration' => 5000];
        }

        return response()->json($config);
    }

    private function mediaPayload(MediaShare $item): array
    {
        return [
            '_id' => (string) $item->id,
            'id' => (string) $item->id,
            'donorName' => $item->donor_name,
            'amount' => $item->amount,
            'youtubeUrl' => $item->youtube_url,
            'videoId' => $item->video_id,
            'requestedDuration' => $item->requested_duration,
            'message' => $item->message,
            'queuePosition' => $item->queue_position,
            'status' => $item->status,
            'createdAt' => $item->created_at?->toISOString(),
        ];
    }

    private function defaultConfig(string $section): array
    {
        return match ($section) {
            'notifications' => ['showNotifications' => true, 'notificationPosition' => 'top-right', 'notificationDuration' => 5000, 'soundEnabled' => true, 'soundVolume' => .7, 'animationStyle' => 'slide', 'ttsEnabled' => true],
            'leaderboard' => ['showLeaderboard' => true, 'limit' => 5],
            default => [],
        };
    }
}
