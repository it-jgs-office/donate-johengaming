<?php

return [
    'secret' => env('JWT_SECRET', env('APP_KEY')),
    'issuer' => env('JWT_ISSUER', env('APP_URL', 'http://localhost:8001')),
    'ttl' => (int) env('JWT_TTL', 120),
    'remember_ttl' => (int) env('JWT_REMEMBER_TTL', 43200),
    'algorithm' => 'HS256',
];
