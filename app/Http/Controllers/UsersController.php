<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        $existingUserNiks = User::query()
            ->whereNotNull('simrs_nik')
            ->pluck('simrs_nik')
            ->toArray();

        $existingUserEmails = User::query()
            ->pluck('email')
            ->toArray();

        $availablePegawai = Pegawai::query()
            ->with(['petugas', 'dokter'])
            ->orderBy('nama')
            ->get()
            ->filter(function (Pegawai $p) use ($existingUserNiks, $existingUserEmails) {
                $email = $p->getEmailForSync();
                $validEmail = $email && filter_var($email, FILTER_VALIDATE_EMAIL);

                if (! $validEmail) {
                    return false;
                }

                $alreadyUser = in_array($p->nik, $existingUserNiks)
                    || in_array($email, $existingUserEmails);

                return ! $alreadyUser;
            })
            ->map(function (Pegawai $p) {
                return [
                    'nik' => $p->nik,
                    'nama' => $p->nama ?? $p->nik,
                    'email' => $p->getEmailForSync(),
                    'phone' => $p->getPhoneForSync(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('users/create', [
            'availablePegawai' => $availablePegawai,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'phone' => $request->validated('phone'),
            'simrs_nik' => $request->validated('simrs_nik'),
            'source' => $request->validated('simrs_nik') ? 'simrs' : 'manual',
        ]);

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
    }
}
