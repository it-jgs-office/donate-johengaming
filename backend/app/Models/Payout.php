<?php

namespace App\Models;

use App\Events\AdminDataUpdated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payout extends Model
{
    protected $guarded = [];

    protected static function booted(): void
    {
        static::creating(function (Payout $payout) {
            $payout->payout_reference ??= 'PO-'.strtoupper(Str::random(12));
        });

        static::saved(function (): void {
            AdminDataUpdated::dispatch('payouts');
        });
        static::deleted(function (): void {
            AdminDataUpdated::dispatch('payouts');
        });
    }

    protected function casts(): array
    {
        return [
            'gross_amount' => 'integer',
            'platform_fee' => 'integer',
            'amount' => 'integer',
            'bank_info' => 'array',
            'donation_ids' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
