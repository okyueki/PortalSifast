<?php

use App\Models\User;

it('shows requester report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/requesters');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/requesters')
        ->has('departments')
        ->has('topRequesters')
        ->has('filters')
        ->has('departmentsForFilter')
    );
});

it('denies pemohon access to requester report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/requesters');

    $response->assertForbidden();
});

it('redirects guests to login when accessing requester report', function () {
    $response = $this->get('/reports/requesters');

    $response->assertRedirect();
});
