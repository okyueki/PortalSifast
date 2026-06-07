<?php

/**
 * Mirror of resources/js/pages/payroll/payroll-slip-structure.ts computeSlipTotals logic.
 */
test('jumlah tunjangan includes section tunjangan and lain-lain', function () {
    $kehadiran = 1_759_050;
    $tunjanganSection = 12_294_262;
    $lainLain = 1_240_019;

    $jumlahTunjangan = $tunjanganSection + $lainLain;
    $jumlahGaji = $kehadiran + $jumlahTunjangan;

    expect($jumlahTunjangan)->toBe(13_534_281)
        ->and($jumlahGaji)->toBe(15_293_331);
});
