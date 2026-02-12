<?php

namespace Database\Seeders;

use App\Models\TicketCategory;
use App\Models\TicketGroup;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketTag;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Database\Seeder;

class TicketingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedTicketTypes();
        $this->seedTicketPriorities();
        $this->seedTicketStatuses();
        $this->seedTicketCategories();
        $this->seedTicketTags();
        $this->seedTicketGroups();
    }

    private function seedTicketTypes(): void
    {
        $types = [
            [
                'name' => 'Insiden',
                'slug' => 'incident',
                'description' => 'Gangguan layanan yang perlu diperbaiki segera',
            ],
            [
                'name' => 'Permintaan Layanan',
                'slug' => 'service_request',
                'description' => 'Permintaan layanan standar (akses, instalasi, perbaikan)',
            ],
            [
                'name' => 'Problem',
                'slug' => 'problem',
                'description' => 'Akar penyebab insiden berulang; memerlukan analisis dan perbaikan jangka panjang',
            ],
            [
                'name' => 'Permintaan Perubahan',
                'slug' => 'change_request',
                'description' => 'Permintaan perubahan layanan atau infrastruktur; memerlukan persetujuan',
            ],
        ];

        foreach ($types as $type) {
            TicketType::firstOrCreate(['slug' => $type['slug']], $type);
        }
    }

    private function seedTicketPriorities(): void
    {
        $priorities = [
            [
                'name' => 'P1 - Kritis',
                'level' => 1,
                'description' => 'Layanan utama down, berdampak ke banyak user atau operasional RS terganggu total',
                'color' => '#DC2626', // red-600
                'response_hours' => 1,
                'resolution_hours' => 4,
            ],
            [
                'name' => 'P2 - Tinggi',
                'level' => 2,
                'description' => 'Layanan terganggu signifikan, ada workaround tapi tidak ideal',
                'color' => '#F97316', // orange-500
                'response_hours' => 2,
                'resolution_hours' => 8,
            ],
            [
                'name' => 'P3 - Sedang',
                'level' => 3,
                'description' => 'Gangguan minor, tidak menghambat operasional utama',
                'color' => '#EAB308', // yellow-500
                'response_hours' => 4,
                'resolution_hours' => 24,
            ],
            [
                'name' => 'P4 - Rendah',
                'level' => 4,
                'description' => 'Permintaan kecil, tidak urgent, bisa dijadwalkan',
                'color' => '#22C55E', // green-500
                'response_hours' => 8,
                'resolution_hours' => 72,
            ],
        ];

        foreach ($priorities as $priority) {
            TicketPriority::firstOrCreate(['level' => $priority['level']], $priority);
        }
    }

    private function seedTicketStatuses(): void
    {
        $statuses = [
            [
                'name' => 'Baru',
                'slug' => 'new',
                'color' => '#6B7280', // gray-500
                'order' => 1,
                'is_closed' => false,
            ],
            [
                'name' => 'Ditugaskan',
                'slug' => 'assigned',
                'color' => '#3B82F6', // blue-500
                'order' => 2,
                'is_closed' => false,
            ],
            [
                'name' => 'Dikerjakan',
                'slug' => 'in_progress',
                'color' => '#8B5CF6', // violet-500
                'order' => 3,
                'is_closed' => false,
            ],
            [
                'name' => 'Tertunda',
                'slug' => 'pending',
                'color' => '#F59E0B', // amber-500
                'order' => 4,
                'is_closed' => false,
            ],
            [
                'name' => 'Selesai',
                'slug' => 'resolved',
                'color' => '#10B981', // emerald-500
                'order' => 5,
                'is_closed' => false,
            ],
            [
                'name' => 'Menunggu Konfirmasi',
                'slug' => 'waiting_confirmation',
                'color' => '#06B6D4', // cyan-500
                'order' => 6,
                'is_closed' => false,
            ],
            [
                'name' => 'Ditutup',
                'slug' => 'closed',
                'color' => '#059669', // emerald-600
                'order' => 7,
                'is_closed' => true,
            ],
        ];

        foreach ($statuses as $status) {
            TicketStatus::firstOrCreate(['slug' => $status['slug']], $status);
        }
    }

    private function seedTicketCategories(): void
    {
        // Kategori untuk IT
        $itCategories = [
            [
                'name' => 'Aplikasi SIMRS',
                'dep_id' => 'IT',
                'description' => 'Masalah atau permintaan terkait aplikasi SIMRS',
            ],
            [
                'name' => 'Jaringan & Internet',
                'dep_id' => 'IT',
                'description' => 'Masalah koneksi jaringan, WiFi, internet',
            ],
            [
                'name' => 'Email & Komunikasi',
                'dep_id' => 'IT',
                'description' => 'Masalah email, Teams, chat internal',
            ],
            [
                'name' => 'Akses & User Account',
                'dep_id' => 'IT',
                'description' => 'Permintaan akses, reset password, pembuatan user',
            ],
            [
                'name' => 'Hardware Komputer',
                'dep_id' => 'IT',
                'description' => 'Masalah PC, laptop, monitor, keyboard, mouse',
            ],
            [
                'name' => 'Printer & Scanner',
                'dep_id' => 'IT',
                'description' => 'Masalah printer, scanner, fotocopy yang terhubung jaringan',
            ],
            [
                'name' => 'Pengembangan Aplikasi',
                'dep_id' => 'IT',
                'is_development' => true,
                'description' => 'Permintaan pengembangan fitur atau aplikasi baru (due date oleh Head IT)',
            ],
            [
                'name' => 'Lainnya (IT)',
                'dep_id' => 'IT',
                'description' => 'Permintaan IT lain yang tidak termasuk kategori di atas',
            ],
        ];

        // Kategori untuk IPS
        $ipsCategories = [
            [
                'name' => 'Alat Medis',
                'dep_id' => 'IPS',
                'description' => 'Perbaikan atau perawatan alat medis',
            ],
            [
                'name' => 'Peralatan Kantor',
                'dep_id' => 'IPS',
                'description' => 'Perbaikan meja, kursi, lemari, dan peralatan kantor lainnya',
            ],
            [
                'name' => 'AC & Pendingin',
                'dep_id' => 'IPS',
                'description' => 'Masalah AC, kipas angin, pendingin ruangan',
            ],
            [
                'name' => 'Listrik & Kelistrikan',
                'dep_id' => 'IPS',
                'description' => 'Masalah kelistrikan, stop kontak, lampu',
            ],
            [
                'name' => 'Sarana Bangunan',
                'dep_id' => 'IPS',
                'description' => 'Perbaikan pintu, jendela, plafon, dinding, lantai',
            ],
            [
                'name' => 'Pipa & Sanitasi',
                'dep_id' => 'IPS',
                'description' => 'Masalah pipa air, wastafel, toilet, saluran',
            ],
            [
                'name' => 'Lainnya (IPS)',
                'dep_id' => 'IPS',
                'description' => 'Permintaan IPS lain yang tidak termasuk kategori di atas',
            ],
        ];

        $allCategories = array_merge($itCategories, $ipsCategories);

        foreach ($allCategories as $category) {
            TicketCategory::firstOrCreate(
                ['name' => $category['name'], 'dep_id' => $category['dep_id']],
                $category
            );
        }
    }

    private function seedTicketTags(): void
    {
        $tags = [
            ['name' => 'Printer Error', 'slug' => 'printer-error'],
            ['name' => 'Akses SIMRS', 'slug' => 'akses-simrs'],
            ['name' => 'Monitor / Layar', 'slug' => 'monitor-putus'],
            ['name' => 'Jaringan / WiFi', 'slug' => 'jaringan-wifi'],
            ['name' => 'Reset Password', 'slug' => 'reset-password'],
            ['name' => 'Instalasi Software', 'slug' => 'instalasi-software'],
            ['name' => 'Alat Medis', 'slug' => 'alat-medis'],
            ['name' => 'Pengembangan', 'slug' => 'pengembangan'],
            ['name' => 'Lainnya', 'slug' => 'lainnya'],
        ];

        foreach ($tags as $tag) {
            TicketTag::firstOrCreate(['slug' => $tag['slug']], $tag);
        }
    }

    private function seedTicketGroups(): void
    {
        $groups = [
            [
                'dep_id' => 'IT',
                'name' => 'Tim IT',
                'description' => 'Grup tim IT / Programmer / EDP',
            ],
            [
                'dep_id' => 'IPS',
                'name' => 'Tim IPS',
                'description' => 'Grup tim Instalasi Pemeliharaan Sarana',
            ],
        ];

        foreach ($groups as $group) {
            TicketGroup::firstOrCreate(
                ['dep_id' => $group['dep_id']],
                $group
            );
        }

        // Tambahkan staff ke grup departemen mereka
        $staff = User::where('role', 'staff')->whereNotNull('dep_id')->get();
        foreach ($staff as $user) {
            $group = TicketGroup::where('dep_id', $user->dep_id)->first();
            if ($group && ! $group->members()->where('user_id', $user->id)->exists()) {
                $group->members()->attach($user->id);
            }
        }
    }
}
