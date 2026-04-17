<?php

use App\Models\EmployeeSalary;
use App\Support\PayrollSlipMath;
use Tests\TestCase;

uses(TestCase::class);

test('resolve prefers pembulatan over penerimaan', function () {
    $salary = EmployeeSalary::make([
        'pembulatan' => '99',
        'penerimaan' => '100',
        'raw_row' => [],
    ]);

    expect(PayrollSlipMath::resolveGajiBersih($salary))->toBe(99.0);
});

test('resolve uses penerimaan as take-home without subtracting pajak zakat', function () {
    $salary = EmployeeSalary::make([
        'pembulatan' => null,
        'penerimaan' => '8025046',
        'pajak' => '156819',
        'zakat' => null,
        'raw_row' => [],
    ]);

    expect(PayrollSlipMath::resolveGajiBersih($salary))->toBe(8025046.0);
});

test('resolve falls back to raw row component sums when penerimaan and pembulatan empty', function () {
    $salary = EmployeeSalary::make([
        'pembulatan' => null,
        'penerimaan' => null,
        'raw_row' => [
            'gaji_pokok' => '1000',
            'pajak' => '100',
        ],
    ]);

    expect(PayrollSlipMath::resolveGajiBersih($salary))->toBe(900.0);
});

test('parseMoneyValue handles indonesian thousands separators', function () {
    expect(PayrollSlipMath::parseMoneyValue('5.011.380'))->toBe(5011380.0);
});
