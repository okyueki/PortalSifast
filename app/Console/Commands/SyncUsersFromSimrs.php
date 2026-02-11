<?php

namespace App\Console\Commands;

use App\Actions\SyncUsersFromSimrs as SyncUsersFromSimrsAction;
use Illuminate\Console\Command;

class SyncUsersFromSimrs extends Command
{
    protected $signature = 'users:sync-simrs
                            {--dry-run : Only show what would be done, do not write}';

    protected $description = 'Sync users from SIMRS (Pegawai + Petugas/Dokter email & phone) ke tabel users';

    public function handle(SyncUsersFromSimrsAction $sync): int
    {
        $dryRun = $this->option('dry-run');
        if ($dryRun) {
            $this->warn('Mode dry-run: tidak ada perubahan ke database.');
        }

        $result = $sync($dryRun);

        $this->info(sprintf(
            'Selesai. Dibuat: %d, Diupdate: %d, Dilewati (tanpa email): %d.',
            $result['created'],
            $result['updated'],
            $result['skipped']
        ));
        if ($result['created'] > 0 && ! $dryRun) {
            $this->line('User baru perlu menggunakan "Lupa password" untuk set password pertama kali.');
        }

        return self::SUCCESS;
    }
}
