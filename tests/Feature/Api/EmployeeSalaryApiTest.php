<?php

use App\Models\EmployeeSalary;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

test('guest cannot access salary api', function () {
    getJson('/api/sifast/payroll')->assertUnauthorized();
});

test('user can only see own salaries', function () {
    $me = User::factory()->create(['simrs_nik' => '01.02.03.2000']);
    $other = User::factory()->create(['simrs_nik' => '99.99.99.9999']);

    $mine = EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => $me->simrs_nik,
        'employee_name' => 'Saya',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '10000',
        'zakat' => '0',
        'raw_row' => ['nik' => $me->simrs_nik],
    ]);

    $notMine = EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => $other->simrs_nik,
        'employee_name' => 'Orang lain',
        'unit' => 'IT',
        'penerimaan' => '999999',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => $other->simrs_nik],
    ]);

    $response = actingAs($me, 'sanctum')->getJson('/api/sifast/payroll');
    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.id', $mine->id);

    actingAs($me, 'sanctum')->getJson("/api/sifast/payroll/{$mine->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $mine->id);

    actingAs($me, 'sanctum')->getJson("/api/sifast/payroll/{$notMine->id}")
        ->assertForbidden();
});

test('service token requires nik query or header', function () {
    $service = User::factory()->create([
        'email' => 'api-service@portal.local',
        'simrs_nik' => null,
        'role' => 'pemohon',
    ]);

    $response = actingAs($service, 'sanctum')
        ->getJson('/api/sifast/payroll?page=1&per_page=15');

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Parameter nik wajib diisi atau akun Anda belum terhubung dengan NIK kepegawaian.')
        ->assertJsonPath('example_query', '/api/sifast/payroll?nik=03.09.07.1998&page=1&per_page=12');

    expect($response->json('hint'))->toContain('VITE');
});

test('service token can list payroll with nik query', function () {
    $service = User::factory()->create([
        'email' => 'api-service@portal.local',
        'simrs_nik' => null,
    ]);

    $salary = EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '03.09.07.1998',
        'employee_name' => 'Pegawai',
        'unit' => 'IT',
        'penerimaan' => '5000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => '03.09.07.1998'],
    ]);

    actingAs($service, 'sanctum')
        ->getJson('/api/sifast/payroll?nik=03.09.07.1998&per_page=15')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $salary->id)
        ->assertJsonPath('per_page', 15);
});

test('service token can list payroll with simrs_nik query alias', function () {
    $service = User::factory()->create([
        'email' => 'api-service@portal.local',
        'simrs_nik' => null,
    ]);

    EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '88.88.88.8888',
        'employee_name' => 'Alias',
        'unit' => 'IT',
        'penerimaan' => '1000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => '88.88.88.8888'],
    ]);

    actingAs($service, 'sanctum')
        ->getJson('/api/sifast/payroll?simrs_nik=88.88.88.8888')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('service token can list payroll with X-Sifast-Nik header', function () {
    $service = User::factory()->create([
        'email' => 'integrations@example.org',
        'simrs_nik' => null,
        'role' => 'service',
    ]);

    EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '01.01.01.2001',
        'employee_name' => 'Via Header',
        'unit' => 'HR',
        'penerimaan' => '3000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => '01.01.01.2001'],
    ]);

    actingAs($service, 'sanctum')
        ->withHeader('X-Sifast-Nik', '01.01.01.2001')
        ->getJson('/api/sifast/payroll?page=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
