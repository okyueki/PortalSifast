<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

test('user with payroll access can open payroll page', function () {
    $user = User::factory()->create([
        'can_access_payroll' => true,
    ]);

    actingAs($user)->get('/payroll')->assertOk();
});

test('user without payroll access cannot open payroll page', function () {
    $user = User::factory()->create([
        'can_access_payroll' => false,
    ]);

    actingAs($user)->get('/payroll')->assertForbidden();
});

test('superadmin email bypasses payroll access flag', function () {
    $superadminEmail = 'superadmin+'.uniqid().'@example.com';
    config()->set('auth.superadmin_emails', [$superadminEmail]);

    $user = User::factory()->create([
        'email' => $superadminEmail,
        'can_access_payroll' => false,
    ]);

    actingAs($user)->get('/payroll')->assertOk();
});
