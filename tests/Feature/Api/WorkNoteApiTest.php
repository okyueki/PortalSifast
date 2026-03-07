<?php

use App\Models\User;
use App\Models\WorkNote;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

test('guest cannot access work notes api', function () {
    getJson('/api/work-notes')->assertUnauthorized();
    getJson('/api/work-notes/1')->assertUnauthorized();
});

test('user can list only own work notes', function () {
    $user = User::factory()->create(['role' => 'staff']);
    WorkNote::factory()->count(2)->for($user)->create();
    $other = User::factory()->create();
    WorkNote::factory()->for($other)->create();

    $response = actingAs($user, 'sanctum')->getJson('/api/work-notes');

    $response->assertOk();
    $response->assertJsonPath('data', fn ($data) => count($data) === 2);
});

test('user cannot show another user work note', function () {
    $owner = User::factory()->create();
    $note = WorkNote::factory()->for($owner)->create();
    $other = User::factory()->create(['role' => 'staff']);

    actingAs($other, 'sanctum')->getJson("/api/work-notes/{$note->id}")->assertForbidden();
});

test('admin can show any work note', function () {
    $owner = User::factory()->create();
    $note = WorkNote::factory()->for($owner)->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $response = actingAs($admin, 'sanctum')->getJson("/api/work-notes/{$note->id}");

    $response->assertOk();
    $response->assertJsonPath('data.id', (string) $note->id);
});

test('user can create work note', function () {
    $user = User::factory()->create();

    $response = actingAs($user, 'sanctum')->postJson('/api/work-notes', [
        'title' => 'Catatan API',
        'icon' => '📄',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.title', 'Catatan API');
    $this->assertDatabaseHas('work_notes', ['title' => 'Catatan API', 'user_id' => $user->id]);
});

test('user can update own work note', function () {
    $user = User::factory()->create();
    $note = WorkNote::factory()->for($user)->create(['title' => 'Lama']);

    $response = actingAs($user, 'sanctum')->patchJson("/api/work-notes/{$note->id}", [
        'title' => 'Baru',
    ]);

    $response->assertOk();
    $response->assertJsonPath('data.title', 'Baru');
});

test('user cannot update another user work note', function () {
    $owner = User::factory()->create();
    $note = WorkNote::factory()->for($owner)->create();
    $other = User::factory()->create();

    actingAs($other, 'sanctum')->patchJson("/api/work-notes/{$note->id}", ['title' => 'Hack'])
        ->assertForbidden();
});

test('admin can update any work note', function () {
    $owner = User::factory()->create();
    $note = WorkNote::factory()->for($owner)->create(['title' => 'Lama']);
    $admin = User::factory()->create(['role' => 'admin']);

    $response = actingAs($admin, 'sanctum')->patchJson("/api/work-notes/{$note->id}", ['title' => 'Diedit admin']);

    $response->assertOk();
    $response->assertJsonPath('data.title', 'Diedit admin');
});

test('user can delete own work note', function () {
    $user = User::factory()->create();
    $note = WorkNote::factory()->for($user)->create();

    $response = actingAs($user, 'sanctum')->deleteJson("/api/work-notes/{$note->id}");

    $response->assertOk();
    $this->assertModelMissing($note);
});

test('user cannot delete another user work note', function () {
    $owner = User::factory()->create();
    $note = WorkNote::factory()->for($owner)->create();
    $other = User::factory()->create();

    actingAs($other, 'sanctum')->deleteJson("/api/work-notes/{$note->id}")->assertForbidden();
    $note->refresh();
    $this->assertModelExists($note);
});
