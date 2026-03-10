<?php

use App\Models\User;

it('shows department report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/department');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/department')
        ->has('departments')
        ->has('byAssignee')
        ->has('filters')
        ->has('departmentsForFilter')
    );
});

it('shows printable department report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/department/print');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/department-print')
        ->has('departments')
        ->has('byAssignee')
        ->has('filters')
        ->has('generatedAt')
    );
});

it('shows department report for staff', function () {
    $staff = User::factory()->staff('IT')->create();

    $response = $this->actingAs($staff)->get('/reports/department');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/department')
    );
});

it('shows printable department report for staff', function () {
    $staff = User::factory()->staff('IT')->create();

    $response = $this->actingAs($staff)->get('/reports/department/print');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/department-print')
    );
});

it('denies pemohon access to department report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/department');

    $response->assertForbidden();
});

it('denies pemohon access to printable department report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/department/print');

    $response->assertForbidden();
});

it('redirects guests to login when accessing department report', function () {
    $response = $this->get('/reports/department');

    $response->assertRedirect();
});

it('redirects guests to login when accessing printable department report', function () {
    $response = $this->get('/reports/department/print');

    $response->assertRedirect();
});
