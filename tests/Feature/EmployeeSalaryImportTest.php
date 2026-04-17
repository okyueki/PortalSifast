<?php

use App\Models\EmployeeSalary;
use App\Models\User;
use Illuminate\Http\UploadedFile;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

test('guest cannot import employee salaries', function () {
    postJson('/api/sifast/payroll/import', [])->assertUnauthorized();
});

test('admin can open payroll import page', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)->get('/payroll/import')->assertOk();
});

test('admin can open payroll index page', function () {
    $admin = User::factory()->admin()->create();

    actingAs($admin)->get('/payroll')->assertOk();
});

test('payroll index supports search and unit filters', function () {
    $admin = User::factory()->admin()->create();

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '11.11.11.1111',
        'employee_name' => 'Karyawan A',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => '11.11.11.1111'],
    ]);

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '22.22.22.2222',
        'employee_name' => 'Karyawan B',
        'unit' => 'Keuangan',
        'penerimaan' => '1000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => ['nik' => '22.22.22.2222'],
    ]);

    $response = actingAs($admin)->get('/payroll?q=Karyawan%20A&unit=IT');
    $response->assertOk();
    $response->assertSee('Karyawan A');
    $response->assertDontSee('Karyawan B');
});

test('payroll index supports sorting', function () {
    $admin = User::factory()->admin()->create();

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '11.11.11.1111',
        'employee_name' => 'Zara',
        'unit' => 'IT',
        'penerimaan' => '3000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => [],
    ]);

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '22.22.22.2222',
        'employee_name' => 'Andi',
        'unit' => 'IT',
        'penerimaan' => '2000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => [],
    ]);

    $response = actingAs($admin)->get('/payroll?sort=employee_name&dir=asc');
    $response->assertOk();

    $data = $response->original->getData()['page']['props']['salaries']['data'];
    expect($data[0]['employee_name'])->toBe('Andi');
    expect($data[1]['employee_name'])->toBe('Zara');

    $response = actingAs($admin)->get('/payroll?sort=penerimaan&dir=desc');
    $response->assertOk();

    $data = $response->original->getData()['page']['props']['salaries']['data'];
    expect((float) $data[0]['penerimaan'])->toBe(3000000.0);
});

test('payroll index can export csv', function () {
    $admin = User::factory()->admin()->create();

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '11.11.11.1111',
        'employee_name' => 'Export Test',
        'unit' => 'IT',
        'penerimaan' => '5000000',
        'pajak' => '100000',
        'zakat' => '50000',
        'raw_row' => [],
    ]);

    $response = actingAs($admin)->get('/payroll?export=csv');
    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    $response->assertDownload();

    $content = $response->streamedContent();
    expect($content)->toContain('Export Test');
    expect($content)->toContain('11.11.11.1111');
    expect($content)->toContain('5000000');
});

test('payroll index returns summary totals', function () {
    $admin = User::factory()->admin()->create();

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '11.11.11.1111',
        'employee_name' => 'A',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '100000',
        'zakat' => '25000',
        'raw_row' => [],
    ]);

    \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '22.22.22.2222',
        'employee_name' => 'B',
        'unit' => 'IT',
        'penerimaan' => '2000000',
        'pajak' => '200000',
        'zakat' => '50000',
        'raw_row' => [],
    ]);

    $response = actingAs($admin)->get('/payroll');
    $response->assertOk();

    $summary = $response->original->getData()['page']['props']['summary'];
    expect($summary['total_penerimaan'])->toBe(3000000.0);
    expect($summary['total_pajak'])->toBe(300000.0);
    expect($summary['total_zakat'])->toBe(75000.0);
});

test('admin can open payroll show page for a salary', function () {
    $admin = User::factory()->admin()->create();

    $salary = \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2025-12-01',
        'simrs_nik' => '01.01.01.2000',
        'employee_name' => 'Contoh Pegawai',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '50000',
        'zakat' => '25000',
        'raw_row' => [
            'Nama' => 'Contoh Pegawai',
            'Instalasi/Unit' => 'IT',
            'NIK' => '01.01.01.2000',
            'Jumlah' => '1000000',
        ],
    ]);

    actingAs($admin)->get("/payroll/{$salary->id}")->assertOk();
});

test('admin can bulk delete salaries', function () {
    $admin = User::factory()->admin()->create();

    $salary1 = \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '11.11.11.1111',
        'employee_name' => 'Bulk Delete A',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => [],
    ]);

    $salary2 = \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2026-02-01',
        'simrs_nik' => '22.22.22.2222',
        'employee_name' => 'Bulk Delete B',
        'unit' => 'IT',
        'penerimaan' => '2000000',
        'pajak' => '0',
        'zakat' => '0',
        'raw_row' => [],
    ]);

    actingAs($admin)
        ->post('/payroll/bulk-delete', ['ids' => [$salary1->id, $salary2->id]])
        ->assertRedirect('/payroll');

    $this->assertDatabaseMissing('employee_salaries', ['id' => $salary1->id]);
    $this->assertDatabaseMissing('employee_salaries', ['id' => $salary2->id]);
});

test('admin can update and delete a salary', function () {
    $admin = User::factory()->admin()->create();

    $salary = \App\Models\EmployeeSalary::query()->create([
        'period_start' => '2025-12-01',
        'simrs_nik' => '01.01.01.2000',
        'employee_name' => 'Lama',
        'unit' => 'IT',
        'penerimaan' => '1000000',
        'pajak' => '50000',
        'zakat' => '25000',
        'raw_row' => ['Nama' => 'Lama'],
    ]);

    actingAs($admin)
        ->patch("/payroll/{$salary->id}", [
            'simrs_nik' => '01.01.01.2000',
            'employee_name' => 'Baru',
            'unit' => 'Keuangan',
            'npwp' => '123',
            'penerimaan' => 2000000,
            'pajak' => 100000,
            'zakat' => 50000,
        ])
        ->assertRedirect();

    expect($salary->fresh()->employee_name)->toBe('Baru');

    actingAs($admin)
        ->delete("/payroll/{$salary->id}")
        ->assertRedirect('/payroll');

    $this->assertDatabaseMissing('employee_salaries', ['id' => $salary->id]);
});

test('can import employee salaries from csv and match user by simrs_nik', function () {
    $importer = User::factory()->admin()->create();

    $employee = User::factory()->create([
        'name' => 'Sri Rahmawati, SE',
        'simrs_nik' => '03.09.07.1998',
    ]);

    $csv = implode("\n", [
        'No. Ref;No. Gaji;Nama;Instalasi/Unit;NIK;NPWP;Penerimaan;Pembulatan;Pajak;Zakat',
        '2;2;Sri Rahmawati, SE;Kabag Umum & Adm;03.09.07.1998;665022430603000;Rp8.025.046;Rp8.025.046;156.819;-',
        '',
    ]);

    $file = UploadedFile::fake()->createWithContent('GJ.csv', $csv);

    $response = actingAs($importer, 'sanctum')
        ->post('/api/sifast/payroll/import', [
            'period' => '2025-12',
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

    $response->assertOk();
    $response->assertJsonPath('imported', 1);
    $response->assertJsonPath('skipped', 0);
    $response->assertJsonPath('period_start', '2025-12-01');

    $salary = EmployeeSalary::query()
        ->where('simrs_nik', '03.09.07.1998')
        ->whereDate('period_start', '2025-12-01')
        ->first();

    expect($salary)->not->toBeNull();
    expect($salary->user_id)->toBe($employee->id);
    expect($salary->imported_by)->toBe($importer->id);
});
