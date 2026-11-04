<?php

namespace App\Models;

use App\Events\AdminDataUpdated;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    protected $guarded = [];

    protected static function booted(): void
    {
        static::saved(function (): void {
            AdminDataUpdated::dispatch('donations');
        });
        static::deleted(function (): void {
            AdminDataUpdated::dispatch('donations');
        });
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'service_fee_percentage' => 'decimal:2',
            'service_fee_amount' => 'integer',
            'net_amount' => 'integer',
            'payment_data' => 'array',
            'media_share_request' => 'array',
            'is_archived' => 'boolean',
            'is_paid_out' => 'boolean',
            'is_displayed_in_overlay' => 'boolean',
            'paid_out_at' => 'datetime',
            'displayed_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payout()
    {
        return $this->belongsTo(Payout::class);
    }

    public function notification()
    {
        return $this->hasOne(Notification::class);
    }

    public function mediaShare()
    {
        return $this->hasOne(MediaShare::class);
    }

    public function toFrontendArray(): array
    {
        return [
            '_id' => (string) $this->id,
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'amount' => $this->amount,
            'serviceFeePercentage' => (float) ($this->service_fee_percentage ?? 0),
            'serviceFeeAmount' => (int) ($this->service_fee_amount ?? 0),
            'netAmount' => (int) ($this->net_amount ?? $this->amount),
            'message' => $this->message,
            'status' => $this->status,
            'merchant_ref' => $this->merchant_ref,
            'createdByUsername' => $this->created_by_username,
            'paymentMethod' => $this->payment_method,
            'mediaShareRequest' => $this->media_share_request,
            'isPaidOut' => $this->is_paid_out,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
