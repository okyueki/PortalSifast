<?php

/*
| CORS: pastikan CORS_ALLOWED_ORIGINS di .env (tanpa spasi ekstra).
| Setelah ubah .env, jalankan: php artisan config:clear
*/

$origins = env('CORS_ALLOWED_ORIGINS', '');
$allowed_origins = $origins !== '' && $origins !== null
    ? array_values(array_filter(array_map('trim', explode(',', $origins))))
    : ['*'];

return [

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowed_origins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => $allowed_origins !== ['*'],

];
