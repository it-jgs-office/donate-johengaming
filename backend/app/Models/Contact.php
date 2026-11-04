<?php

namespace App\Models;

use App\Events\AdminDataUpdated;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $guarded = [];

    protected static function booted(): void
    {
        static::saved(function (): void {
            AdminDataUpdated::dispatch('feedbacks');
        });
        static::deleted(function (): void {
            AdminDataUpdated::dispatch('feedbacks');
        });
    }
}
