# API Ticketing - Integrasi dengan Sistem Kepegawaian

API untuk membuat dan melihat tiket dari aplikasi kepegawaian tanpa user perlu login ke PortalSifast.

## Autentikasi

Semua endpoint memerlukan **Bearer Token** (Laravel Sanctum) di header:

```
Authorization: Bearer {token}
```

### Di mana token dibuat? Di mana token dipakai?

| Yang apa | Keterangan |
|----------|------------|
| **Generate token** | Dilakukan **di aplikasi PortalSifast** (Laravel). Jalankan command sekali di server/komputer yang menjalankan project PortalSifast. |
| **Simpan & pakai token** | Dilakukan **di aplikasi kepegawaian** (React). Token yang sudah di-generate dari PortalSifast disimpan di env/config aplikasi kepegawaian, lalu setiap kali React memanggil API PortalSifast, kirim header `Authorization: Bearer {token}`. |

Jadi: token **dibuat di PortalSifast**, **disimpan dan dipakai oleh aplikasi kepegawaian** (React) saat panggil API. Aplikasi kepegawaian tidak perlu jalankan Laravel/Artisan; cukup simpan satu token dan kirim di header.

### Generate Token (di PortalSifast)

Jalankan **di project PortalSifast** (folder yang ada `artisan`, `routes/api.php`, dll), sekali saja (atau kapan token perlu diganti):

**Opsi 1: Via Artisan Command**
```bash
# Di folder project PortalSifast (bukan di project kepegawaian)
php artisan api:token:generate kepegawaian-app
```

Output: satu baris token panjang. **Copy token itu.**

**Opsi 2: Via Tinker**
```bash
# Di folder project PortalSifast
php artisan tinker
```
Lalu di dalam tinker:
```php
$user = User::where('email', 'api-service@portal.local')->firstOrCreate([
    'name' => 'API Service Account',
    'email' => 'api-service@portal.local',
    'password' => bcrypt(str()->random(32)),
    'role' => 'admin',
]);
$token = $user->createToken('kepegawaian-app')->plainTextToken;
echo $token;
```

**Lalu:** simpan token yang keluar ke **aplikasi kepegawaian** (React), misalnya di `.env`:
```env
VITE_PORTALSIFAST_API_URL=https://portal-sifast.example.com/api
VITE_PORTALSIFAST_API_TOKEN=1|abc123...token_panjang...
```

Di kode React, saat panggil API (fetch/axios), tambahkan header:
```js
headers: {
  'Authorization': `Bearer ${import.meta.env.VITE_PORTALSIFAST_API_TOKEN}`,
  'Content-Type': 'application/json',
}
```

---

## Endpoint

Base URL: `https://your-domain.com/api`

### 1. Buat Tiket Baru

**POST** `/api/tickets`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nik": "123456789",
  "ticket_type_id": 1,
  "ticket_category_id": 2,
  "ticket_priority_id": 3,
  "title": "Monitor tidak menyala",
  "description": "Monitor di ruang IGD tidak menyala sejak pagi",
  "asset_no_inventaris": "INV-001",
  "tag_ids": [1, 2]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tiket berhasil dibuat.",
  "data": {
    "id": 123,
    "ticket_number": "TKT-20260212-0001",
    "title": "Monitor tidak menyala",
    "status": "Baru",
    "priority": "P2 - Tinggi",
    "created_at": "2026-02-12T10:30:00+07:00"
  }
}
```

**Field:**
- `nik` (required): NIK pelapor dari sistem kepegawaian
- `ticket_type_id` (required): ID tipe tiket (1=Insiden, 2=Permintaan Layanan)
- `ticket_category_id` (optional): ID kategori
- `ticket_subcategory_id` (optional): ID sub-kategori
- `ticket_priority_id` (required): ID prioritas (1=P1, 2=P2, dll)
- `title` (required): Judul tiket (max 255)
- `description` (optional): Deskripsi (max 10000)
- `related_ticket_id` (optional): ID tiket terkait
- `asset_no_inventaris` (optional): No inventaris jika terkait asset
- `tag_ids` (optional): Array ID tag

**Catatan:** Jika user dengan `simrs_nik` = NIK belum ada, sistem akan **auto-create** user dari data Pegawai (SIMRS). Jika pegawai tidak ditemukan di SIMRS, akan return error 404.

---

### 2. Daftar Tiket Milik NIK

**GET** `/api/tickets?nik={nik}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "ticket_number": "TKT-20260212-0001",
      "title": "Monitor tidak menyala",
      "type": "Insiden",
      "category": "Hardware Komputer",
      "priority": "P2 - Tinggi",
      "status": "Ditugaskan",
      "created_at": "2026-02-12T10:30:00+07:00",
      "updated_at": "2026-02-12T11:00:00+07:00"
    }
  ]
}
```

---

### 3. Detail Tiket

**GET** `/api/tickets/{id}?nik={nik}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "ticket_number": "TKT-20260212-0001",
    "title": "Monitor tidak menyala",
    "description": "Monitor di ruang IGD tidak menyala sejak pagi",
    "type": "Insiden",
    "category": "Hardware Komputer",
    "subcategory": null,
    "priority": "P2 - Tinggi",
    "status": "Ditugaskan",
    "assignee": "Budi Santoso",
    "tags": ["monitor-putus", "hardware"],
    "comments": [
      {
        "body": "Sudah dicek, kabel power longgar",
        "user": "Budi Santoso",
        "is_internal": false,
        "created_at": "2026-02-12T11:00:00+07:00"
      }
    ],
    "created_at": "2026-02-12T10:30:00+07:00",
    "updated_at": "2026-02-12T11:00:00+07:00"
  }
}
```

**Catatan:** Hanya bisa akses tiket yang `requester_id` sesuai dengan user yang punya `simrs_nik` = NIK di query.

---

### 4. Tambah Komentar pada Tiket

**POST** `/api/tickets/{id}/comments`

Pelapor (NIK) bisa menambah komentar publik pada tiket miliknya. Komentar internal hanya bisa dari staff/admin lewat web.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nik": "123456789",
  "body": "Saya sudah cek lagi, monitor masih belum nyala. Mungkin perlu ganti kabel."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Komentar berhasil ditambahkan.",
  "data": {
    "id": 456,
    "body": "Saya sudah cek lagi, monitor masih belum nyala. Mungkin perlu ganti kabel.",
    "created_at": "2026-02-12T14:00:00+07:00"
  }
}
```

**Field:**
- `nik` (required): NIK pelapor — harus sama dengan requester tiket
- `body` (required): Isi komentar (max 10.000 karakter)

**Catatan:** Hanya requester tiket (user dengan `simrs_nik` = NIK) yang bisa menambah komentar. Komentar via API selalu **publik** (bukan internal). Requester dan assignee akan dapat notifikasi.

---

## Error Response

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Pegawai dengan NIK tersebut tidak ditemukan di SIMRS atau belum terdaftar."
}
```

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "title": ["Judul tiket harus diisi."],
    "ticket_type_id": ["Tipe tiket harus dipilih."]
  }
}
```

---

## Master Data (untuk referensi)

Untuk mendapatkan ID master (tipe, kategori, prioritas), aplikasi kepegawaian bisa:

1. **Akses web PortalSifast** (dengan login admin/staff) → lihat dropdown di form create ticket
2. **Atau buat endpoint tambahan** untuk list master data (opsional, bisa ditambah nanti)

**Contoh ID yang umum:**
- `ticket_type_id`: 1=Insiden, 2=Permintaan Layanan
- `ticket_priority_id`: 1=P1-Kritis, 2=P2-Tinggi, 3=P3-Sedang, 4=P4-Rendah

---

## Contoh Request (cURL)

```bash
# Buat tiket
curl -X POST https://your-domain.com/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "123456789",
    "ticket_type_id": 1,
    "ticket_priority_id": 2,
    "title": "Printer error",
    "description": "Printer tidak bisa print"
  }'

# List tiket
curl -X GET "https://your-domain.com/api/tickets?nik=123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Detail tiket
curl -X GET "https://your-domain.com/api/tickets/123?nik=123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tambah komentar
curl -X POST https://your-domain.com/api/tickets/123/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nik": "123456789", "body": "Update: sudah dicoba restart, masih belum nyala."}'
```

---

## Catatan Penting

1. **Auto-create User:** Sistem akan otomatis membuat User di PortalSifast jika NIK belum terdaftar (ambil data dari Pegawai SIMRS). Password dibuat random dan tidak dipakai untuk login web.
2. **NIK sebagai Identifier:** Semua request harus bawa NIK untuk mengidentifikasi pelapor. NIK harus sesuai dengan `nik` di tabel `pegawai` (SIMRS).
3. **Notifikasi:** Setelah tiket dibuat, staff di departemen terkait akan mendapat notifikasi email (jika email dikonfigurasi).
4. **SLA:** SLA otomatis dihitung berdasarkan tipe, prioritas, dan kategori tiket.
5. **Komentar:** Pelapor bisa menambah komentar via API (`POST /api/tickets/{id}/comments`) dengan NIK + body. Hanya requester tiket yang boleh komentar; komentar via API selalu publik. Requester dan assignee dapat notifikasi.
