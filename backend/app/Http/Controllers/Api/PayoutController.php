<?php

namespace App\Http\Controllers\Api;

use App\Events\PayoutUpdated;
use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\Payout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Payout::where('creator_id', $request->user()->id)->latest()->get()->map(fn ($payout) => $this->payload($payout));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $creator = $request->user();
        abort_unless($creator->role === 'creator', 403);
        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:50000'],
        ]);

        if (! $creator->hasCompletePayoutSettings()) {
            return response()->json(['error' => 'Lengkapi data bank terlebih dahulu'], 422);
        }

        $payout = DB::transaction(function () use ($creator, $data) {
            if (Payout::where('creator_id', $creator->id)->whereIn('status', ['PENDING', 'APPROVED'])->lockForUpdate()->exists()) {
                abort(422, 'Masih ada pencairan pending');
            }

            $donations = Donation::where('created_by', $creator->id)->where('status', 'PAID')->lockForUpdate()->get(['id', 'amount', 'net_amount']);
            $reservedAmount = (int) Payout::where('creator_id', $creator->id)
                ->where('status', '!=', 'REJECTED')
                ->lockForUpdate()
                ->get(['gross_amount'])
                ->sum('gross_amount');
            $availableAmount = max(0, (int) $donations->sum(fn (Donation $donation): int => (int) ($donation->net_amount ?? $donation->amount)) - $reservedAmount);
            $requestedAmount = (int) $data['amount'];

            if ($requestedAmount > $availableAmount) {
                abort(422, 'Nominal penarikan melebihi saldo tersedia');
            }

            return Payout::create([
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'gross_amount' => $requestedAmount,
                'platform_fee' => 0,
                'amount' => $requestedAmount,
                'status' => 'PENDING',
                'bank_info' => $creator->payout_settings,
                'donation_ids' => $donations->pluck('id')->all(),
            ]);
        });

        PayoutUpdated::dispatch($payout->creator_username);

        return response()->json(['success' => true, 'data' => $this->payload($payout)], 201);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $this->admin($request);

        return response()->json(['success' => true, 'data' => Payout::with('creator')->latest()->get()->map(fn ($item) => $this->payload($item))]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->admin($request);
        $data = $request->validate(['id' => ['required', 'integer'], 'status' => ['required', 'in:PENDING,APPROVED,REJECTED,PROCESSED'], 'notes' => ['nullable', 'string', 'max:500']]);

        $payout = DB::transaction(function () use ($data, $request) {
            $payout = Payout::lockForUpdate()->findOrFail($data['id']);
            $payout->update(['status' => $data['status'], 'admin_note' => $data['notes'] ?? null, 'processed_by' => $request->user()->id, 'processed_at' => now()]);

            return $payout->fresh('creator');
        });

        PayoutUpdated::dispatch($payout->creator_username);

        if (in_array($payout->status, ['PROCESSED', 'REJECTED'], true) && $payout->creator?->email) {
            $label = $payout->status === 'PROCESSED' ? 'telah diproses' : 'ditolak';
            Mail::raw(
                'Pencairan '.$payout->payout_reference.' sebesar Rp '.number_format($payout->amount, 0, ',', '.').' '.$label.'.'.($payout->admin_note ? ' Catatan: '.$payout->admin_note : ''),
                fn ($mail) => $mail->to($payout->creator->email)->subject('Status Pencairan Johen Donate'),
            );
        }

        return response()->json(['success' => true, 'data' => $this->payload($payout)]);
    }

    private function admin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403);
    }

    private function payload(Payout $payout): array
    {
        return [
            '_id' => (string) $payout->id,
            'id' => $payout->id,
            'creatorUsername' => $payout->creator_username,
            'creatorId' => $payout->creator?->toFrontendArray(),
            'grossAmount' => $payout->gross_amount,
            'platformFee' => $payout->platform_fee,
            'amount' => $payout->amount,
            'finalAmount' => $payout->amount,
            'status' => $payout->status,
            'bankInfo' => $payout->bank_info,
            'adminNote' => $payout->admin_note,
            'payoutReference' => $payout->payout_reference,
            'requestedAt' => $payout->created_at?->toISOString(),
            'processedAt' => $payout->processed_at?->toISOString(),
        ];
    }
}
