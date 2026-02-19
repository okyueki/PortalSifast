<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Support\Str;

class ResolveUserByNikService
{
    /**
     * Cari atau buat user berdasarkan NIK (dari Pegawai SIMRS).
     */
    public function findOrCreate(string $nik): ?User
    {
        $user = User::where('simrs_nik', $nik)->first();

        if ($user) {
            return $user;
        }

        try {
            $pegawai = Pegawai::where('nik', $nik)
                ->where('stts_aktif', 'AKTIF')
                ->first();

            if (! $pegawai) {
                return null;
            }

            $email = $pegawai->getEmailForSync();
            $phone = $pegawai->getPhoneForSync();

            return User::create([
                'simrs_nik' => $nik,
                'name' => $pegawai->nama ?? $nik,
                'email' => $email ?? "{$nik}@portal.local",
                'password' => bcrypt(Str::random(32)),
                'phone' => $phone,
                'source' => 'simrs',
                'role' => 'pemohon',
                'dep_id' => $pegawai->departemen ?? null,
            ]);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
