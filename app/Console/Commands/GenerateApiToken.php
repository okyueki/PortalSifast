<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateApiToken extends Command
{
    protected $signature = 'api:token:generate {name=kepegawaian-app}';

    protected $description = 'Generate Sanctum API token untuk aplikasi kepegawaian';

    public function handle(): int
    {
        $tokenName = $this->argument('name');

        // Cari atau buat service account user
        $user = User::firstOrCreate(
            ['email' => 'api-service@portal.local'],
            [
                'name' => 'API Service Account',
                'password' => bcrypt(Str::random(32)),
                'role' => 'admin',
                'source' => 'manual',
            ]
        );

        // Generate token
        $token = $user->createToken($tokenName)->plainTextToken;

        $this->info('Token berhasil dibuat!');
        $this->line('');
        $this->line('Token: '.$token);
        $this->line('');
        $this->line('Gunakan token ini di header Authorization:');
        $this->line('Authorization: Bearer '.$token);
        $this->line('');
        $this->warn('Simpan token ini dengan aman. Token ini tidak akan ditampilkan lagi.');

        return Command::SUCCESS;
    }
}
