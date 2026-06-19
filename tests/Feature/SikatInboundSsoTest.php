<?php

use App\Models\User;
use App\Services\SikatSsoTokenService;
use Illuminate\Support\Facades\Cache;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    config()->set('services.sikat.sso_secret', 'test-portalsifast-sikat-sso-secret-key');
    config()->set('sikat.allowed_inbound_redirect_paths', [
        '/dashboard',
        '/tickets',
        '/tickets/create',
        '/chat',
    ]);
    config()->set('sikat.nonce_cache_ttl_seconds', 120);

    Cache::flush();
});

function inboundSsoNik(): string
{
    return '88.'.uniqid().'.1998';
}

function inboundSsoUrl(string $nik, string $redirect = '/dashboard'): string
{
    $token = app(SikatSsoTokenService::class)->generateToken($nik);

    return '/sso/sikat?'.http_build_query([
        'token' => $token,
        'redirect' => $redirect,
    ]);
}

test('valid token logs user in and redirects to dashboard', function () {
    $nik = inboundSsoNik();
    User::factory()->create([
        'simrs_nik' => $nik,
        'email_verified_at' => now(),
    ]);

    $response = get(inboundSsoUrl($nik));

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticated();
    expect(auth()->user()?->simrs_nik)->toBe($nik);
});

test('valid token with custom redirect path', function () {
    $nik = inboundSsoNik();
    User::factory()->create([
        'simrs_nik' => $nik,
        'email_verified_at' => now(),
    ]);

    get(inboundSsoUrl($nik, '/tickets'))
        ->assertRedirect('/tickets');
});

test('missing token returns bad request', function () {
    get('/sso/sikat?redirect=/dashboard')->assertBadRequest();
});

test('invalid redirect path returns bad request', function () {
    $nik = inboundSsoNik();
    User::factory()->create(['simrs_nik' => $nik, 'email_verified_at' => now()]);

    get(inboundSsoUrl($nik, '/admin'))->assertBadRequest();
});

test('tampered token returns forbidden', function () {
    $nik = inboundSsoNik();
    User::factory()->create(['simrs_nik' => $nik, 'email_verified_at' => now()]);

    get('/sso/sikat?token=invalid.token&redirect=/dashboard')->assertForbidden();
});

test('reused token returns forbidden', function () {
    $nik = inboundSsoNik();
    User::factory()->create(['simrs_nik' => $nik, 'email_verified_at' => now()]);

    $url = inboundSsoUrl($nik);

    get($url)->assertRedirect('/dashboard');
    get($url)->assertForbidden();
});

test('unknown nik without portal user returns forbidden', function () {
    $nik = inboundSsoNik();

    get(inboundSsoUrl($nik))->assertForbidden();
});

test('missing sso secret returns service unavailable', function () {
    config()->set('services.sikat.sso_secret', null);

    $nik = inboundSsoNik();
    User::factory()->create(['simrs_nik' => $nik, 'email_verified_at' => now()]);

    get('/sso/sikat?token=dummy.token&redirect=/dashboard')->assertStatus(503);
});

test('already logged in user is replaced by sso login', function () {
    $existing = User::factory()->create(['email_verified_at' => now()]);
    $nik = inboundSsoNik();
    $target = User::factory()->create([
        'simrs_nik' => $nik,
        'email_verified_at' => now(),
    ]);

    actingAs($existing);

    get(inboundSsoUrl($nik))->assertRedirect('/dashboard');

    expect(auth()->id())->toBe($target->id);
});
