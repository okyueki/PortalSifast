<?php

use App\Enums\MutuCollectionFrequency;
use App\Models\MutuIndicator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('guest cannot access simmutu api endpoints', function () {
    getJson('/api/sifast/simmutu/indicators')->assertUnauthorized();
    postJson('/api/sifast/simmutu/realisations', [])->assertUnauthorized();
});

test('user with simmutu access can list indicators by own department', function () {
    $user = User::factory()->create([
        'dep_id' => 'IGD',
        'can_view_mutu_dashboard' => true,
        'can_input_mutu' => true,
    ]);

    $indicator = MutuIndicator::factory()->create([
        'collection_frequency' => MutuCollectionFrequency::Harian,
        'is_active' => true,
    ]);
    $indicator->indicatorDepartemen()->delete();
    $indicator->indicatorDepartemen()->create(['dep_id' => 'IGD']);

    actingAs($user, 'sanctum')
        ->getJson('/api/sifast/simmutu/indicators')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.0.id', $indicator->id);
});

test('user can submit simmutu realisation with generated period anchor', function () {
    $user = User::factory()->create([
        'dep_id' => 'IGD',
        'can_view_mutu_dashboard' => true,
        'can_input_mutu' => true,
    ]);

    $indicator = MutuIndicator::factory()->create([
        'collection_frequency' => MutuCollectionFrequency::Harian,
        'is_active' => true,
    ]);
    $indicator->indicatorDepartemen()->delete();
    $indicator->indicatorDepartemen()->create(['dep_id' => 'IGD']);

    actingAs($user, 'sanctum')
        ->postJson('/api/sifast/simmutu/realisations', [
            'mutu_indicator_id' => $indicator->id,
            'period_date' => '2026-04-24',
            'numerator_value' => 8,
            'denominator_value' => 10,
            'notes' => 'Input test',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.period_anchor', 'D:2026-04-24')
        ->assertJsonPath('data.dep_id', 'IGD');
});

test('user without input permission cannot submit simmutu realisation', function () {
    $user = User::factory()->create([
        'dep_id' => 'IGD',
        'can_view_mutu_dashboard' => true,
        'can_input_mutu' => false,
    ]);

    $indicator = MutuIndicator::factory()->create([
        'collection_frequency' => MutuCollectionFrequency::Harian,
        'is_active' => true,
    ]);
    $indicator->indicatorDepartemen()->delete();
    $indicator->indicatorDepartemen()->create(['dep_id' => 'IGD']);

    actingAs($user, 'sanctum')
        ->postJson('/api/sifast/simmutu/realisations', [
            'mutu_indicator_id' => $indicator->id,
            'period_date' => '2026-04-24',
            'numerator_value' => 8,
            'denominator_value' => 10,
        ])
        ->assertForbidden();
});
