<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employee_salaries', function (Blueprint $table) {
            // Pendapatan Components
            $table->decimal('gaji_pokok', 15, 2)->nullable()->after('zakat');
            $table->decimal('keluarga', 15, 2)->nullable();
            $table->decimal('fungsional', 15, 2)->nullable();
            $table->decimal('struktural', 15, 2)->nullable();
            $table->decimal('operasional', 15, 2)->nullable();
            $table->decimal('transport_spj', 15, 2)->nullable();
            $table->decimal('jm_dokter', 15, 2)->nullable();
            $table->decimal('lembur', 15, 2)->nullable();
            $table->decimal('on_call', 15, 2)->nullable();
            $table->decimal('lain_lain', 15, 2)->nullable();

            // BPJS TK Company (Tunjangan)
            $table->decimal('jkk', 15, 2)->nullable();
            $table->decimal('jkm', 15, 2)->nullable();
            $table->decimal('jht', 15, 2)->nullable();
            $table->decimal('jp', 15, 2)->nullable();
            $table->decimal('tunj_bpjs_tk', 15, 2)->nullable()->comment('JKK + JKM + JHT + JP');
            $table->decimal('bpjs_kes', 15, 2)->nullable()->comment('BPJS Kesehatan Perusahaan');

            // JKN (Pemasukan)
            $table->decimal('jkn', 15, 2)->nullable()->comment('JKN Karyawan');
            $table->decimal('umum', 15, 2)->nullable()->comment('Umum');
            $table->decimal('jkn_susulan', 15, 2)->nullable();
            $table->decimal('jkn_susulan_l', 15, 2)->nullable();

            // BPJS TK Karyawan (Potongan)
            $table->decimal('jkk_k', 15, 2)->nullable();
            $table->decimal('jkm_k', 15, 2)->nullable();
            $table->decimal('jht_k', 15, 2)->nullable();
            $table->decimal('jp_k', 15, 2)->nullable();
            $table->decimal('pot_bpjs_tk', 15, 2)->nullable()->comment('JKK_K + JKM_K + JHT_K + JP_K');
            $table->decimal('bpjs_kes_k', 15, 2)->nullable()->comment('BPJS Kesehatan Karyawan');

            // Potongan Lainnya
            $table->decimal('jht_i', 15, 2)->nullable()->comment('JHT Iuran');
            $table->decimal('jp_i', 15, 2)->nullable()->comment('JP Iuran');
            $table->decimal('bpjs_kes_i', 15, 2)->nullable()->comment('BPJS Kesehatan Iuran');
            $table->decimal('bpjs_kes_tidak_ditanggung', 15, 2)->nullable();
            $table->decimal('matan', 15, 2)->nullable();
            $table->decimal('lazismu', 15, 2)->nullable();
            $table->decimal('obat2an', 15, 2)->nullable();
            $table->decimal('hutang_bpjs', 15, 2)->nullable();
            $table->decimal('hutang_seragam', 15, 2)->nullable();
            $table->decimal('ikkm', 15, 2)->nullable();
            $table->decimal('lain_pot', 15, 2)->nullable()->comment('Lain lain potongan');

            // Totals (from CSV)
            $table->decimal('jumlah', 15, 2)->nullable()->comment('Jumlah total dari CSV');
            $table->decimal('jumlah_tunjangan', 15, 2)->nullable()->comment('Jumlah tunjangan dari CSV');
            $table->decimal('jumlah_pot', 15, 2)->nullable()->comment('Jumlah potongan dari CSV');

            // Phone for contact (from SIMRS if available)
            $table->string('phone', 20)->nullable()->after('npwp');

            // Add indexes for frequently queried columns
            $table->index(['unit', 'period_start']);
            $table->index('penerimaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_salaries', function (Blueprint $table) {
            $columns = [
                // Pendapatan
                'gaji_pokok', 'keluarga', 'fungsional', 'struktural', 'operasional',
                'transport_spj', 'jm_dktor', 'lembur', 'on_call', 'lain_lain',
                // BPJS TK Company
                'jkk', 'jkm', 'jht', 'jp', 'tunj_bpjs_tk', 'bpjs_kes',
                // JKN
                'jkn', 'umum', 'jkn_susulan', 'jkn_susulan_l',
                // BPJS TK Karyawan
                'jkk_k', 'jkm_k', 'jht_k', 'jp_k', 'pot_bpjs_tk', 'bpjs_kes_k',
                // Potongan
                'jht_i', 'jp_i', 'bpjs_kes_i', 'bpjs_kes_tidak_ditanggung',
                'matan', 'lazismu', 'obat2an', 'hutang_bpjs', 'hutang_seragam', 'ikkm', 'lain_pot',
                // Totals
                'jumlah', 'jumlah_tunjangan', 'jumlah_pot',
                // Extra
                'phone',
            ];

            // Drop indexes
            $table->dropIndex(['unit', 'period_start']);
            $table->dropIndex(['penerimaan']);

            foreach ($columns as $column) {
                if (Schema::hasColumn('employee_salaries', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};