<?php

use App\Models\User;

it('shows daily activity report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/daily-activity');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/daily-activity')
        ->has('activities')
        ->has('summary')
        ->has('date')
        ->has('filters')
        ->has('canSelectUser')
    );
});

it('shows daily activity report for staff', function () {
    $staff = User::factory()->staff('IT')->create();

    $response = $this->actingAs($staff)->get('/reports/daily-activity');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/daily-activity')
        ->where('canSelectUser', false)
    );
});

it('denies pemohon access to daily activity report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/daily-activity');

    $response->assertForbidden();
});

it('redirects guests to login when accessing daily activity report', function () {
    $response = $this->get('/reports/daily-activity');

    $response->assertRedirect();
});
