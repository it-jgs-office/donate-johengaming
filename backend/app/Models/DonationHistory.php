<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationHistory extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['data' => 'array', 'donated_at' => 'datetime'];
    }
}
