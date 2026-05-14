<?php

use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use App\Models\MutuRealisation;
use App\Models\User;

use function Pest\Laravel\actingAs;

test('user without simmutu access cannot open unit kerja page', function () {
    $user = User::factory()->staff()->create([
        'can_manage_mutu' => false,
        'can_input_mutu' => false,
        'can_view_mutu_dashboard' => false,
    ]);

    actingAs($user)->get('/simmutu/unit-kerja')->assertForbidden();
});

test('user without simmutu flags cannot open simmutu dashboard', function () {
    $user = User::factory()->staff()->create([
        'can_manage_mutu' => false,
        'can_input_mutu' => false,
        'can_view_mutu_dashboard' => false,
    ]);

    actingAs($user)->get('/simmutu')->assertForbidden();
});

test('user with mutu dashboard flag can open simmutu dashboard', function () {
    $user = User::factory()->staff()->create([
        'can_view_mutu_dashboard' => true,
    ]);

    actingAs($user)->get('/simmutu')->assertOk();
});

test('user with dashboard flag only cannot open mutu categories', function () {
    $user = User::factory()->staff()->create([
        'can_view_mutu_dashboard' => true,
        'can_manage_mutu' => false,
    ]);

    actingAs($user)->get('/simmutu/categories')->assertForbidden();
});

test('user with mutu dashboard flag can open recap per departemen', function () {
    $user = User::factory()->staff()->create([
        'can_view_mutu_dashboard' => true,
    ]);

    actingAs($user)->get('/simmutu/recap/departments')->assertOk();
});

test('user with mutu dashboard flag can open rekap mutu (realisations index)', function () {
    $user = User::factory()->staff()->create([
        'can_view_mutu_dashboard' => true,
        'can_input_mutu' => false,
    ]);

    actingAs($user)->get('/simmutu/realisations')->assertOk();
});

test('user with manage mutu can open mutu categories', function () {
    $user = User::factory()->staff()->create([
        'can_manage_mutu' => true,
    ]);

    actingAs($user)->get('/simmutu/categories')->assertOk();
});

test('superadmin email can open simmutu without mutu flags', function () {
    $email = 'superadmin-simmutu+'.uniqid('', true).'@example.com';
    config()->set('auth.superadmin_emails', [$email]);

    $user = User::factory()->staff()->create([
        'email' => $email,
        'can_manage_mutu' => false,
        'can_input_mutu' => false,
        'can_view_mutu_dashboard' => false,
    ]);

    actingAs($user)->get('/simmutu')->assertOk();
});

test('user with input mutu can store realisation for mapped department', function () {
    $category = MutuCategory::factory()->create();
    $indicator = MutuIndicator::factory()->for($category)->create();

    $user = User::factory()->staff('IT')->create([
        'can_input_mutu' => true,
        'can_view_mutu_dashboard' => true,
    ]);

    actingAs($user)->post('/simmutu/realisations', [
        'mutu_indicator_id' => $indicator->id,
        'dep_id' => 'IT',
        'period_date' => '2026-04-24',
        'numerator_value' => 10,
        'denominator_value' => 20,
    ])->assertRedirect();

    expect(MutuRealisation::query()->count())->toBe(1);
    expect(MutuRealisation::query()->first()?->period_anchor)->toBe('M:2026-04');
});
