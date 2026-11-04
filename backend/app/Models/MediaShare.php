<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaShare extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'requested_duration' => 'integer', 'queue_position' => 'integer', 'is_approved' => 'boolean'];
    }

    /** @return array<string, int> */
    public static function defaultDurationRules(): array
    {
        return [
            'under10000' => 15,
            'from10000' => 30,
            'from20000' => 60,
            'from50000' => 120,
            'from100000' => 300,
        ];
    }

    /** @param array<string, mixed>|null $rules */
    public static function durationForAmount(int $amount, ?array $rules = null): int
    {
        $rules = array_replace(self::defaultDurationRules(), $rules ?? []);
        $duration = match (true) {
            $amount >= 100000 => $rules['from100000'],
            $amount >= 50000 => $rules['from50000'],
            $amount >= 20000 => $rules['from20000'],
            $amount >= 10000 => $rules['from10000'],
            default => $rules['under10000'],
        };

        return max(5, min(3600, (int) $duration));
    }

    public static function extractVideoId(string $url): ?string
    {
        preg_match('~(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))([\w-]{11})~', $url, $match);

        return $match[1] ?? null;
    }
}
