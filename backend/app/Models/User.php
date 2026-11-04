<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Events\AdminDataUpdated;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'display_name', 'username', 'email', 'password', 'role', 'bio',
        'profile_image_path', 'cover_image_path', 'social_links',
        'payout_settings', 'donation_settings', 'overlay_config', 'stats',
        'is_active', 'last_login_at', 'login_count',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected static function booted(): void
    {
        static::saved(function (User $user): void {
            if ($user->role === 'creator') {
                AdminDataUpdated::dispatch('creators');
            }
        });

        static::deleted(function (User $user): void {
            if ($user->role === 'creator') {
                AdminDataUpdated::dispatch('creators');
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'social_links' => 'array',
            'payout_settings' => 'array',
            'donation_settings' => 'array',
            'overlay_config' => 'array',
            'stats' => 'array',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function donations()
    {
        return $this->hasMany(Donation::class, 'created_by');
    }

    public function payouts()
    {
        return $this->hasMany(Payout::class, 'creator_id');
    }

    public function hasCompletePayoutSettings(): bool
    {
        $settings = $this->payout_settings ?? [];

        return filled($settings['bankName'] ?? null)
            && filled($settings['accountNumber'] ?? null)
            && filled($settings['accountName'] ?? null);
    }

    public function toFrontendArray(): array
    {
        $payout = $this->payout_settings ?? [];

        return [
            'id' => $this->id,
            '_id' => (string) $this->id,
            'email' => $this->email,
            'username' => $this->username,
            'displayName' => $this->display_name ?: $this->name,
            'fullName' => $this->name,
            'bio' => $this->bio,
            'userType' => $this->role === 'admin' ? 'admin' : 'creator',
            'role' => $this->role === 'admin' ? 'admin' : 'user',
            'payoutSettings' => $payout,
            'donationSettings' => $this->donation_settings ?? [],
            'socialLinks' => $this->social_links ?? [],
            'overlayConfig' => $this->overlay_config ?? [],
            'stats' => $this->stats ?? [],
            'profileImage' => $this->profile_image_path ? url('/api/user/profile-image/'.$this->id) : null,
            'coverImage' => $this->cover_image_path ? url('/api/user/cover-image/'.$this->id) : null,
            'payoutBankName' => $payout['bankName'] ?? '',
            'payoutAccountNumber' => $payout['accountNumber'] ?? '',
            'payoutAccountHolder' => $payout['accountName'] ?? '',
            'isPayoutReady' => $this->hasCompletePayoutSettings(),
        ];
    }
}
