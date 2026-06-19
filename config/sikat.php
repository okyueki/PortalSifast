<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SSO token lifetime (seconds)
    |--------------------------------------------------------------------------
    */

    'token_ttl_seconds' => (int) env('SIKAT_SSO_TOKEN_TTL', 90),

    /*
    |--------------------------------------------------------------------------
    | Allowed redirect paths (SIKAT legacy)
    |--------------------------------------------------------------------------
    |
    | Sub-paths are allowed when they share the same prefix, e.g. /surat_masuk/1
    |
    */

    'allowed_redirect_paths' => [
        '/surat_masuk',
        '/surat_keluar',
        '/surat_edaran',
        '/spo',
        '/cuti',
        '/ijin',
        '/pengajuan_lembur',
        '/verifikasi_pengajuan_libur',
        '/verifikasi_pengajuan_lembur',
        '/sifat_surat',
        '/klasifikasi_surat',
        '/template_surat',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed inbound redirect paths (Portal Sifast)
    |--------------------------------------------------------------------------
    |
    | Paths SIKAT may send users to via GET /sso/sikat?redirect=...
    |
    */

    'allowed_inbound_redirect_paths' => [
        '/dashboard',
        '/tickets',
        '/tickets/create',
        '/tickets/board',
        '/chat',
        '/pegawai',
        '/catatan',
        '/reports',
        '/projects',
        '/emergency-reports',
        '/payroll',
        '/payroll/dashboard',
        '/inventaris',
        '/simmutu',
    ],

    /*
    |--------------------------------------------------------------------------
    | Nonce cache TTL (seconds) — single-use token
    |--------------------------------------------------------------------------
    */

    'nonce_cache_ttl_seconds' => (int) env('SIKAT_SSO_NONCE_TTL', 120),

];
