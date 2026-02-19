# API Sifast – Referensi Frontend

**Versi:** 1.0  
**Base URL:** `https://your-domain.com/api` (tanpa `/v1`)  
**Format:** JSON  
**Auth:** Bearer Token (Laravel Sanctum)

Dokumen ini menyatukan **semua endpoint API** yang dipakai frontend Sifast (aplikasi kepegawaian, panic button, tracking petugas, dll.) dan **diselaraskan dengan fitur yang sudah ada** di PortalSifast. Semua fitur mengikuti pola auth, base URL, dan format response yang sama.

**Status Implementasi:**
- ✅ **Ticketing & User:** Sudah tersedia dan berjalan
- ✅ **Emergency Reports:** Sudah tersedia dan berjalan
- ⚠️ **Officer Tracking:** Spesifikasi siap, backend belum diimplementasikan

**Catatan untuk Developer Frontend:**
1. Semua endpoint memerlukan **Bearer Token** di header `Authorization: Bearer {token}`. Token di-generate sekali di PortalSifast server menggunakan `php artisan api:token:generate kepegawaian-app`.
2. User diidentifikasi dengan **NIK** (bukan login ke PortalSifast). Untuk endpoint yang memerlukan identitas user, selalu kirim `nik` sebagai query parameter atau di request body.
3. Format response konsisten: `{ "success": true|false, "data": {...}, "message": "...", "errors": {...} }`.
4. Untuk detail lengkap endpoint ticketing, lihat `docs/API-TICKETING.md`.
5. Endpoint Officer Tracking (Section 4) belum tersedia di backend; frontend bisa mulai prepare UI/UX, tapi endpoint belum bisa dipanggil.

---

## 1. Autentikasi (sama untuk semua fitur)

Semua endpoint memerlukan header:

```
Authorization: Bearer {token}
```

- **Token** di-generate sekali di PortalSifast (`php artisan api:token:generate kepegawaian-app`), disimpan di aplikasi frontend (env).
- **Tidak ada login per user** ke PortalSifast. User diidentifikasi dengan **NIK** (dari login di aplikasi kepegawaian).
- Untuk endpoint yang butuh identitas user (tiket milik siapa, laporan darurat dari siapa): selalu kirim **`nik`** (query atau body).
- **Untuk petugas (officer):** Ada endpoint login khusus dengan **NIK** (atau badge_id jika sudah ada di users) + password, dapat token Sanctum untuk akses endpoint officer. Petugas adalah user yang sudah ada dengan `role` = `'staff'` dan `dep_id` = `'DRIVER'` atau `'IGD'`.

Detail lengkap: lihat **`docs/API-TICKETING.md`** bagian Autentikasi dan "Login dan Get Nama User".

---

## 2. Fitur yang sudah ada di PortalSifast

Endpoint berikut **sudah tersedia** dan dipakai untuk ticketing + user.

| Keterangan | Method | Endpoint |
|------------|--------|----------|
| Data user (nama, email, dll.) by NIK | GET | `/api/user?nik={nik}` atau `/api/sifast/user?nik={nik}` |
| Buat tiket | POST | `/api/tickets` atau `/api/sifast/ticket` |
| Daftar tiket (milik NIK) | GET | `/api/tickets?nik={nik}` atau `/api/sifast/ticket?nik=...&page=...` |
| Detail tiket | GET | `/api/tickets/{id}?nik={nik}` atau `/api/sifast/ticket/{id}?nik={nik}` |
| Tambah komentar | POST | `/api/tickets/{id}/comments` atau `/api/sifast/ticket/{id}/comments` |
| Master: tipe/kategori/prioritas/status tiket | GET | `/api/sifast/ticket-type`, `/api/sifast/ticket-category`, `/api/sifast/ticket-priority`, `/api/sifast/ticket-status` |

Format response yang dipakai: `{ "success": true, "data": { ... }, "message": "..." }`. Error validasi: `{ "message": "...", "errors": { "field": ["..."] } }`.

**Dokumentasi lengkap (request body, response, contoh):** **`docs/API-TICKETING.md`**.

---

## 3. Fitur Emergency / Panic Button

**Status backend:** Sudah diimplementasikan. Route di bawah `auth:sanctum` dan prefix `/api/sifast/emergency`. Controller: `App\Http\Controllers\Api\EmergencyReportController`, model: `App\Models\EmergencyReport`, migration: `emergency_reports`.

Bagian ini mendeskripsikan API **laporan darurat**. Implementasinya mengikuti pola yang sama dengan fitur di atas (auth, base URL, envelope response, identifikasi user pakai NIK).

- **Base path:** `/api/sifast/emergency` (tetap di bawah `/api`, prefix `sifast`).
- **Auth:** Bearer token yang sama; untuk scope per user selalu kirim **`nik`** (body atau query).
- **Response:** Selalu `{ "success": true|false, "data": {...}, "message": "..." }`. Error 422: `"errors"` berisi detail validasi.

---

### 3.1 Kirim Laporan Darurat

**POST** `/api/sifast/emergency/reports`

Dipanggil saat pengguna menekan tombol panic. Pelapor diidentifikasi dengan **NIK** (wajib), konsisten dengan ticketing.

#### Request Headers

```
Content-Type: application/json
Authorization: Bearer {token}
```

#### Request Body

```json
{
  "nik": "123456789",
  "latitude": -6.200000,
  "longitude": 106.816666,
  "address": "Jl. Sudirman No.1, Jakarta Pusat, DKI Jakarta",
  "category": "kecelakaan_lalu_lintas",
  "timestamp": "2024-02-19T10:30:00+07:00",
  "sender_name": "Budi Santoso",
  "sender_phone": "081234567890",
  "device_id": "uuid-device",
  "notes": "Terjadi tabrakan di persimpangan"
}
```

- **`nik`** (required): NIK pelapor (sama seperti di ticketing; user bisa auto-create dari SIMRS jika belum ada).
- **`latitude`**, **`longitude`**, **`address`**: lokasi (required sesuai validasi backend).
- **`category`**: enum (lihat tabel di bawah).
- **`timestamp`**: ISO 8601 (opsional; default server time).
- **`sender_name`**, **`sender_phone`**: opsional (bisa diisi dari data user by NIK).
- **`device_id`**, **`notes`**: opsional.

#### Kategori (`category`)

| Value | Keterangan |
|-------|------------|
| `kecelakaan_lalu_lintas` | Kecelakaan Lalu Lintas |
| `ibu_hamil` | Ibu Hamil (darurat persalinan) |
| `serangan_jantung` | Serangan Jantung |
| `serangan_stroke` | Serangan Stroke |
| `home_care` | Request Home Care |
| `ambulance` | Request Ambulance |

#### Response Success `201 Created`

```json
{
  "success": true,
  "message": "Laporan berhasil diterima",
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "pending",
    "assigned_operator": null,
    "estimated_response_minutes": 5,
    "created_at": "2024-02-19T10:30:00+07:00"
  }
}
```

**Catatan:** `assigned_operator` selalu `null` saat laporan baru dibuat (belum ada operator yang merespons). `estimated_response_minutes` adalah nilai default (5 menit); bisa disesuaikan di backend nanti.

#### Response Error `422`

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "category": ["Kategori tidak valid"],
    "latitude": ["Latitude harus berupa angka desimal"]
  }
}
```

---

### 3.2 Cek Status Laporan

**GET** `/api/sifast/emergency/reports/{report_id}?nik={nik}`

Untuk polling status laporan. Hanya pemilik (NIK = pelapor) yang boleh akses, konsisten dengan aturan tiket (requester by NIK).

**Query Parameters:**
- `nik` (required): NIK pelapor (untuk verifikasi kepemilikan)

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "responded",
    "category": "kecelakaan_lalu_lintas",
    "latitude": -6.200000,
    "longitude": 106.816666,
    "address": "Jl. Sudirman No.1, Jakarta Pusat",
    "created_at": "2024-02-19T10:30:00+07:00",
    "responded_at": "2024-02-19T10:35:00+07:00",
    "response_notes": "Tim rescue sedang menuju lokasi",
    "operator": {
      "id": 5,
      "name": "Operator Jakarta Pusat",
      "phone": "02112345678"
    }
    }
}
```

#### Response Error `404 Not Found`

```json
{
  "success": false,
  "message": "Laporan tidak ditemukan atau tidak dapat diakses."
}
```

**Catatan:** Error ini terjadi jika:
- `report_id` tidak ditemukan, atau
- NIK yang diberikan bukan pemilik laporan tersebut

#### Status Laporan

| Status | Keterangan |
|--------|------------|
| `pending` | Menunggu operator merespons |
| `responded` | Operator telah merespons |
| `in_progress` | Bantuan sedang dalam perjalanan |
| `resolved` | Kasus selesai ditangani |
| `cancelled` | Dibatalkan oleh pelapor |

---

### 3.3 Daftar Riwayat Laporan (milik pengguna)

**GET** `/api/sifast/emergency/reports?nik={nik}&page=1&per_page=15&status=...&category=...`

Query **`nik`** wajib (scope milik user tersebut). Pagination dan filter sama pola dengan daftar tiket.

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "report_id": "RPT-2024-0001",
      "status": "responded",
      "category": "kecelakaan_lalu_lintas",
      "address": "Jl. Sudirman No.1, Jakarta Pusat",
      "created_at": "2024-02-19T10:30:00+07:00",
      "responded_at": "2024-02-19T10:35:00+07:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 10
  }
}
```

(Pola `meta` mengikuti response pagination ticketing yang sudah ada.)

---

### 3.4 Batalkan Laporan

**PATCH** `/api/sifast/emergency/reports/{report_id}/cancel?nik={nik}`

Hanya pemilik (NIK) yang boleh membatalkan; hanya status `pending` yang bisa dibatalkan.

**Query Parameters:**
- `nik` (required): NIK pelapor (untuk verifikasi kepemilikan)

#### Request Body

```json
{
  "reason": "Sudah ditangani sendiri"
}
```

**Field:**
- `reason` (optional): Alasan pembatalan (maksimal 1000 karakter)

#### Response `200 OK`

```json
{
  "success": true,
  "message": "Laporan berhasil dibatalkan",
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "cancelled"
  }
}
```

#### Response `409 Conflict`

```json
{
  "success": false,
  "message": "Laporan tidak dapat dibatalkan karena sudah direspons operator"
}
```

---

### 3.5 Upload Foto Kejadian

**POST** `/api/sifast/emergency/reports/{report_id}/photo?nik={nik}`

**Content-Type:** `multipart/form-data`  
**Body:** 
- `nik` (required, query parameter atau form field)
- `photo` (required, file, max 5MB, format: jpeg/jpg/png/webp)

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "photo_url": "https://storage.yourdomain.com/reports/RPT-2024-0001/photo.jpg"
  }
}
```

---

### 3.6 [OPERATOR] Daftar Laporan Masuk

**GET** `/api/sifast/emergency/operator/reports?status=...&category=...&date_from=...&date_to=...`

Endpoint untuk dashboard operator. Otorisasi: hanya user dengan role **admin** atau **staff** (di PortalSifast) yang boleh akses (sama konsep dengan staff/admin ticketing).

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `responded`, `in_progress`, `resolved`, `cancelled`)
- `category` (optional): Filter by category (lihat daftar kategori di 3.1)
- `date_from` (optional): Filter dari tanggal (format: `YYYY-MM-DD`)
- `date_to` (optional): Filter sampai tanggal (format: `YYYY-MM-DD`)

**Catatan:** 
- Response tidak menggunakan pagination (semua data dikembalikan dalam satu response). Untuk dataset besar, pertimbangkan menambahkan pagination di backend nanti.
- Parameter `area` tidak tersedia saat ini (bisa ditambahkan di backend nanti jika diperlukan).

#### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "report_id": "RPT-2024-0001",
      "status": "pending",
      "category": "kecelakaan_lalu_lintas",
      "latitude": -6.200000,
      "longitude": 106.816666,
      "address": "Jl. Sudirman No.1, Jakarta Pusat",
      "sender_name": "Budi Santoso",
      "sender_phone": "081234567890",
      "created_at": "2024-02-19T10:30:00+07:00",
      "waiting_minutes": 5
    }
  ]
}
```

---

### 3.7 [OPERATOR] Respons Laporan

**PATCH** `/api/sifast/emergency/operator/reports/{report_id}/respond`

#### Request Body

```json
{
  "status": "in_progress",
  "notes": "Tim rescue diberangkatkan, ETA 10 menit",
  "assigned_team": "Tim Alpha"
}
```

**Field:**
- `status` (required): Status baru (`responded`, `in_progress`, atau `resolved`)
- `notes` (optional): Catatan respons dari operator
- `assigned_team` (optional): Nama tim yang ditugaskan

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "in_progress",
    "responded_at": "2024-02-19T10:35:00+07:00"
  }
}
```

---

## 4. Fitur Tracking Petugas Real-time (seperti Gojek)

**Status backend:** ⚠️ **Belum diimplementasikan.** Spesifikasi ini untuk pengembangan selanjutnya. Frontend bisa mulai prepare UI/UX, tapi endpoint belum tersedia di backend.

Fitur ini memungkinkan korban melihat posisi petugas yang bergerak menuju lokasi secara real-time. Petugas menggunakan aplikasi mobile terpisah untuk update lokasi GPS.

**Pola yang diselaraskan:**
- Base path: `/api/sifast/officer` (konsisten dengan `/api/sifast/emergency`).
- Auth: Sanctum Bearer Token (sama seperti fitur lain).
- Response: `{ "success": true, "data": {...}, "message": "..." }`.
- Petugas login dengan `badge_id` + password, dapat Sanctum token untuk akses endpoint officer.

---

### 4.1 [OFFICER] Login Petugas

**POST** `/api/sifast/officer/auth/login`

Petugas login dengan **NIK** (atau badge_id jika sudah ada di users) dan password, dapat Sanctum token untuk akses endpoint officer.

**Catatan:** Petugas adalah **User** yang sudah ada di PortalSifast dengan:
- `role` = `'staff'` (atau role khusus `'driver'`, `'igd'` jika ditambahkan)
- `dep_id` = `'DRIVER'` atau `'IGD'` (atau departemen khusus untuk petugas emergency)
- Bisa juga pakai user dengan `dep_id` = `'IT'`, `'IPS'` jika mereka juga menangani emergency

#### Request Body

```json
{
  "nik": "987654321",
  "password": "rahasia123"
}
```

**Alternatif (jika badge_id sudah ada di users):**
```json
{
  "badge_id": "OFFICER-01",
  "password": "rahasia123"
}
```

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "1|abc123...token_panjang...",
    "officer": {
      "id": 5,
      "name": "Ahmad Fauzi",
      "simrs_nik": "987654321",
      "dep_id": "DRIVER",
      "phone": "081298765432"
    }
  }
}
```

**Catatan:** Token ini dipakai di header `Authorization: Bearer {token}` untuk semua endpoint officer berikutnya. Petugas tetap pakai tabel `users` yang sudah ada; tidak perlu tabel `officers` terpisah.

---

### 4.2 [OFFICER] Update Lokasi GPS Petugas

**POST** `/api/sifast/officer/location`

Dipanggil oleh aplikasi mobile petugas setiap **5 detik** saat dalam perjalanan menuju lokasi laporan. Lokasi disimpan dan di-broadcast ke korban via WebSocket (jika tersedia).

#### Request Headers

```
Authorization: Bearer {token_officer}
Content-Type: application/json
```

#### Request Body

```json
{
  "latitude": -6.195000,
  "longitude": 106.820000,
  "report_id": "RPT-2024-0001",
  "speed_kmh": 42,
  "heading": 180
}
```

- **`latitude`**, **`longitude`** (required): Posisi GPS petugas saat ini.
- **`report_id`** (required): ID laporan yang sedang ditangani.
- **`speed_kmh`** (optional): Kecepatan dalam km/jam.
- **`heading`** (optional): Arah (0-360 derajat).

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "officer_id": 5,
    "distance_to_target_meters": 850,
    "eta_minutes": 3
  }
}
```

**Catatan:** Backend menghitung jarak ke lokasi laporan (Haversine) dan ETA, lalu menyimpan ke `officer_locations`. Jika WebSocket aktif, broadcast ke channel `officer.{officer_id}.location` atau `reports.{report_id}.officer_location`.

---

### 4.3 Get Lokasi Petugas (untuk korban - polling)

**GET** `/api/sifast/emergency/reports/{report_id}/officer-location?nik={nik}`

Frontend korban polling setiap **5 detik** untuk update posisi petugas. Hanya pemilik laporan (NIK = pelapor) yang boleh akses.

#### Request Headers

```
Authorization: Bearer {token}
```

#### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "officer": {
      "id": 5,
      "name": "Ahmad Fauzi",
      "simrs_nik": "987654321",
      "dep_id": "DRIVER",
      "phone": "081298765432"
    },
    "location": {
      "latitude": -6.195000,
      "longitude": 106.820000,
      "updated_at": "2024-02-19T10:32:00+07:00"
    },
    "eta_minutes": 3,
    "distance_meters": 850,
    "status": "in_progress"
  }
}
```

**Catatan:** Jika petugas belum update lokasi atau belum ditugaskan, `location` bisa `null`. Jika WebSocket tersedia, frontend bisa subscribe ke channel `reports.{report_id}.officer_location` untuk update real-time tanpa polling.

---

## 5. Realtime / Notifikasi

Frontend bisa memakai salah satu:

- **Polling (fallback):** 
  - GET `/api/sifast/emergency/reports/{report_id}?nik=...` setiap 30 detik (status laporan).
  - GET `/api/sifast/emergency/reports/{report_id}/officer-location?nik=...` setiap 5 detik (lokasi petugas).
- **Push (FCM):** Backend mengirim push ke `device_id` / FCM token saat status berubah (payload: `report_id`, `status`, dll.).
- **WebSocket (opsional, recommended):** 
  - Channel `reports.{report_id}` → event `report.status_updated` (status laporan berubah).
  - Channel `reports.{report_id}.officer_location` → event `officer.location_updated` (lokasi petugas update).

Implementasi mengikuti kebijakan backend (queue, notifikasi Laravel, Laravel Reverb untuk WebSocket, dll.) yang sudah ada.

---

## 6. Database Schema Rekomendasi

### 6.1 Emergency Reports (sudah diimplementasikan)

```php
Schema::create('emergency_reports', function (Blueprint $table) {
    $table->id();
    $table->string('report_id')->unique(); // RPT-YYYY-XXXXX
    $table->foreignId('user_id')->nullable()->constrained(); // pelapor (dari NIK)
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->text('address');
    $table->string('category', 50);
    $table->string('status', 20)->default('pending');
    $table->string('sender_name')->nullable();
    $table->string('sender_phone')->nullable();
    $table->string('device_id')->nullable();
    $table->text('notes')->nullable();
    $table->string('photo_path')->nullable();
    $table->foreignId('assigned_operator_id')->nullable()->constrained('users');
    $table->text('response_notes')->nullable();
    $table->string('assigned_team')->nullable();
    $table->timestamp('responded_at')->nullable();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

### 6.2 Officer Locations (untuk tracking real-time - belum diimplementasikan)

```php
Schema::create('officer_locations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('officer_id')->constrained('users'); // petugas = user dengan role 'staff' dan dep_id khusus
    $table->foreignId('report_id')->nullable()->constrained('emergency_reports'); // laporan yang sedang ditangani
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->decimal('speed_kmh', 5, 2)->nullable();
    $table->integer('heading')->nullable(); // 0-360 derajat
    $table->integer('eta_minutes')->nullable(); // ETA ke lokasi laporan
    $table->integer('distance_meters')->nullable(); // jarak ke lokasi laporan
    $table->timestamps();
    $table->index(['officer_id', 'created_at']);
    $table->index(['report_id', 'created_at']);
});
```

**Catatan penting:** Petugas emergency (driver, IGD) **menggunakan tabel `users` yang sudah ada**, **tidak perlu tabel `officers` terpisah**. 

**Struktur petugas:**
- Petugas adalah **User** dengan `role` = `'staff'` dan `dep_id` = `'DRIVER'` atau `'IGD'` (atau departemen lain seperti `'IT'`, `'IPS'` jika mereka juga menangani emergency).
- Bisa juga ditambah role khusus `'driver'`, `'igd'` di `users.role` jika diperlukan (tapi lebih sederhana pakai `'staff'` dengan `dep_id` khusus).
- Semua data petugas (nama, email, phone, NIK) sudah ada di `users`.
- Jika perlu extended info (badge_id, vehicle_number), bisa:
  - **Opsi 1:** Tambah kolom nullable di `users`: `badge_id`, `vehicle_number` (jika hanya petugas yang perlu).
  - **Opsi 2:** Pakai JSON column `users.metadata` untuk info opsional: `{"badge_id": "OFFICER-01", "vehicle_number": "B-1234-XX"}`.

**Keuntungan:** Tidak perlu bikin user baru atau tabel terpisah; petugas adalah user yang sudah ada dengan `dep_id` khusus. Saat login officer, cari user dengan NIK (atau badge_id jika sudah ada di users) dan `dep_id` = `'DRIVER'` atau `'IGD'`.

---

## 7. Rate Limiting & Error Codes

Saat diimplementasikan, bisa mengikuti konfigurasi Laravel yang ada:

| Endpoint | Limit (rekomendasi) |
|----------|---------------------|
| POST `/api/sifast/emergency/reports` | 5 request / menit per NIK |
| GET `/api/sifast/emergency/reports/*` | 60 request / menit |
| PATCH operator | 30 request / menit |
| POST `/api/sifast/officer/location` | 30 request / menit per officer |
| GET `/api/sifast/emergency/reports/{id}/officer-location` | 60 request / menit |

**HTTP Status Codes:**

| Code | Keterangan | Kapan Terjadi |
|------|------------|---------------|
| `200 OK` | Request berhasil | GET, PATCH berhasil |
| `201 Created` | Resource berhasil dibuat | POST berhasil (create) |
| `401 Unauthorized` | Token tidak valid atau tidak ada | Missing/invalid Bearer token |
| `403 Forbidden` | Tidak punya akses | User bukan admin/staff untuk endpoint operator |
| `404 Not Found` | Resource tidak ditemukan atau tidak dapat diakses | Report/ticket tidak ada atau bukan milik NIK tersebut |
| `409 Conflict` | Konflik dengan state saat ini | Membatalkan laporan yang sudah direspons |
| `422 Unprocessable Entity` | Validasi gagal | Request body tidak valid (lihat `errors` object) |
| `429 Too Many Requests` | Rate limit terlampaui | Terlalu banyak request dalam waktu tertentu |
| `500 Internal Server Error` | Error server | Error internal backend |

**Format Error Response (422):**
```json
{
  "message": "Validasi gagal",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

**Format Error Response (lainnya):**
```json
{
  "success": false,
  "message": "Pesan error yang jelas"
}
```

---

## 8. Ringkasan sinkronisasi dengan fitur yang ada

| Aspek | Yang sudah ada (Ticketing) | Emergency (sudah ada) | Officer Tracking (spesifikasi) |
|-------|----------------------------|----------------------|--------------------------------|
| Base URL | `/api`, `/api/sifast` | `/api/sifast/emergency` | `/api/sifast/officer` |
| Auth | Bearer token (Sanctum) | Sama | Sama (token dari login badge_id) |
| Identitas user | `nik` (query/body) | `nik` (query/body) | Token officer (dari login NIK/badge_id) |
| Response | `success`, `data`, `message`, `errors` | Sama | Sama |
| Pagination | `data` + `meta` | Sama | Tidak ada (real-time) |
| User auto-create | By NIK dari SIMRS | Bisa pakai mekanisme yang sama | Petugas = user yang sudah ada (role 'staff', dep_id 'DRIVER'/'IGD') |

**Perbedaan dengan dokumentasi frontend (`api-documentation.md`):**

1. **Base URL:** Frontend minta `/v1` atau `/emergency/reports` tanpa prefix. Di sini diselaraskan jadi `/api/sifast/emergency` dan `/api/sifast/officer` (konsisten dengan ticketing).
2. **NIK di Emergency Reports:** Frontend spec tidak pakai NIK di body. Di sini **tetap pakai NIK** (selaras dengan ticketing) untuk identifikasi pelapor dan auto-create user dari SIMRS.
3. **Auth:** Frontend spec pakai "JWT" (tidak spesifik). Di sini **tetap Sanctum** (sudah terpasang di PortalSifast).
4. **Officer Login:** Frontend minta `/officer/auth/login` dengan badge_id. Di sini diselaraskan jadi `/api/sifast/officer/auth/login` dengan **NIK** (atau badge_id jika sudah ada di users) — konsisten dengan pola identifikasi user pakai NIK.
5. **Petugas = User yang sudah ada:** Frontend spec minta tabel `officers` terpisah. Di sini **petugas pakai tabel `users` yang sudah ada** dengan role `'staff'` dan `dep_id` = `'DRIVER'` atau `'IGD'` (atau departemen lain seperti `'IT'`, `'IPS'` jika mereka juga menangani emergency). Tidak perlu tabel `officers` terpisah.
6. **Officer Location:** Frontend minta `/officer/location`. Di sini jadi `/api/sifast/officer/location` (konsisten).

Dokumen ini **tidak mengubah** kontrak API ticketing dan emergency reports yang sudah berjalan; hanya menambah spesifikasi officer tracking agar selaras dan siap diimplementasikan di backend yang sama.
