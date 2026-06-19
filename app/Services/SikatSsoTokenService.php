<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class SikatSsoTokenService
{
    public function isConfigured(): bool
    {
        return filled($this->secret());
    }

    public function generateToken(string $nik): string
    {
        $secret = $this->secret();

        if ($secret === null || $secret === '') {
            throw new RuntimeException('Integrasi SIKAT belum dikonfigurasi.');
        }

        $payload = [
            'nik' => $nik,
            'exp' => now()->addSeconds((int) config('sikat.token_ttl_seconds', 90))->timestamp,
            'nonce' => (string) Str::uuid(),
        ];

        $payloadJson = json_encode($payload, JSON_THROW_ON_ERROR);
        $payloadB64 = rtrim(strtr(base64_encode($payloadJson), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $payloadB64, $secret);

        return $payloadB64.'.'.$signature;
    }

    /**
     * @return array{nik: string, exp: int, nonce: string}
     */
    public function parsePayload(string $token): array
    {
        $secret = $this->secret();

        if ($secret === null || $secret === '') {
            throw new RuntimeException('Integrasi SIKAT belum dikonfigurasi.');
        }

        $parts = explode('.', $token, 2);

        if (count($parts) !== 2) {
            throw new RuntimeException('Format token tidak valid.');
        }

        [$payloadB64, $signature] = $parts;
        $expected = hash_hmac('sha256', $payloadB64, $secret);

        if (! hash_equals($expected, $signature)) {
            throw new RuntimeException('Signature token tidak valid.');
        }

        $payloadJson = base64_decode(strtr($payloadB64, '-_', '+/'), true);

        if ($payloadJson === false) {
            throw new RuntimeException('Payload token tidak valid.');
        }

        /** @var array{nik?: string, exp?: int, nonce?: string} $payload */
        $payload = json_decode($payloadJson, true, 512, JSON_THROW_ON_ERROR);

        if (! isset($payload['nik'], $payload['exp'], $payload['nonce'])) {
            throw new RuntimeException('Payload token tidak lengkap.');
        }

        return [
            'nik' => (string) $payload['nik'],
            'exp' => (int) $payload['exp'],
            'nonce' => (string) $payload['nonce'],
        ];
    }

    /**
     * @return array{nik: string, exp: int, nonce: string}
     */
    public function validateToken(string $token): array
    {
        $payload = $this->parsePayload($token);

        if ($payload['exp'] < time()) {
            throw new RuntimeException('Token SSO sudah kedaluwarsa.');
        }

        $cacheKey = 'sikat_sso_nonce:'.$payload['nonce'];
        $ttl = (int) config('sikat.nonce_cache_ttl_seconds', 120);

        if (! Cache::add($cacheKey, true, $ttl)) {
            throw new RuntimeException('Token SSO sudah pernah digunakan.');
        }

        return $payload;
    }

    public function buildRedirectUrl(string $nik, string $redirectPath): string
    {
        $baseUrl = rtrim((string) config('services.sikat.base_url'), '/');
        $token = $this->generateToken($nik);

        return $baseUrl.'/sso/portalsifast?'.http_build_query([
            'token' => $token,
            'redirect' => $redirectPath,
        ]);
    }

    private function secret(): ?string
    {
        $secret = config('services.sikat.sso_secret');

        return is_string($secret) && $secret !== '' ? $secret : null;
    }
}
