<?php

use App\Models\Departemen;
use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function simrsDatabaseAvailable(): bool
{
    try {
        Departemen::query()->limit(1)->get();

        return true;
    } catch (\Throwable) {
        return false;
    }
}

test('non manage user cannot open another unit show', function () {
    if (! simrsDatabaseAvailable()) {
        test()->markTestSkipped('Database SIMRS (dbsimrs) not available.');
    }

    $user = User::factory()->staff('IT')->create([
        'can_view_mutu_dashboard' => true,
        'can_manage_mutu' => false,
    ]);

    actingAs($user)->get('/simmutu/unit-kerja/IGD')->assertForbidden();
});

test('manage user can open unit kerja drilldown when simrs available', function () {
    if (! simrsDatabaseAvailable()) {
        test()->markTestSkipped('Database SIMRS (dbsimrs) not available.');
    }

    $category = MutuCategory::factory()->create();
    $indicator = MutuIndicator::factory()->for($category)->create(['is_active' => true]);
    $indicator->indicatorDepartemen()->delete();
    $indicator->indicatorDepartemen()->create(['dep_id' => 'IT']);

    $admin = User::factory()->staff('IT')->create([
        'can_manage_mutu' => true,
        'can_view_mutu_dashboard' => true,
    ]);

    $depExists = Departemen::query()->where('dep_id', 'IT')->exists();
    if (! $depExists) {
        test()->markTestSkipped('Departemen IT not present in SIMRS master.');
    }

    actingAs($admin)->get('/simmutu/unit-kerja')->assertOk();
    actingAs($admin)->get('/simmutu/unit-kerja/IT')->assertOk();
    actingAs($admin)->get("/simmutu/unit-kerja/IT/kategori/{$category->id}")->assertOk();
})->skip(fn () => ! simrsDatabaseAvailable(), 'Database SIMRS (dbsimrs) not available.');
