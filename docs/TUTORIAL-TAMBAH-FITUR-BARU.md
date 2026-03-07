# Tutorial: Menambahkan Modul/Fitur Baru di PortalSifast

Panduan lengkap step-by-step untuk menambahkan fitur baru di aplikasi Laravel + Inertia.js + React.

---

## Daftar Isi
1. [Struktur Proyek](#1-struktur-proyek)
2. [Step 1: Buat Migration](#step-1-buat-migration)
3. [Step 2: Buat Model](#step-2-buat-model)
4. [Step 3: Buat Controller](#step-3-buat-controller)
5. [Step 4: Tambahkan Routes](#step-4-tambahkan-routes)
6. [Step 5: Buat Halaman Frontend (React)](#step-5-buat-halaman-frontend-react)
7. [Step 6: Tambahkan Menu di Sidebar](#step-6-tambahkan-menu-di-sidebar)
8. [Step 7: Testing](#step-7-testing)
9. [Contoh Lengkap: CRUD Sederhana](#contoh-lengkap-crud-sederhana)

---

## 1. Struktur Proyek

```
PortalSifast/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # Controller PHP
│   │   └── Requests/        # Form Request (validasi)
│   └── Models/              # Model Eloquent
├── database/
│   └── migrations/          # File migrasi database
├── resources/js/
│   ├── pages/               # Halaman React (Inertia)
│   ├── components/          # Komponen reusable
│   ├── layouts/             # Layout aplikasi
│   └── types/               # TypeScript types
├── routes/
│   ├── web.php              # Routes utama
│   ├── api.php              # Routes API
│   └── settings.php         # Routes settings
└── docs/                    # Dokumentasi
```

---

## Step 1: Buat Migration

Migration adalah file untuk membuat/mengubah struktur tabel database.

### Perintah:
```bash
php artisan make:migration create_nama_tabel_table
```

### Contoh:
```bash
php artisan make:migration create_announcements_table
```

### Isi file migration (`database/migrations/xxxx_create_announcements_table.php`):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
```

### Jalankan migration:
```bash
php artisan migrate
```

---

## Step 2: Buat Model

Model adalah representasi tabel di PHP menggunakan Eloquent ORM.

### Perintah:
```bash
php artisan make:model NamaModel
```

### Dengan opsi tambahan (recommended):
```bash
php artisan make:model Announcement -f -s
# -f = dengan Factory
# -s = dengan Seeder
```

### Contoh Model (`app/Models/Announcement.php`):
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // Relasi ke User
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

---

## Step 3: Buat Controller

Controller menangani logic request dan response.

### Perintah:
```bash
php artisan make:controller NamaController
```

### Untuk resource controller (CRUD lengkap):
```bash
php artisan make:controller AnnouncementController --resource
```

### Contoh Controller (`app/Http/Controllers/AnnouncementController.php`):
```php
<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * Tampilkan daftar data (index)
     */
    public function index(): Response
    {
        return Inertia::render('announcements/index', [
            'announcements' => Announcement::with('creator')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    /**
     * Form untuk membuat data baru
     */
    public function create(): Response
    {
        return Inertia::render('announcements/create');
    }

    /**
     * Simpan data baru ke database
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();

        Announcement::create($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Pengumuman berhasil dibuat.');
    }

    /**
     * Tampilkan detail data
     */
    public function show(Announcement $announcement): Response
    {
        return Inertia::render('announcements/show', [
            'announcement' => $announcement->load('creator'),
        ]);
    }

    /**
     * Form untuk edit data
     */
    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update data di database
     */
    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $announcement->update($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Pengumuman berhasil diperbarui.');
    }

    /**
     * Hapus data dari database
     */
    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Pengumuman berhasil dihapus.');
    }
}
```

---

## Step 4: Tambahkan Routes

Routes menghubungkan URL dengan Controller.

### Edit `routes/web.php`:
```php
<?php

use App\Http\Controllers\AnnouncementController;

// Resource route (otomatis generate semua CRUD routes)
Route::resource('announcements', AnnouncementController::class)
    ->middleware(['auth', 'verified']);
```

### Atau manual satu per satu:
```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::get('announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
    Route::post('announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])->name('announcements.show');
    Route::get('announcements/{announcement}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
    Route::put('announcements/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
});
```

### Cek routes yang terdaftar:
```bash
php artisan route:list --path=announcements
```

---

## Step 5: Buat Halaman Frontend (React)

Halaman React menggunakan Inertia.js untuk integrasi dengan Laravel.

### Struktur folder:
```
resources/js/pages/announcements/
├── index.tsx      # Halaman daftar
├── create.tsx     # Form tambah
├── edit.tsx       # Form edit
└── show.tsx       # Detail (opsional)
```

### Contoh `index.tsx`:
```tsx
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Pengumuman', href: '/announcements' },
];

type Announcement = {
    id: number;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
    creator: {
        id: number;
        name: string;
    };
};

type Props = {
    announcements: Announcement[];
};

export default function AnnouncementIndex({ announcements }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus?')) {
            router.delete(`/announcements/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengumuman" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Pengumuman"
                        description="Kelola pengumuman untuk semua pengguna"
                    />
                    <Button asChild>
                        <Link href="/announcements/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengumuman
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Judul</TableHead>
                                <TableHead>Dibuat Oleh</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {announcements.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.title}
                                    </TableCell>
                                    <TableCell>{item.creator.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/announcements/${item.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
```

### Contoh `create.tsx`:
```tsx
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Pengumuman', href: '/announcements' },
    { title: 'Tambah', href: '/announcements/create' },
];

export default function AnnouncementCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/announcements');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pengumuman" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/announcements">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Heading
                        title="Tambah Pengumuman"
                        description="Buat pengumuman baru"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border bg-card p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="title">
                            Judul <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Judul pengumuman..."
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">
                            Isi <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            placeholder="Isi pengumuman..."
                            rows={5}
                        />
                        <InputError message={errors.content} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', checked as boolean)
                            }
                        />
                        <Label htmlFor="is_active">Aktif</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/announcements">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
```

---

## Step 6: Tambahkan Menu di Sidebar

Edit file `resources/js/components/app-sidebar.tsx` atau file navigasi yang sesuai.

### Contoh menambah menu:
```tsx
// Di bagian navMain atau menu items
{
    title: 'Pengumuman',
    url: '/announcements',
    icon: Megaphone, // import dari lucide-react
}
```

---

## Step 7: Testing

### Build frontend:
```bash
npm run dev
# atau untuk production
npm run build
```

### Format kode PHP:
```bash
vendor/bin/pint --dirty
```

### Buat test (opsional tapi recommended):
```bash
php artisan make:test AnnouncementTest
```

### Jalankan test:
```bash
php artisan test --filter=Announcement
```

---

## Contoh Lengkap: CRUD Sederhana

### Ringkasan perintah untuk membuat fitur baru:

```bash
# 1. Buat migration + model + factory + seeder
php artisan make:model NamaModel -mfs

# 2. Edit migration di database/migrations/
# 3. Jalankan migration
php artisan migrate

# 4. Buat controller
php artisan make:controller NamaController --resource

# 5. Edit controller
# 6. Tambah routes di routes/web.php

# 7. Buat folder dan file React di resources/js/pages/nama-fitur/
#    - index.tsx
#    - create.tsx
#    - edit.tsx

# 8. Update menu sidebar jika perlu

# 9. Build frontend
npm run dev

# 10. Format kode
vendor/bin/pint --dirty
```

---

## Tips & Best Practices

### 1. Gunakan Form Request untuk validasi kompleks
```bash
php artisan make:request StoreAnnouncementRequest
```

### 2. Gunakan Resource untuk API response yang konsisten
```bash
php artisan make:resource AnnouncementResource
```

### 3. Gunakan Policy untuk authorization
```bash
php artisan make:policy AnnouncementPolicy --model=Announcement
```

### 4. Cek routes yang tersedia
```bash
php artisan route:list
```

### 5. Cek model relationships
```bash
php artisan model:show Announcement
```

### 6. Clear cache jika ada masalah
```bash
php artisan cache:clear
php artisan route:clear
php artisan config:clear
php artisan view:clear
```

---

## Referensi Cepat

| Kebutuhan | Perintah |
|-----------|----------|
| Buat migration | `php artisan make:migration create_xxx_table` |
| Buat model | `php artisan make:model Xxx` |
| Buat controller | `php artisan make:controller XxxController` |
| Buat request | `php artisan make:request XxxRequest` |
| Buat resource | `php artisan make:resource XxxResource` |
| Buat policy | `php artisan make:policy XxxPolicy` |
| Buat test | `php artisan make:test XxxTest` |
| Jalankan migration | `php artisan migrate` |
| Rollback migration | `php artisan migrate:rollback` |
| List routes | `php artisan route:list` |
| Format PHP | `vendor/bin/pint` |
| Build frontend | `npm run build` |
| Dev server | `npm run dev` |

---

## FAQ

### Q: Kenapa halaman blank setelah buat file React baru?
A: Jalankan `npm run dev` atau `npm run build` untuk compile TypeScript.

### Q: Error "Class not found"?
A: Jalankan `composer dump-autoload`

### Q: Route tidak ditemukan (404)?
A: Cek dengan `php artisan route:list` dan pastikan nama route benar.

### Q: Validation error tapi tidak tampil?
A: Pastikan komponen `<InputError message={errors.field} />` sudah ditambahkan.

---

Dokumentasi ini dibuat pada: Februari 2026
