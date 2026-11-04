<?php

namespace App\Providers;

use App\Models\User;
use App\Services\JwtTokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::viaRequest('jwt', function (Request $request): ?User {
            return app(JwtTokenService::class)->userFromRequest($request);
        });
    }
}
