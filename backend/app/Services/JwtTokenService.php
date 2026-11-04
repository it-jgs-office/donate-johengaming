<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use LogicException;
use Throwable;

final class JwtTokenService
{
    /**
     * @return array{token: string, expires_in: int}
     */
    public function issue(User $user, bool $rememberBrowser = false): array
    {
        $issuedAt = now();
        $expiresIn = $this->expiresIn($rememberBrowser);
        $payload = [
            'iss' => config('jwt.issuer'),
            'iat' => $issuedAt->timestamp,
            'nbf' => $issuedAt->timestamp,
            'exp' => $issuedAt->copy()->addSeconds($expiresIn)->timestamp,
            'jti' => (string) Str::uuid(),
            'sub' => (string) $user->getKey(),
            'role' => $user->role,
        ];

        return [
            'token' => JWT::encode($payload, $this->secret(), config('jwt.algorithm')),
            'expires_in' => $expiresIn,
        ];
    }

    public function userFromRequest(Request $request): ?User
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        try {
            $payload = JWT::decode($token, new Key($this->secret(), config('jwt.algorithm')));

            if (! isset($payload->sub, $payload->iss)
                || ! hash_equals((string) config('jwt.issuer'), (string) $payload->iss)) {
                return null;
            }

            $user = User::find($payload->sub);

            return $user?->is_active ? $user : null;
        } catch (Throwable) {
            return null;
        }
    }

    private function expiresIn(bool $rememberBrowser): int
    {
        $minutes = $rememberBrowser
            ? (int) config('jwt.remember_ttl')
            : (int) config('jwt.ttl');

        return $minutes * 60;
    }

    private function secret(): string
    {
        $secret = (string) config('jwt.secret');

        if ($secret === '') {
            throw new LogicException('JWT secret is not configured.');
        }

        return $secret;
    }
}
