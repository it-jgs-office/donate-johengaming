<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\DonationHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function creators(): JsonResponse
    {
        $creators = User::where('role', 'creator')->where('is_active', true)->whereNotNull('username')->latest()->limit(100)->get()
            ->map(fn (User $user) => [
                'username' => $user->username,
                'displayName' => $user->display_name,
                'bio' => $user->bio,
                'profileImage' => $user->profile_image_path
                    ? url('/api/user/profile-image/'.$user->id).'?v='.($user->updated_at?->timestamp ?? 0)
                    : null,
            ]);

        return response()->json(['success' => true, 'creators' => $creators]);
    }

    public function archive(Request $request): JsonResponse
    {
        $secret = (string) config('services.cron.secret');
        abort_if($secret === '' || ! hash_equals($secret, (string) $request->header('X-Cron-Secret')), 401);
        $archived = 0;
        Donation::where('status', 'PAID')->where('created_at', '<', now()->subDay())->chunkById(100, function ($items) use (&$archived) {
            foreach ($items as $donation) {
                DB::transaction(function () use ($donation, &$archived) {
                    DonationHistory::firstOrCreate(['original_id' => $donation->id], ['created_by' => $donation->created_by, 'created_by_username' => $donation->created_by_username, 'data' => $donation->toFrontendArray(), 'donated_at' => $donation->created_at]);
                    $donation->delete();
                    $archived++;
                });
            }
        });

        return response()->json(['success' => true, 'archived' => $archived]);
    }

    public function archiveStatus(): JsonResponse
    {
        return response()->json(['success' => true, 'ready' => Donation::where('status', 'PAID')->where('created_at', '<', now()->subDay())->count()]);
    }

    public function pending(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);
        $items = Donation::where('created_by_username', strtolower((string) $request->query('username')))->where('status', 'PENDING')->where('created_at', '>=', now()->subDay())->latest()->limit(50)->get()->map->toFrontendArray();

        return response()->json(['success' => true, 'count' => $items->count(), 'donations' => $items]);
    }
}
