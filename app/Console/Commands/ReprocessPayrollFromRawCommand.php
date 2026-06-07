<?php

namespace App\Console\Commands;

use App\Models\EmployeeSalary;
use App\Support\PayrollCsvMapper;
use Illuminate\Console\Command;

class ReprocessPayrollFromRawCommand extends Command
{
    protected $signature = 'payroll:reprocess-from-raw {--id= : ID salary tertentu} {--period= : Periode YYYY-MM}';

    protected $description = 'Ulang pemetaan komponen gaji dari raw_row CSV ke kolom database';

    public function handle(): int
    {
        $query = EmployeeSalary::query()->whereNotNull('raw_row');

        if ($id = $this->option('id')) {
            $query->whereKey($id);
        }

        if ($period = $this->option('period')) {
            $query->whereDate('period_start', $period.'-01');
        }

        $count = 0;
        $query->orderBy('id')->chunkById(100, function ($salaries) use (&$count): void {
            foreach ($salaries as $salary) {
                $raw = $salary->raw_row;
                if (! is_array($raw) || $raw === []) {
                    continue;
                }

                $mapped = PayrollCsvMapper::mapRawRow($raw);
                unset($mapped['ref_no'], $mapped['salary_no']);

                $salary->update($mapped);
                $count++;
            }
        });

        $this->info("Berhasil reprocess {$count} data gaji dari raw_row.");

        return self::SUCCESS;
    }
}
