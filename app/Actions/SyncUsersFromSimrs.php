<?php

namespace App\Actions;

use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SyncUsersFromSimrs
{
    /**
     * @return array{created: int, updated: int, skipped: int}
     */
    public function __invoke(bool $dryRun = false): array
    {
        $pegawai = Pegawai::query()
            ->with(['petugas', 'dokter'])
            ->get();

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($pegawai as $p) {
            $email = $p->getEmailForSync();
            if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;
                continue;
            }

            $nik = $p->nik;
            $name = $p->nama ?? $p->nik;
            $phone = $p->getPhoneForSync();

            $user = User::query()
                ->where('simrs_nik', $nik)
                ->first() ?? User::query()
                ->where('email', $email)
                ->first();

            if ($user) {
                if (! $dryRun) {
                    $user->update([
                        'name' => $name,
                        'email' => $email,
                        'phone' => $phone,
                        'simrs_nik' => $nik,
                        'source' => 'simrs',
                    ]);
                }
                $updated++;
                continue;
            }

            if (! $dryRun) {
                User::query()->create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                    'simrs_nik' => $nik,
                    'phone' => $phone,
                    'source' => 'simrs',
                ]);
            }
            $created++;
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        ];
    }
}
