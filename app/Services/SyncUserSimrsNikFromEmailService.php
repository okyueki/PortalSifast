<?php

namespace App\Services;

use App\Models\Dokter;
use App\Models\Pegawai;
use App\Models\Petugas;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

/**
 * Mengisi users.simrs_nik dari SIMRS bila kosong, dengan mencocokkan email ke petugas/dokter.
 */
class SyncUserSimrsNikFromEmailService
{
    public function __invoke(User $user): bool
    {
        if ($user->isPayrollServiceIntegrationAccount()) {
            return false;
        }

        if (filled($user->simrs_nik)) {
            return false;
        }

        $email = $user->email;
        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        if (Str::endsWith(Str::lower($email), '@portal.local')) {
            return false;
        }

        try {
            $nik = $this->findNikByEmail($email);
            if (! is_string($nik) || $nik === '') {
                return false;
            }

            $pegawaiExists = Pegawai::query()
                ->where('nik', $nik)
                ->where('stts_aktif', 'AKTIF')
                ->exists();

            if (! $pegawaiExists) {
                return false;
            }

            $user->update([
                'simrs_nik' => $nik,
                'source' => 'simrs',
            ]);
        } catch (QueryException) {
            return false;
        } catch (\Throwable) {
            return false;
        }

        return true;
    }

    private function findNikByEmail(string $email): ?string
    {
        $normalized = Str::lower(trim($email));

        $nip = Petugas::query()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
            ->value('nip');

        if (is_string($nip) && $nip !== '') {
            return $nip;
        }

        $kdDokter = Dokter::query()
            ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
            ->value('kd_dokter');

        if (is_string($kdDokter) && $kdDokter !== '') {
            return $kdDokter;
        }

        return null;
    }
}
