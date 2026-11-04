<?php

namespace App\Console\Commands;

use App\Models\Donation;
use App\Services\DonationPaymentSynchronizer;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('payments:sync-pending')]
#[Description('Synchronize pending donation statuses with Midtrans')]
class SyncPendingPayments extends Command
{
    public function __construct(private readonly DonationPaymentSynchronizer $synchronizer)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        Donation::query()
            ->where('status', 'PENDING')
            ->where('created_at', '>=', now()->subDay())
            ->oldest('id')
            ->limit(50)
            ->get()
            ->each(function (Donation $donation): void {
                try {
                    $this->synchronizer->sync($donation);
                } catch (Throwable $error) {
                    report($error);
                }
            });

        return self::SUCCESS;
    }
}
