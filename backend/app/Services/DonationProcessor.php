<?php

namespace App\Services;

use App\Events\DonationPaid;
use App\Models\Donation;
use App\Models\MediaShare;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class DonationProcessor
{
    public function markPaid(Donation $donation, array $paymentData = []): Donation
    {
        [$paidDonation, $shouldBroadcast] = DB::transaction(function () use ($donation, $paymentData) {
            $donation = Donation::query()->lockForUpdate()->findOrFail($donation->id);
            $wasAlreadyPaid = $donation->status === 'PAID';
            $donation->update([
                'status' => 'PAID',
                'transaction_id' => $paymentData['transaction_id'] ?? $donation->transaction_id,
                'payment_method' => $paymentData['payment_type'] ?? $donation->payment_method,
                'payment_data' => $paymentData ?: $donation->payment_data,
            ]);

            $media = $donation->media_share_request ?? [];
            if (($media['enabled'] ?? false) && filled($media['youtubeUrl'] ?? null)) {
                $videoId = MediaShare::extractVideoId($media['youtubeUrl']);
                if ($videoId) {
                    $position = MediaShare::query()
                        ->where('creator_username', $donation->created_by_username)
                        ->whereIn('status', ['PENDING', 'PLAYING'])
                        ->max('queue_position') + 1;

                    MediaShare::firstOrCreate(['donation_id' => $donation->id], [
                        'creator_id' => $donation->created_by,
                        'creator_username' => $donation->created_by_username,
                        'donor_name' => $donation->name,
                        'amount' => $donation->amount,
                        'youtube_url' => $media['youtubeUrl'],
                        'video_id' => $videoId,
                        'requested_duration' => max(5, min(3600, (int) ($media['duration'] ?? MediaShare::durationForAmount((int) $donation->amount)))),
                        'message' => $donation->message,
                        'queue_position' => max(1, $position),
                    ]);
                }
            } else {
                Notification::createFromDonation($donation);
            }

            return [$donation->fresh(), ! $wasAlreadyPaid];
        });

        if ($shouldBroadcast) {
            DonationPaid::dispatch($paidDonation);
        }

        return $paidDonation;
    }
}
