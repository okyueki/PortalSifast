# 📋 Dokumentasi API Backend - Panic Button App

**Versi:** 1.0  
**Base URL:** `https://api.yourdomain.com/v1`  
**Format:** JSON  
**Auth:** Bearer Token (JWT)

---

## 🔐 Autentikasi

Semua endpoint (kecuali login) memerlukan header:
```
Authorization: Bearer {token}
```

---

## 📡 Endpoints

---

### 1. Kirim Laporan Darurat

**POST** `/emergency/reports`

Dipanggil saat pengguna menekan tombol panic dan mengirim laporan.

#### Request Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

#### Request Body
```json
{
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

#### Field `category` (Enum)
| Value | Keterangan |
|-------|-----------|
| `kecelakaan_lalu_lintas` | Kecelakaan Lalu Lintas |
| `ibu_hamil` | Ibu Hamil (darurat persalinan) |
| `serangan_jantung` | Serangan Jantung |
| `serangan_stroke` | Serangan Stroke |
| `home_care` | Request Home Care (perawatan medis di rumah) |
| `ambulance` | Request Ambulance (permintaan ambulance segera) |

#### Response Success `201 Created`
```json
{
  "success": true,
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "pending",
    "assigned_operator": {
      "id": 5,
      "name": "Operator Jakarta Pusat"
    },
    "estimated_response_minutes": 5,
    "created_at": "2024-02-19T10:30:00+07:00"
  },
  "message": "Laporan berhasil diterima"
}
```

#### Response Error `422 Unprocessable Entity`
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

### 2. Cek Status Laporan

**GET** `/emergency/reports/{report_id}`

Digunakan oleh frontend untuk polling status laporan.

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

#### Status Laporan (Enum)
| Status | Keterangan |
|--------|-----------|
| `pending` | Menunggu operator merespons |
| `responded` | Operator telah merespons |
| `in_progress` | Bantuan sedang dalam perjalanan |
| `resolved` | Kasus selesai ditangani |
| `cancelled` | Dibatalkan oleh pelapor |

---

### 3. Daftar Riwayat Laporan (milik pengguna)

**GET** `/emergency/reports`

#### Query Parameters
| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|-----------|
| `page` | int | 1 | Nomor halaman |
| `per_page` | int | 15 | Jumlah per halaman |
| `status` | string | - | Filter berdasarkan status |
| `category` | string | - | Filter berdasarkan kategori |

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
  "pagination": {
    "total": 10,
    "per_page": 15,
    "current_page": 1,
    "last_page": 1
  }
}
```

---

### 4. Batalkan Laporan

**PATCH** `/emergency/reports/{report_id}/cancel`

Memungkinkan pengguna membatalkan laporan yang masih berstatus `pending`.

#### Request Body
```json
{
  "reason": "Sudah ditangani sendiri"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "cancelled"
  },
  "message": "Laporan berhasil dibatalkan"
}
```

#### Response Error (sudah direspons) `409 Conflict`
```json
{
  "success": false,
  "message": "Laporan tidak dapat dibatalkan karena sudah direspons operator"
}
```

---

### 5. Upload Foto Kejadian

**POST** `/emergency/reports/{report_id}/photo`

#### Request (multipart/form-data)
```
photo: [file binary, max 5MB, jpeg/png/webp]
```

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

### 6. [OPERATOR] Daftar Laporan Masuk

**GET** `/operator/reports`

Endpoint khusus untuk dashboard operator.

#### Query Parameters
| Parameter | Tipe | Keterangan |
|-----------|------|-----------|
| `status` | string | Filter status |
| `category` | string | Filter kategori |
| `date_from` | date | Tanggal mulai |
| `date_to` | date | Tanggal akhir |
| `area` | string | Filter area/wilayah |

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

### 7. [OPERATOR] Respons Laporan

**PATCH** `/operator/reports/{report_id}/respond`

Digunakan operator untuk merespons dan memperbarui status laporan.

#### Request Body
```json
{
  "status": "in_progress",
  "notes": "Tim rescue diberangkatkan, ETA 10 menit",
  "assigned_team": "Tim Alpha"
}
```

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

## 🚗 Tracking Petugas Real-time (seperti Gojek)

Fitur ini memungkinkan korban melihat posisi petugas yang bergerak menuju lokasi.

---

### 8. [OFFICER] Update Lokasi GPS Petugas

**POST** `/officer/location`

Dipanggil oleh app petugas setiap **5 detik** saat dalam perjalanan.

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

---

### 9. Get Lokasi Petugas (untuk korban - polling)

**GET** `/emergency/reports/{report_id}/officer-location`

Frontend korban polling setiap **5 detik** untuk update posisi petugas.

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "officer": {
      "id": 5,
      "name": "Ahmad Fauzi",
      "badge": "OFFICER-01",
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

---

### 10. [OFFICER] Login Petugas

**POST** `/officer/auth/login`

#### Request Body
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
    "token": "eyJhbGciOiJIUzI1...",
    "officer": {
      "id": 5,
      "name": "Ahmad Fauzi",
      "badge": "OFFICER-01",
      "area": "Jakarta Pusat"
    }
  }
}
```

---

## 🔔 Webhooks / Push Notification

### Opsi A: FCM Push Notification
```json
{
  "to": "{fcm_device_token}",
  "notification": {
    "title": "Laporan RPT-2024-0001 Diperbarui",
    "body": "Operator telah merespons laporan Anda"
  },
  "data": { "report_id": "RPT-2024-0001", "status": "responded" }
}
```

### Opsi B: WebSocket — Laravel Reverb (Recommended)
```
Channel: reports.{report_id}
Event: report.status_updated
Payload: { report_id, status, responded_at, notes }

Channel: officer.{officer_id}.location
Event: officer.location_updated
Payload: { latitude, longitude, eta_minutes, distance_meters }
```

```php
// Broadcast posisi petugas setiap update
broadcast(new OfficerLocationUpdated($officer, $locationData));
```

### Opsi C: Polling (Fallback)
`GET /emergency/reports/{report_id}/officer-location` setiap **5 detik**

---

## 📊 Database Schema (Laravel Migration)

```php
// emergency_reports table
Schema::create('emergency_reports', function (Blueprint $table) {
    $table->id();
    $table->string('report_id')->unique();
    $table->foreignId('user_id')->nullable()->constrained();
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->text('address');
    $table->enum('category', ['kecelakaan_lalu_lintas','ibu_hamil','serangan_jantung','serangan_stroke','home_care','ambulance']);
    $table->enum('status', ['pending','responded','in_progress','resolved','cancelled'])->default('pending');
    $table->string('sender_name')->nullable();
    $table->string('sender_phone')->nullable();
    $table->string('device_id')->nullable();
    $table->text('notes')->nullable();
    $table->string('photo_url')->nullable();
    $table->foreignId('assigned_operator_id')->nullable()->constrained('users');
    $table->text('response_notes')->nullable();
    $table->timestamp('responded_at')->nullable();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// officer_locations — tracking real-time
Schema::create('officer_locations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('officer_id')->constrained('users');
    $table->foreignId('report_id')->nullable()->constrained('emergency_reports');
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->decimal('speed_kmh', 5, 2)->nullable();
    $table->integer('heading')->nullable();
    $table->integer('eta_minutes')->nullable();
    $table->integer('distance_meters')->nullable();
    $table->timestamps();
    $table->index(['officer_id', 'created_at']);
});

// officers table
Schema::create('officers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('badge_id')->unique();
    $table->string('area');
    $table->string('vehicle_number')->nullable();
    $table->enum('status', ['available','on_duty','off_duty'])->default('available');
    $table->timestamps();
});
```

---

## ⚡ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST `/emergency/reports` | 5 req/menit per user |
| GET `/emergency/reports/*` | 60 req/menit |
| PATCH `/operator/reports/*` | 30 req/menit |
| POST `/officer/location` | 30 req/menit per officer |

---

## 🚨 Error Codes

| HTTP Code | Keterangan |
|-----------|-----------|
| 200 | OK |
| 201 | Created |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limit |
| 500 | Internal Server Error |

---

## 📝 Catatan untuk Developer Laravel

1. **Authentication**: Laravel Sanctum untuk user & officer token.
2. **Report ID**: Format `RPT-{YEAR}-{5-digit-sequence}` via observer.
3. **Real-time Tracking**: Gunakan **Laravel Reverb** (WebSocket bawaan Laravel) untuk broadcast posisi petugas.
4. **ETA Calculation**: Haversine formula atau Google Distance Matrix API.
5. **Officer Assignment**: Auto-assign petugas terdekat (nearest-neighbor) berdasarkan GPS.
6. **Queue**: Laravel Queue (Redis) untuk notifikasi agar non-blocking.
7. **Audit Log**: Setiap perubahan status tercatat di `report_status_logs`.
8. **WhatsApp**: Tambahkan WhatsApp Business API sebagai notifikasi tambahan.


### Opsi A: FCM Push Notification (Recommended untuk Mobile)
```json
{
  "to": "{fcm_device_token}",
  "notification": {
    "title": "Laporan RPT-2024-0001 Diperbarui",
    "body": "Operator telah merespons laporan Anda"
  },
  "data": {
    "report_id": "RPT-2024-0001",
    "status": "responded"
  }
}
```

### Opsi B: WebSocket (Untuk Web App)
```
Channel: reports.{report_id}
Event: report.status_updated
Payload: { report_id, status, responded_at, notes }
```

### Opsi C: Polling (Fallback)
Frontend melakukan polling setiap **30 detik** ke endpoint:  
`GET /emergency/reports/{report_id}`

---

## 📊 Database Schema Rekomendasi (Laravel Migration)

```php
// emergency_reports table
Schema::create('emergency_reports', function (Blueprint $table) {
    $table->id();
    $table->string('report_id')->unique(); // RPT-2024-XXXX
    $table->foreignId('user_id')->nullable()->constrained();
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->text('address');
    $table->enum('category', [
        'kecelakaan_lalu_lintas',
        'ibu_hamil',
        'serangan_jantung',
        'serangan_stroke',
        'home_care',
        'ambulance'
    ]);
    $table->enum('status', [
        'pending', 'responded', 'in_progress', 'resolved', 'cancelled'
    ])->default('pending');
    $table->string('sender_name')->nullable();
    $table->string('sender_phone')->nullable();
    $table->string('device_id')->nullable();
    $table->text('notes')->nullable();
    $table->string('photo_url')->nullable();
    $table->foreignId('assigned_operator_id')->nullable()->constrained('users');
    $table->text('response_notes')->nullable();
    $table->timestamp('responded_at')->nullable();
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

---

## ⚡ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST `/emergency/reports` | 5 requests / menit per user |
| GET `/emergency/reports/*` | 60 requests / menit |
| PATCH `/operator/reports/*` | 30 requests / menit |

---

## 🚨 Error Codes

| HTTP Code | Keterangan |
|-----------|-----------|
| 200 | OK |
| 201 | Created |
| 401 | Unauthorized - Token tidak valid/expired |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Laporan tidak ditemukan |
| 409 | Conflict - Status tidak bisa diubah |
| 422 | Unprocessable Entity - Validasi gagal |
| 429 | Too Many Requests - Rate limit terlampaui |
| 500 | Internal Server Error |

---

## 📝 Catatan untuk Developer Laravel

1. **Authentication**: Gunakan Laravel Sanctum atau Passport untuk token-based auth.
2. **Report ID**: Generate format `RPT-{YEAR}-{5-digit-sequence}` menggunakan observer atau mutator.
3. **Geofencing** (opsional): Tentukan radius area operator menggunakan PostGIS atau Haversine formula.
4. **WhatsApp Integration**: Tambahkan WhatsApp Business API sebagai kanal notifikasi tambahan selain push notification.
5. **Audit Log**: Setiap perubahan status laporan harus tercatat di tabel `report_status_logs`.
6. **Queue**: Gunakan Laravel Queue (Redis) untuk mengirim notifikasi agar tidak memblokir response API.
