<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminDataUpdated implements ShouldBroadcastNow, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $resource) {}

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        return [new Channel('admin.dashboard')];
    }

    public function broadcastAs(): string
    {
        return 'admin.data.updated';
    }

    /** @return array{resource: string} */
    public function broadcastWith(): array
    {
        return ['resource' => $this->resource];
    }
}
