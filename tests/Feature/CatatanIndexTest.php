<?php

use App\Models\User;
use App\Models\WorkNote;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

test('guest cannot access catatan index', function () {
    get(route('catatan.index'))->assertRedirect();
});

test('authenticated user can view catatan index', function () {
    $user = User::factory()->create();

    $response = actingAs($user)->get(route('catatan.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('catatan/index')
        ->has('notes')
        ->has('selectedNote')
    );
});

test('authenticated user sees own notes only', function () {
    $user = User::factory()->create();
    WorkNote::factory()->count(2)->for($user)->create();
    $other = User::factory()->create();
    WorkNote::factory()->count(1)->for($other)->create();

    $response = actingAs($user)->get(route('catatan.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('catatan/index')
        ->where('notes', fn ($notes) => count($notes) === 2)
    );
});
