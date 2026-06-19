<?php

use App\Models\User;
use App\Services\SikatSsoTokenService;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    config()->set('services.sikat.base_url', 'https://sikat.test');
    config()->set('services.sikat.sso_secret', 'test-portalsifast-sikat-sso-secret-key');
    config()->set('sikat.allowed_redirect_paths', [
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
    ]);
});

function sikatTestNik(): string
{
    return '99.'.uniqid().'.1998';
}

test('guest is redirected to login', function () {
    get('/integrations/sikat/go?to=/surat_masuk')
        ->assertRedirect(route('login'));
});

test('user without simrs nik is redirected to dashboard with error', function () {
    $user = User::factory()->create([
        'simrs_nik' => '',
        'email_verified_at' => now(),
    ]);

    actingAs($user)
        ->get('/integrations/sikat/go?to=/surat_masuk')
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('error');
});

test('user with simrs nik is redirected to sikat sso url', function () {
    $nik = sikatTestNik();
    $user = User::factory()->create([
        'simrs_nik' => $nik,
        'email_verified_at' => now(),
    ]);

    $response = actingAs($user)->get('/integrations/sikat/go?to=/surat_masuk');

    $response->assertRedirect();
    $target = $response->headers->get('Location');

    expect($target)->toStartWith('https://sikat.test/sso/portalsifast?');
    expect($target)->toContain('token=');
    expect($target)->toContain('redirect=%2Fsurat_masuk');

    parse_str((string) parse_url($target, PHP_URL_QUERY), $query);
    expect($query)->toHaveKeys(['token', 'redirect']);

    $payload = app(SikatSsoTokenService::class)->parsePayload($query['token']);
    expect($payload['nik'])->toBe($nik);
});

test('invalid destination path is rejected', function () {
    $user = User::factory()->create([
        'simrs_nik' => sikatTestNik(),
        'email_verified_at' => now(),
    ]);

    actingAs($user)
        ->get('/integrations/sikat/go?to=https://evil.com')
        ->assertBadRequest();
});

test('unlisted destination path is rejected', function () {
    $user = User::factory()->create([
        'simrs_nik' => sikatTestNik(),
        'email_verified_at' => now(),
    ]);

    actingAs($user)
        ->get('/integrations/sikat/go?to=/admin')
        ->assertBadRequest();
});

test('sub path under allowed prefix is accepted', function () {
    $user = User::factory()->create([
        'simrs_nik' => sikatTestNik(),
        'email_verified_at' => now(),
    ]);

    actingAs($user)
        ->get('/integrations/sikat/go?to=/surat_masuk/42')
        ->assertRedirect()
        ->assertRedirectContains('redirect=%2Fsurat_masuk%2F42');
});

test('missing sso secret returns service unavailable', function () {
    config()->set('services.sikat.sso_secret', null);

    $user = User::factory()->create([
        'simrs_nik' => sikatTestNik(),
        'email_verified_at' => now(),
    ]);

    actingAs($user)
        ->get('/integrations/sikat/go?to=/surat_masuk')
        ->assertStatus(503);
});

test('sikat sso token service rejects tampered signature', function () {
    $service = app(SikatSsoTokenService::class);
    $token = $service->generateToken(sikatTestNik());

    expect(fn () => $service->parsePayload($token.'x'))
        ->toThrow(RuntimeException::class);
});

test('allowed sikat redirect paths accept exact and nested routes', function (string $path, bool $allowed) {
    expect(\App\Support\SikatRedirectPath::isAllowed($path))->toBe($allowed);
})->with([
    '/surat_masuk' => ['/surat_masuk', true],
    '/surat_masuk/1' => ['/surat_masuk/1', true],
    '/surat_keluar' => ['/surat_keluar', true],
    '/admin' => ['/admin', false],
    'external url' => ['https://evil.com/surat_masuk', false],
    'empty' => ['', false],
]);
