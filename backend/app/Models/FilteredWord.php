<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FilteredWord extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['words' => 'array'];
    }
}
