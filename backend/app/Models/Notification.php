<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['payload' => 'array', 'is_read' => 'boolean', 'is_displayed' => 'boolean', 'displayed_at' => 'datetime'];
    }

    public static function createFromDonation(Donation $donation): self
    {
        return self::firstOrCreate(
            ['donation_id' => $donation->id],
            [
                'creator_id' => $donation->created_by,
                'creator_username' => $donation->created_by_username,
                'type' => 'DONATION',
                'payload' => $donation->toFrontendArray(),
            ],
        );
    }
}
