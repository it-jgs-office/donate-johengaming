<?php

namespace App\Services;

use App\Models\Donation;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$clientKey = (string) config('services.midtrans.client_key');
        Config::$isProduction = (bool) config('services.midtrans.production', false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function createTransaction(Donation $donation): array
    {
        return (array) Snap::createTransaction([
            'transaction_details' => [
                'order_id' => $donation->merchant_ref,
                'gross_amount' => $donation->amount,
            ],
            'customer_details' => [
                'first_name' => $donation->name,
                'email' => $donation->email,
            ],
            'item_details' => [[
                'id' => 'donation',
                'price' => $donation->amount,
                'quantity' => 1,
                'name' => 'Donasi untuk '.$donation->created_by_username,
            ]],
            'credit_card' => ['secure' => true],
        ]);
    }

    /** @return array<string, mixed> */
    public function transactionStatus(string $orderId): array
    {
        return (array) Transaction::status($orderId);
    }
}
