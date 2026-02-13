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

Ada 2 versi endpoint:
1. **`/api/tickets`** - Endpoint standar (response tanpa pagination)
2. **`/api/sifast/ticket`** - Endpoint untuk frontend kepegawaian (dengan pagination & master data)

Base URL: `https://your-domain.com/api`

---

## Endpoint Frontend Kepegawaian (Rekomendasi)

Endpoint ini dirancang untuk frontend React dengan pagination dan akses master data.

### 1. Master Data - Tipe Tiket

**GET** `/api/sifast/ticket-type`

**Response (200):**
```json
[
  { "id": 1, "name": "Insiden", "slug": "insiden", "description": "Gangguan/kerusakan" },
  { "id": 2, "name": "Permintaan Layanan", "slug": "permintaan-layanan", "description": "Request baru" }
]
```

---

### 2. Master Data - Kategori Tiket

**GET** `/api/sifast/ticket-category`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Hardware Komputer",
    "dep_id": "IT",
    "ticket_type_id": 1,
    "is_development": false,
    "subcategories": [
      { "id": 1, "name": "Monitor", "ticket_category_id": 1, "is_active": true },
      { "id": 2, "name": "Keyboard/Mouse", "ticket_category_id": 1, "is_active": true }
    ]
  }
]
```

---

### 3. Master Data - Prioritas Tiket

**GET** `/api/sifast/ticket-priority`

**Response (200):**
```json
[
  { "id": 1, "name": "P1 - Kritis", "level": 1, "color": "red", "response_hours": 1, "resolution_hours": 4 },
  { "id": 2, "name": "P2 - Tinggi", "level": 2, "color": "orange", "response_hours": 4, "resolution_hours": 8 },
  { "id": 3, "name": "P3 - Sedang", "level": 3, "color": "yellow", "response_hours": 8, "resolution_hours": 24 },
  { "id": 4, "name": "P4 - Rendah", "level": 4, "color": "green", "response_hours": 24, "resolution_hours": 72 }
]
```

---

### 4. Master Data - Status Tiket

**GET** `/api/sifast/ticket-status`

**Response (200):**
```json
[
  { "id": 1, "name": "Baru", "slug": "new", "color": "blue", "order": 1, "is_closed": false },
  { "id": 2, "name": "Ditugaskan", "slug": "assigned", "color": "yellow", "order": 2, "is_closed": false },
  { "id": 3, "name": "Dalam Proses", "slug": "in_progress", "color": "orange", "order": 3, "is_closed": false },
  { "id": 4, "name": "Menunggu Konfirmasi", "slug": "pending_confirmation", "color": "purple", "order": 4, "is_closed": false },
  { "id": 5, "name": "Ditutup", "slug": "closed", "color": "green", "order": 5, "is_closed": true }
]
```

---

### 5. Daftar Tiket (Paginated)

**GET** `/api/sifast/ticket?nik={nik}&page=1`

**Query Parameters:**
- `nik` (required): NIK pelapor
- `page` (optional): Halaman, default 1
- `per_page` (optional): Jumlah per halaman, default 15, max 100
- `status` (optional): Filter by status ID
- `priority` (optional): Filter by priority ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "ticket_number": "TKT-20260212-0001",
      "title": "Monitor tidak menyala",
      "description": "Monitor di ruang IGD tidak menyala sejak pagi",
      "type": "Insiden",
      "type_id": 1,
      "category": "Hardware Komputer",
      "category_id": 2,
      "priority": "P2 - Tinggi",
      "priority_id": 2,
      "priority_color": "orange",
      "status": "Ditugaskan",
      "status_id": 2,
      "status_color": "yellow",
      "is_closed": false,
      "assignee": "Budi Santoso",
      "created_at": "2026-02-12T10:30:00+07:00",
      "updated_at": "2026-02-12T11:00:00+07:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}
```

---

### 6. Buat Tiket Baru

**POST** `/api/sifast/ticket`

**Body:**
```json
{
  "nik": "123456789",
  "title": "Monitor tidak menyala",
  "description": "Monitor di ruang IGD tidak menyala sejak pagi"
}
```

**Body (dengan nama field Indonesia - alias):**
```json
{
  "nik": "123456789",
  "judul": "Monitor tidak menyala",
  "deskripsi": "Monitor di ruang IGD tidak menyala sejak pagi",
  "kategori_id": 2,
  "prioritas": "sedang"
}
```

**Body (lengkap, opsional):**
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

**Field:**
- `nik` (required): NIK pelapor
- `title` atau `judul` (required): Judul tiket (max 255)
- `ticket_type_id` atau `tipe_id` (optional): ID tipe tiket. Default: tipe pertama yang aktif (Insiden)
- `ticket_category_id` atau `kategori_id` (optional): ID kategori
- `ticket_subcategory_id` (optional): ID sub-kategori  
- `ticket_priority_id` atau `prioritas_id` atau `prioritas` (optional): ID prioritas atau nama ('kritis', 'tinggi', 'sedang', 'rendah'). Default: P4 - Rendah
- `description` atau `deskripsi` (optional): Deskripsi (max 10000)
- `asset_no_inventaris` (optional): No inventaris jika terkait asset
- `tag_ids` (optional): Array ID tag

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

---

### 7. Detail Tiket

**GET** `/api/sifast/ticket/{id}?nik={nik}`

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
        "id": 1,
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

---

### 8. Tambah Komentar

**POST** `/api/sifast/ticket/{id}/comments`

**Body:**
```json
{
  "nik": "123456789",
  "body": "Saya sudah cek lagi, monitor masih belum nyala."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Komentar berhasil ditambahkan.",
  "data": {
    "id": 456,
    "body": "Saya sudah cek lagi, monitor masih belum nyala.",
    "created_at": "2026-02-12T14:00:00+07:00"
  }
}
```

---

## Endpoint Standar (Legacy)

Endpoint ini tetap tersedia untuk kompatibilitas.

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
- `title` (required): Judul tiket (max 255)
- `ticket_type_id` (optional): ID tipe tiket. Default: tipe pertama yang aktif (Insiden)
- `ticket_category_id` (optional): ID kategori
- `ticket_subcategory_id` (optional): ID sub-kategori
- `ticket_priority_id` (optional): ID prioritas. Default: prioritas terendah (P4 - Rendah)
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

Master data tersedia via endpoint `/api/sifast/`:

| Endpoint | Keterangan |
|----------|------------|
| `GET /api/sifast/ticket-type` | Tipe tiket (Insiden, Permintaan Layanan) |
| `GET /api/sifast/ticket-category` | Kategori + subkategori |
| `GET /api/sifast/ticket-priority` | Prioritas (P1-P4) dengan warna |
| `GET /api/sifast/ticket-status` | Status tiket dengan warna |

**Contoh ID yang umum:**
- `ticket_type_id`: 1=Insiden, 2=Permintaan Layanan
- `ticket_priority_id`: 1=P1-Kritis, 2=P2-Tinggi, 3=P3-Sedang, 4=P4-Rendah

---

## Contoh Request (cURL)

```bash
# ===================== ENDPOINT SIFAST (REKOMENDASI) =====================

# Master data - tipe tiket
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket-type" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Master data - kategori
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket-category" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Master data - prioritas
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket-priority" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Master data - status
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket-status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List tiket (paginated)
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket?nik=123456789&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List tiket dengan filter
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket?nik=123456789&page=1&status=2&priority=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buat tiket (minimal - hanya nik dan title)
curl -X POST http://192.168.10.57:8000/api/sifast/ticket \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "123456789",
    "title": "Printer error",
    "description": "Printer tidak bisa print"
  }'

# Buat tiket (lengkap dengan type dan priority)
curl -X POST http://192.168.10.57:8000/api/sifast/ticket \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "123456789",
    "ticket_type_id": 1,
    "ticket_priority_id": 2,
    "title": "Printer error",
    "description": "Printer tidak bisa print"
  }'

# Detail tiket
curl -X GET "http://192.168.10.57:8000/api/sifast/ticket/123?nik=123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tambah komentar
curl -X POST http://192.168.10.57:8000/api/sifast/ticket/123/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nik": "123456789", "body": "Update: sudah dicoba restart, masih belum nyala."}'

# ===================== ENDPOINT LEGACY =====================

# List tiket (tanpa pagination)
curl -X GET "http://192.168.10.57:8000/api/tickets?nik=123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buat tiket (minimal)
curl -X POST http://192.168.10.57:8000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "123456789",
    "title": "Printer error",
    "description": "Printer tidak bisa print"
  }'
```

---

## Catatan Penting

1. **Dua Versi Endpoint:** Gunakan `/api/sifast/` untuk frontend dengan pagination, atau `/api/tickets/` untuk integrasi sederhana.
2. **Auto-create User:** Sistem akan otomatis membuat User di PortalSifast jika NIK belum terdaftar (ambil data dari Pegawai SIMRS). Password dibuat sama dengan email.
3. **NIK sebagai Identifier:** Semua request harus bawa NIK untuk mengidentifikasi pelapor. NIK harus sesuai dengan `nik` di tabel `pegawai` (SIMRS).
4. **Notifikasi:** Setelah tiket dibuat, staff di departemen terkait akan mendapat notifikasi email (jika email dikonfigurasi).
5. **SLA:** SLA otomatis dihitung berdasarkan tipe, prioritas, dan kategori tiket.
6. **Komentar:** Pelapor bisa menambah komentar via API. Hanya requester tiket yang boleh komentar; komentar via API selalu publik.

---

## Alias Field (untuk kemudahan Frontend)

API mendukung nama field alternatif (bahasa Indonesia):

| Field Standar | Alias |
|---------------|-------|
| `title` | `judul` |
| `description` | `deskripsi` |
| `ticket_type_id` | `tipe_id` |
| `ticket_category_id` | `kategori_id` |
| `ticket_priority_id` | `prioritas_id` atau `prioritas` |

**Untuk `prioritas`** bisa pakai string:
- `'kritis'` atau `'p1'` → P1
- `'tinggi'` atau `'p2'` → P2
- `'sedang'` atau `'p3'` → P3
- `'rendah'` atau `'p4'` → P4

---

## Ringkasan Endpoint

| Metode | Endpoint (Sifast) | Keterangan |
|--------|-------------------|------------|
| GET | `/api/sifast/ticket-type` | Master tipe tiket |
| GET | `/api/sifast/ticket-category` | Master kategori |
| GET | `/api/sifast/ticket-priority` | Master prioritas |
| GET | `/api/sifast/ticket-status` | Master status |
| GET | `/api/sifast/ticket?nik=xxx&page=1` | Daftar tiket (paginated) |
| POST | `/api/sifast/ticket` | Buat tiket baru |
| GET | `/api/sifast/ticket/{id}?nik=xxx` | Detail tiket |
| POST | `/api/sifast/ticket/{id}/comments` | Tambah komentar |

| Metode | Endpoint (Legacy) | Keterangan |
|--------|-------------------|------------|
| GET | `/api/tickets?nik=xxx` | Daftar tiket (tanpa pagination) |
| POST | `/api/tickets` | Buat tiket baru |
| GET | `/api/tickets/{id}?nik=xxx` | Detail tiket |
| POST | `/api/tickets/{id}/comments` | Tambah komentar |
