<?php

use App\Support\PayrollCsvMapper;

test('maps payroll csv column aliases to database fields', function () {
    $raw = [
        'gaji_pokok' => '1,475,300',
        'tunjangan_keluarga' => '221,295',
        'tunjangan_masa_kerja' => '885,914',
        'tunjangan_kehadiran' => '570,000',
        'tunjangan_makan_minum' => '380,000',
        'fungsional_profesi' => '1,500,000',
        'jkn_maret_2026' => '520,992',
        'umumapril_2026' => '190,213',
        'jkk' => '14,384',
        'jkm' => '17,980',
        'jht' => '221,758',
        'jp' => '119,869',
        'lain_-_lain' => '10,000',
    ];

    $mapped = PayrollCsvMapper::mapRawRow($raw);

    expect($mapped['keluarga'])->toBe('221295')
        ->and($mapped['tunj_masa_kerja'])->toBe('885914')
        ->and($mapped['tunj_kehadiran'])->toBe('570000')
        ->and($mapped['tunj_makan'])->toBe('380000')
        ->and($mapped['fungsional'])->toBe('1500000')
        ->and($mapped['jkn'])->toBe('520992')
        ->and($mapped['jkn_label'])->toBe('Remunerasi JKN Maret 2026')
        ->and($mapped['umum'])->toBe('190213')
        ->and($mapped['umum_label'])->toBe('Remunerasi Umum April 2026')
        ->and($mapped['tunj_bpjs_tk'])->toBe('373991')
        ->and($mapped['lain_pot'])->toBe('10000');
});

test('build verification rows detect csv db mismatch', function () {
    $raw = [
        'tunjangan_keluarga' => '221,295',
        'fungsional_profesi' => '1,500,000',
    ];

    $rows = PayrollCsvMapper::buildVerificationRows($raw, [
        'keluarga' => '221295.00',
        'fungsional' => null,
    ]);

    $keluargaRow = collect($rows)->firstWhere('db_key', 'keluarga');
    $fungsionalRow = collect($rows)->firstWhere('db_key', 'fungsional');

    expect($keluargaRow['match'])->toBeTrue()
        ->and($fungsionalRow['match'])->toBeFalse();
});
