<?php

namespace App\Services;

use App\Models\Donation;
use RuntimeException;

class DonationPaymentSynchronizer
{
    public function __construct(
        private readonly MidtransService $midtrans,
        private readonly DonationProcessor $processor,
    ) {}

    public function sync(Donation $donation): Donation
    {
        if ($donation->status !== 'PENDING') {
            return $donation;
        }

        $paymentData = $this->midtrans->transactionStatus($donation->merchant_ref);
        $transactionStatus = $paymentData['transaction_status'] ?? null;
        $grossAmount = isset($paymentData['gross_amount'])
            ? (int) round((float) $paymentData['gross_amount'])
            : null;

        if ($grossAmount !== null && $grossAmount !== $donation->amount) {
            throw new RuntimeException('Nominal pembayaran Midtrans tidak sesuai.');
        }

        $isSuccessfulCapture = $transactionStatus === 'capture'
            && ($paymentData['fraud_status'] ?? 'accept') === 'accept';

        if ($transactionStatus === 'settlement' || $isSuccessfulCapture) {
            return $this->processor->markPaid($donation, $paymentData);
        }

        if (in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure'], true)) {
            $donation->update([
                'status' => in_array($transactionStatus, ['cancel', 'expire'], true) ? 'CANCELLED' : 'FAILED',
                'payment_data' => $paymentData,
            ]);
        }

        return $donation->refresh();
    }
}
