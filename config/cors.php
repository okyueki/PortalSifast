<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Untuk frontend yang di-host di domain lain (mis. Lovable, Vercel),
    | daftarkan origin di CORS_ALLOWED_ORIGINS (.env). Tanpa ini, browser
    | akan memblokir request dengan error "No 'Access-Control-Allow-Origin'".
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login'],

    'allowed_methods' => ['*'],

    'allowed_origins' => env('CORS_ALLOWED_ORIGINS')
        ? array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS'))))
        : ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => (bool) env('CORS_ALLOWED_ORIGINS'),

];
