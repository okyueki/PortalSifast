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
        'salary_no',
        'ref_no',
        'penerimaan',
        'pembulatan',
        'pajak',
        'zakat',
        'raw_row',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'penerimaan' => 'decimal:2',
            'pembulatan' => 'decimal:2',
            'pajak' => 'decimal:2',
            'zakat' => 'decimal:2',
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
}
