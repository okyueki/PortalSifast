<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('redirects guest from chat index', function (): void {
    $response = $this->get('/chat');
    $response->assertRedirect('/login');
});

it('shows chat index for authenticated user', function (): void {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/chat');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('chat/index')->has('conversations')->has('users'));
});

it('creates conversation and redirects to show', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $response = $this->actingAs($user)->post('/chat', ['user_id' => $other->id]);
    $response->assertRedirect();
    $conversation = Conversation::query()->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
        ->whereHas('participants', fn ($q) => $q->where('user_id', $other->id))
        ->first();
    expect($conversation)->not->toBeNull();
    $response->assertRedirect("/chat/{$conversation->id}");
});

it('user can send message in conversation', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $conversation = Conversation::firstOrCreateBetween($user, $other);
    $response = $this->actingAs($user)->post("/chat/{$conversation->id}/messages", [
        'body' => 'Halo!',
    ]);
    $response->assertRedirect("/chat/{$conversation->id}");
    $conversation->refresh();
    expect($conversation->messages()->count())->toBe(1);
    expect($conversation->messages->first()->body)->toBe('Halo!');
});
