<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Services\DonationProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function midtrans(Request $request, DonationProcessor $processor): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'string'],
            'transaction_status' => ['required', 'string'],
            'status_code' => ['required'],
            'gross_amount' => ['required'],
            'signature_key' => ['required', 'string'],
        ]);

        $serverKey = (string) config('services.midtrans.server_key');
        abort_if($serverKey === '', 500, 'MIDTRANS_SERVER_KEY belum dikonfigurasi');
        $expected = hash('sha512', $data['order_id'].$data['status_code'].$data['gross_amount'].$serverKey);
        abort_unless(hash_equals($expected, $data['signature_key']), 403, 'Invalid signature');

        $donation = Donation::where('merchant_ref', $data['order_id'])->firstOrFail();
        abort_unless((int) $data['gross_amount'] === $donation->amount, 422, 'Amount mismatch');

        $isSuccessfulCapture = $data['transaction_status'] === 'capture'
            && $request->input('fraud_status', 'accept') === 'accept';

        if ($data['transaction_status'] === 'settlement' || $isSuccessfulCapture) {
            $processor->markPaid($donation, $request->all());
        } elseif (in_array($data['transaction_status'], ['expire', 'cancel'], true)) {
            $donation->update(['status' => 'CANCELLED', 'payment_data' => $request->all()]);
        } elseif ($data['transaction_status'] === 'deny') {
            $donation->update(['status' => 'FAILED', 'payment_data' => $request->all()]);
        }

        return response()->json(['success' => true]);
    }

    public function incoming(Request $request, DonationProcessor $processor): JsonResponse
    {
        $configuredSecret = (string) config('services.gopay.incoming_secret');
        abort_if($configuredSecret === '', 500, 'GOPAY_INCOMING_SECRET belum dikonfigurasi');
        $provided = (string) ($request->header('X-Incoming-Secret') ?: $request->input('incoming_secret'));
        abort_unless(hash_equals($configuredSecret, $provided), 401, 'Unauthorized');

        $data = $request->validate([
            'merchant_ref' => ['required', 'string'],
            'amount' => ['required'],
            'payment_method' => ['nullable', 'string'],
        ]);
        $amount = (int) preg_replace('/\D/', '', (string) $data['amount']);
        $donation = Donation::where('merchant_ref', $data['merchant_ref'])->where('status', 'PENDING')->firstOrFail();
        abort_unless($amount === $donation->amount, 422, 'Amount mismatch');

        $processor->markPaid($donation, ['source' => 'gopay-incoming', 'received_at' => now()->toISOString()]);

        return response()->json(['success' => true]);
    }
}
