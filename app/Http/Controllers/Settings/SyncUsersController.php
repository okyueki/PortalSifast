<?php

namespace App\Http\Controllers\Settings;

use App\Actions\SyncUsersFromSimrs;
use App\Models\Pegawai;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SyncUsersController extends Controller
{
    private const CACHE_KEY = 'users_sync_last_result';

    public function show(): Response
    {
        $lastSyncResult = Cache::get(self::CACHE_KEY);

        $pegawaiEmailStatus = Pegawai::query()
            ->with(['petugas', 'dokter'])
            ->orderBy('nama')
            ->get()
            ->map(function (Pegawai $p) {
                $email = $p->getEmailForSync();
                $validEmail = $email && filter_var($email, FILTER_VALIDATE_EMAIL);

                return [
                    'nik' => $p->nik,
                    'nama' => $p->nama ?? $p->nik,
                    'email' => $email,
                    'phone' => $p->getPhoneForSync(),
                    'has_email' => $validEmail,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('settings/sync-users', [
            'lastSyncResult' => $lastSyncResult,
            'pegawaiEmailStatus' => $pegawaiEmailStatus,
        ]);
    }

    public function store(SyncUsersFromSimrs $sync): RedirectResponse
    {
        $result = $sync(false);

        Cache::put(self::CACHE_KEY, [
            'created' => $result['created'],
            'updated' => $result['updated'],
            'skipped' => $result['skipped'],
            'run_at' => now()->toIso8601String(),
        ], now()->addYear());

        return back()->with('syncSuccess', true);
    }
}
