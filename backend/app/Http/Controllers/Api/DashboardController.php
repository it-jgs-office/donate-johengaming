<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\DonationHistory;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function donations(Request $request): JsonResponse
    {
        $donations = Donation::where('created_by', $request->user()->id)->latest()->get()->map->toFrontendArray();

        return response()->json(['success' => true, 'data' => $donations, 'donations' => $donations]);
    }

    public function updateDonation(Request $request, Donation $donation): JsonResponse
    {
        abort_unless($donation->created_by === $request->user()->id, 404);
        if ($request->isMethod('delete')) {
            $donation->delete();

            return response()->json(['success' => true, 'message' => 'Donasi berhasil dihapus']);
        }
        $donation->update(['status' => 'PAID']);

        return response()->json(['success' => true, 'donation' => $donation->fresh()->toFrontendArray()]);
    }

    public function stats(Request $request): JsonResponse
    {
        $query = Donation::where('created_by', $request->user()->id)->where('status', 'PAID');
        $today = (clone $query)->whereDate('created_at', today());
        $totalAmount = (int) $query->sum('amount');
        $totalServiceFee = (int) $query->sum('service_fee_amount');
        $netAmount = (int) $query->selectRaw('COALESCE(SUM(COALESCE(net_amount, amount)), 0) as total')->value('total');
        $withdrawnOrReservedAmount = (int) Payout::where('creator_id', $request->user()->id)
            ->where('status', '!=', 'REJECTED')
            ->sum('gross_amount');
        $stats = [
            'totalAmount' => $totalAmount,
            'totalDonations' => $query->count(),
            'paidAmount' => max(0, $netAmount - $withdrawnOrReservedAmount),
            'todayAmount' => (int) $today->selectRaw('COALESCE(SUM(COALESCE(net_amount, amount)), 0) as total')->value('total'),
            'todayDonations' => $today->count(),
            'serviceFeeAmount' => $totalServiceFee,
            'netAmount' => $netAmount,
        ];

        return response()->json(['success' => true, 'stats' => $stats]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'leaderboard' => $this->leaderboardFor($request->user()->id)]);
    }

    public function publicLeaderboard(Request $request): JsonResponse
    {
        $creator = User::where('username', strtolower($request->query('username', '')))->firstOrFail();

        return response()->json(['success' => true, 'leaderboard' => $this->leaderboardFor($creator->id)]);
    }

    public function history(Request $request): JsonResponse
    {
        $active = Donation::where('created_by', $request->user()->id)->where('status', 'PAID')->get()->map->toFrontendArray();
        $archived = DonationHistory::where('created_by', $request->user()->id)->get()->pluck('data');

        return response()->json(['success' => true, 'donations' => $active->concat($archived)->values()]);
    }

    private function leaderboardFor(int $creatorId): array
    {
        return Donation::where('created_by', $creatorId)->where('status', 'PAID')->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->selectRaw('name, SUM(amount) total_amount, COUNT(*) donation_count')->groupBy('name')->orderByDesc('total_amount')->limit(50)->get()
            ->map(fn ($item) => ['name' => $item->name, 'totalAmount' => (int) $item->total_amount, 'donationCount' => (int) $item->donation_count])->all();
    }
}
