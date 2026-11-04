<?php

namespace App\Events;

use App\Models\Donation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class DonationPaid implements ShouldBroadcastNow, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @var array<string, mixed> */
    public array $donation;

    public function __construct(Donation $donation)
    {
        $isMediaShare = (bool) data_get($donation->media_share_request, 'enabled', false);
        $ttsEnabled = (bool) data_get($donation->creator?->overlay_config, 'notifications.ttsEnabled', true);

        $this->donation = [
            '_id' => (string) $donation->id,
            'id' => (string) $donation->id,
            'name' => $donation->name,
            'amount' => $donation->amount,
            'message' => $donation->message,
            'status' => $donation->status,
            'createdByUsername' => $donation->created_by_username,
            'paymentMethod' => $donation->payment_method,
            'mediaShareRequest' => $donation->media_share_request,
            'createdAt' => $donation->created_at?->toISOString(),
            'ttsEnabled' => $ttsEnabled && ! $isMediaShare,
            'audioUrl' => $ttsEnabled && ! $isMediaShare
                ? URL::temporarySignedRoute(
                    'overlay.donation-speech',
                    now()->addHours(12),
                    ['donation' => $donation->id],
                )
                : null,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('creator.'.strtolower($this->donation['createdByUsername'])),
        ];
    }

    public function broadcastAs(): string
    {
        return 'donation.paid';
    }
}
