<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
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

        try {
            $departments = \App\Models\Departemen::orderBy('nama')->get(['dep_id', 'nama']);
        } catch (\Throwable) {
            $departments = collect([
                ['dep_id' => 'IT', 'nama' => 'IT'],
                ['dep_id' => 'IPS', 'nama' => 'IPS'],
            ]);
        }

        return Inertia::render('users/create', [
            'availablePegawai' => $availablePegawai,
            'departments' => $departments,
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
            'role' => $request->validated('role'),
            'dep_id' => $request->validated('dep_id') ?: null,
        ]);

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
    }

    public function edit(User $user): Response
    {
        try {
            $departments = \App\Models\Departemen::orderBy('nama')->get(['dep_id', 'nama']);
        } catch (\Throwable) {
            $departments = collect([
                ['dep_id' => 'IT', 'nama' => 'IT'],
                ['dep_id' => 'IPS', 'nama' => 'IPS'],
            ]);
        }

        return Inertia::render('users/edit', [
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'dep_id']),
            'departments' => $departments,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = [
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'role' => $request->validated('role'),
            'dep_id' => $request->validated('dep_id') ?: null,
        ];

        if ($request->filled('password')) {
            $data['password'] = $request->validated('password');
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui.');
    }
}
