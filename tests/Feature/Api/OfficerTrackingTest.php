<?php

use App\Models\EmergencyReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->officer = User::factory()->staff('DRIVER')->create([
        'simrs_nik' => '987654321',
        'password' => bcrypt('rahasia123'),
    ]);
});

it('officer can login with nik and password', function (): void {
    $response = $this->postJson('/api/sifast/officer/auth/login', [
        'nik' => '987654321',
        'password' => 'rahasia123',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.officer.id', $this->officer->id)
        ->assertJsonPath('data.officer.simrs_nik', '987654321')
        ->assertJsonPath('data.officer.dep_id', 'DRIVER')
        ->assertJsonStructure(['data' => ['token', 'officer' => ['id', 'name', 'simrs_nik', 'dep_id', 'phone']]]);
});

it('officer login fails with wrong password', function (): void {
    $response = $this->postJson('/api/sifast/officer/auth/login', [
        'nik' => '987654321',
        'password' => 'wrong',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('success', false);
});

it('officer login fails when user is not officer', function (): void {
    $pemohon = User::factory()->pemohon()->create([
        'simrs_nik' => '111222333',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/sifast/officer/auth/login', [
        'nik' => '111222333',
        'password' => 'password',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('success', false);
});

it('officer can update location when assigned to report', function (): void {
    $report = EmergencyReport::create([
        'user_id' => User::factory()->pemohon()->create()->id,
        'latitude' => -6.2,
        'longitude' => 106.816666,
        'address' => 'Jl. Test',
        'category' => 'ambulance',
        'status' => EmergencyReport::STATUS_IN_PROGRESS,
        'assigned_operator_id' => $this->officer->id,
    ]);

    $response = $this->actingAs($this->officer, 'sanctum')
        ->postJson('/api/sifast/officer/location', [
            'latitude' => -6.195,
            'longitude' => 106.82,
            'report_id' => $report->report_id,
            'speed_kmh' => 42,
            'heading' => 180,
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => ['officer_id', 'distance_to_target_meters', 'eta_minutes']]);
});

it('officer location returns 403 when not assigned to report', function (): void {
    $otherOfficer = User::factory()->staff('IGD')->create();
    $report = EmergencyReport::create([
        'user_id' => User::factory()->pemohon()->create()->id,
        'latitude' => -6.2,
        'longitude' => 106.816666,
        'address' => 'Jl. Test',
        'category' => 'ambulance',
        'status' => EmergencyReport::STATUS_IN_PROGRESS,
        'assigned_operator_id' => $otherOfficer->id,
    ]);

    $response = $this->actingAs($this->officer, 'sanctum')
        ->postJson('/api/sifast/officer/location', [
            'latitude' => -6.195,
            'longitude' => 106.82,
            'report_id' => $report->report_id,
        ]);

    $response->assertForbidden();
});
