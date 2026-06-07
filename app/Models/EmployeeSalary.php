<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalary extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'imported_by',
        'import_id',
        'period_start',
        'simrs_nik',
        'employee_name',
        'unit',
        'npwp',
        'phone',
        'salary_no',
        'ref_no',
        'penerimaan',
        'pembulatan',
        'pajak',
        'zakat',
        // Komponen Pendapatan
        'gaji_pokok',
        'keluarga',
        'tunj_masa_kerja',
        'tunj_kehadiran',
        'tunj_makan',
        'fungsional',
        'struktural',
        'operasional',
        'transport_spj',
        'jm_dokter',
        'lembur',
        'on_call',
        'lain_lain',
        // JKN
        'jkn',
        'jkn_label',
        'umum',
        'umum_label',
        'jkn_susulan',
        'jkn_susulan_l',
        // BPJS TK Company
        'jkk',
        'jkm',
        'jht',
        'jp',
        'tunj_bpjs_tk',
        'bpjs_kes',
        // BPJS TK Karyawan
        'jkk_k',
        'jkm_k',
        'jht_k',
        'jp_k',
        'pot_bpjs_tk',
        'bpjs_kes_k',
        // Potongan Lain
        'jht_i',
        'jp_i',
        'bpjs_kes_i',
        'bpjs_kes_tidak_ditanggung',
        'matan',
        'lazismu',
        'obat2an',
        'hutang_bpjs',
        'hutang_seragam',
        'ikkm',
        'lain_pot',
        // Totals
        'jumlah',
        'jumlah_tunjangan',
        'jumlah_pot',
        // Status & Publish
        'status',
        'published_at',
        'published_by',
        // Raw
        'raw_row',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            // Main values
            'penerimaan' => 'decimal:2',
            'pembulatan' => 'decimal:2',
            'pajak' => 'decimal:2',
            'zakat' => 'decimal:2',
            // Komponen Pendapatan
            'gaji_pokok' => 'decimal:2',
            'keluarga' => 'decimal:2',
            'tunj_masa_kerja' => 'decimal:2',
            'tunj_kehadiran' => 'decimal:2',
            'tunj_makan' => 'decimal:2',
            'fungsional' => 'decimal:2',
            'struktural' => 'decimal:2',
            'operasional' => 'decimal:2',
            'transport_spj' => 'decimal:2',
            'jm_dokter' => 'decimal:2',
            'lembur' => 'decimal:2',
            'on_call' => 'decimal:2',
            'lain_lain' => 'decimal:2',
            // JKN
            'jkn' => 'decimal:2',
            'umum' => 'decimal:2',
            'jkn_susulan' => 'decimal:2',
            'jkn_susulan_l' => 'decimal:2',
            // BPJS TK Company
            'jkk' => 'decimal:2',
            'jkm' => 'decimal:2',
            'jht' => 'decimal:2',
            'jp' => 'decimal:2',
            'tunj_bpjs_tk' => 'decimal:2',
            'bpjs_kes' => 'decimal:2',
            // BPJS TK Karyawan
            'jkk_k' => 'decimal:2',
            'jkm_k' => 'decimal:2',
            'jht_k' => 'decimal:2',
            'jp_k' => 'decimal:2',
            'pot_bpjs_tk' => 'decimal:2',
            'bpjs_kes_k' => 'decimal:2',
            // Potongan Lain
            'jht_i' => 'decimal:2',
            'jp_i' => 'decimal:2',
            'bpjs_kes_i' => 'decimal:2',
            'bpjs_kes_tidak_ditanggung' => 'decimal:2',
            'matan' => 'decimal:2',
            'lazismu' => 'decimal:2',
            'obat2an' => 'decimal:2',
            'hutang_bpjs' => 'decimal:2',
            'hutang_seragam' => 'decimal:2',
            'ikkm' => 'decimal:2',
            'lain_pot' => 'decimal:2',
            // Totals
            'jumlah' => 'decimal:2',
            'jumlah_tunjangan' => 'decimal:2',
            'jumlah_pot' => 'decimal:2',
            // Status & Publish (status is string: 'draft' or 'published')
            'published_at' => 'datetime',
            // Raw
            'raw_row' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'simrs_nik', 'nik');
    }

    public function payrollImport(): BelongsTo
    {
        return $this->belongsTo(PayrollImport::class, 'import_id');
    }

    // Accessors untuk calculated fields

    public function getTotalTunjBpjsTkAttribute(): ?float
    {
        if ($this->tunj_bpjs_tk !== null) {
            return (float) $this->tunj_bpjs_tk;
        }

        return ($this->jkk ?? 0) + ($this->jkm ?? 0) + ($this->jht ?? 0) + ($this->jp ?? 0);
    }

    public function getTotalPotBpjsTkAttribute(): ?float
    {
        if ($this->pot_bpjs_tk !== null) {
            return (float) $this->pot_bpjs_tk;
        }

        return ($this->jkk_k ?? 0) + ($this->jkm_k ?? 0) + ($this->jht_k ?? 0) + ($this->jp_k ?? 0);
    }

    public function getTotalPendapatanAttribute(): ?float
    {
        return ($this->gaji_pokok ?? 0)
            + ($this->keluarga ?? 0)
            + ($this->fungsional ?? 0)
            + ($this->struktural ?? 0)
            + ($this->operasional ?? 0)
            + ($this->transport_spj ?? 0)
            + ($this->jm_dokter ?? 0)
            + ($this->lembur ?? 0)
            + ($this->on_call ?? 0)
            + ($this->lain_lain ?? 0)
            + ($this->jkn ?? 0)
            + ($this->umum ?? 0)
            + ($this->jkn_susulan ?? 0)
            + ($this->jkn_susulan_l ?? 0)
            + ($this->jkk ?? 0)
            + ($this->jkm ?? 0)
            + ($this->jht ?? 0)
            + ($this->jp ?? 0)
            + ($this->bpjs_kes ?? 0)
            // Tunjangan BPJS Karyawan (perusahaan tanggung)
            + ($this->jkk_k ?? 0)
            + ($this->jkm_k ?? 0)
            + ($this->jht_k ?? 0)
            + ($this->jp_k ?? 0)
            + ($this->pot_bpjs_tk ?? 0)
            // Potongan Iuran
            + ($this->jht_i ?? 0)
            + ($this->jp_i ?? 0)
            + ($this->bpjs_kes_i ?? 0)
            + ($this->bpjs_kes_k ?? 0);
    }

    public function getTotalPotonganAttribute(): ?float
    {
        return ($this->jht_i ?? 0)
            + ($this->jp_i ?? 0)
            + ($this->bpjs_kes_i ?? 0)
            + ($this->bpjs_kes_tidak_ditanggung ?? 0)
            + ($this->matan ?? 0)
            + ($this->lazismu ?? 0)
            + ($this->obat2an ?? 0)
            + ($this->hutang_bpjs ?? 0)
            + ($this->hutang_seragam ?? 0)
            + ($this->ikkm ?? 0)
            + ($this->lain_pot ?? 0)
            + ($this->pajak ?? 0)
            + ($this->zakat ?? 0)
            // Potongan BPJS TK dari gaji karyawan
            + ($this->pot_bpjs_tk ?? 0)
            + ($this->bpjs_kes_k ?? 0);
    }

    public function getGajiBersihAttribute(): ?float
    {
        $pendapatan = $this->total_pendapatan ?? $this->pembulatan ?? $this->penerimaan ?? 0;
        $potongan = $this->total_potongan;

        return $pendapatan - $potongan;
    }
}
