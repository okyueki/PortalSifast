<?php

use App\Models\User;

it('shows technician report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/technician');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/technician')
        ->has('technician')
        ->has('totalTickets')
        ->has('resolvedCount')
        ->has('categories')
        ->has('tags')
        ->has('filters')
        ->has('canSelectTechnician')
    );
});

it('shows technician report for staff with own data', function () {
    $staff = User::factory()->staff('IT')->create();

    $response = $this->actingAs($staff)->get('/reports/technician');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/technician')
        ->where('canSelectTechnician', false)
        ->where('technician.id', $staff->id)
    );
});

it('denies pemohon access to technician report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/technician');

    $response->assertForbidden();
});

it('redirects guests to login when accessing technician report', function () {
    $response = $this->get('/reports/technician');

    $response->assertRedirect();
});
