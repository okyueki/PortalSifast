# API SIMMUTU (Integrasi Frontend Eksternal)

**Base URL:** `https://portalsifast.rsaisyiyahsitifatimah.com/api`  
**Auth:** Bearer Token (Laravel Sanctum)  
**Prefix Endpoint:** `/sifast/simmutu`

Dokumen ini untuk integrasi input SIMMUTU dari aplikasi frontend lain (mobile/web) tanpa masuk ke halaman Inertia PortalSifast.

## 1) Autentikasi

Semua endpoint wajib header:

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

Token dibuat dari user PortalSifast. Hak akses mengikuti user:

- `can_view_mutu_dashboard` atau akses superadmin/admin: dapat melihat data.
- `can_input_mutu`: dapat input realisasi.
- Untuk user non-manage, `dep_id` otomatis mengikuti departemen user login.

## 2) Endpoint

### 2.1 Master Indikator Aktif

- **Method:** `GET`
- **URL:** `/api/sifast/simmutu/indicators`
- **Query opsional:**  
  - `mutu_category_id` (integer)  
  - `dep_id` (string, hanya efektif untuk user pengelola mutu)

Contoh:

```bash
curl -X GET "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/indicators" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "title": "Kepatuhan Hand Hygiene",
      "description": "Monitoring kepatuhan cuci tangan",
      "category": {
        "id": 3,
        "name": "Sasaran Mutu Unit"
      },
      "collection_frequency": "harian",
      "analysis_period": "bulanan",
      "has_mutu_benchmarking": true,
      "numerator_definition": "Jumlah petugas patuh",
      "denominator_definition": "Jumlah petugas diamati",
      "target_value": 85,
      "unit_terkait": ["IGD", "RAWATJALAN"]
    }
  ]
}
```

### 2.2 List Realisasi

- **Method:** `GET`
- **URL:** `/api/sifast/simmutu/realisations`
- **Query opsional:**
  - `month` format `YYYY-MM`
  - `dep_id`
  - `mutu_indicator_id`
  - `per_page` (default 20, max 100)

Contoh:

```bash
curl -X GET "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/realisations?month=2026-04&per_page=20" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

Response `200` menggunakan pagination Laravel (field: `data`, `current_page`, `last_page`, dst).

### 2.3 Input Realisasi Baru

- **Method:** `POST`
- **URL:** `/api/sifast/simmutu/realisations`

Body JSON:

```json
{
  "mutu_indicator_id": 12,
  "period_date": "2026-04-24",
  "numerator_value": 42,
  "denominator_value": 50,
  "dep_id": "IGD",
  "notes": "Input dari aplikasi mobile"
}
```

Catatan penting:

- `period_date` dipakai untuk generate `period_anchor` otomatis oleh backend:
  - harian -> `D:YYYY-MM-DD`
  - mingguan -> `W:YYYY-Www`
  - bulanan -> `M:YYYY-MM`
  - tahunan -> `Y:YYYY`
- Untuk user non-pengelola (`can_manage_mutu = false`), nilai `dep_id` dari body akan diabaikan dan sistem memakai `dep_id` user login.
- `dep_id` harus termasuk daftar `unit_terkait` pada indikator.

Contoh curl:

```bash
curl -X POST "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/realisations" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "mutu_indicator_id": 12,
    "period_date": "2026-04-24",
    "numerator_value": 42,
    "denominator_value": 50,
    "notes": "Input dari frontend eksternal"
  }'
```

Response sukses `201`:

```json
{
  "success": true,
  "message": "Realisasi mutu berhasil disimpan.",
  "data": {
    "id": 889,
    "mutu_indicator_id": 12,
    "dep_id": "IGD",
    "period_anchor": "D:2026-04-24",
    "achievement_percent": 84
  }
}
```

Response validasi `422`:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "period_date": ["Tanggal periode wajib diisi."]
  }
}
```

### 2.4 Get Daily Rows (untuk Kalender)

- **Method:** `GET`
- **URL:** `/api/sifast/simmutu/realisations/daily-rows`
- **Query wajib:** `month` format `YYYY-MM`
- **Query opsional:**
  - `dep_id` (string)
  - `mutu_indicator_id` (integer)

Contoh:

```bash
curl -X GET "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/realisations/daily-rows?month=2026-05" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "mutu_indicator_id": 12,
      "dep_id": "IGD",
      "date": "2026-05-01",
      "day": 1,
      "achievement_percent": 84.50
    },
    {
      "mutu_indicator_id": 12,
      "dep_id": "IGD",
      "date": "2026-05-02",
      "day": 2,
      "achievement_percent": null
    }
  ]
}
```

### 2.5 Get Stats (Statistik)

- **Method:** `GET`
- **URL:** `/api/sifast/simmutu/realisations/stats`
- **Query opsional:** `month` format `YYYY-MM`

Contoh:

```bash
curl -X GET "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/realisations/stats?month=2026-05" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "total_entries": 156,
    "avg_achievement_percent": 87.5,
    "unique_indicator_count": 12
  }
}
```

### 2.6 Detail Realisasi

- **Method:** `GET`
- **URL:** `/api/sifast/simmutu/realisations/{id}`

Contoh:

```bash
curl -X GET "https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/simmutu/realisations/889" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": 889,
    "mutu_indicator_id": 12,
    "indicator": {
      "id": 12,
      "title": "Kepatuhan Hand Hygiene",
      "category": "Sasaran Mutu Unit",
      "numerator_definition": "Jumlah petugas patuh",
      "denominator_definition": "Jumlah petugas diamati"
    },
    "dep_id": "IGD",
    "period_anchor": "D:2026-04-24",
    "numerator_value": 42,
    "denominator_value": 50,
    "achievement_percent": 84,
    "notes": "Input dari aplikasi mobile",
    "input_by": 5,
    "input_by_name": "dr. Budi Santoso",
    "created_at": "2026-04-24T10:30:00+07:00",
    "can_edit": true
  }
}
```

### 2.7 Update Realisasi

- **Method:** `PATCH`
- **URL:** `/api/sifast/simmutu/realisations/{id}`

Body JSON:

```json
{
  "numerator_value": 45,
  "denominator_value": 50,
  "notes": "Update data realisation"
}
```

Response sukses `200`:

```json
{
  "success": true,
  "message": "Realisasi mutu berhasil diperbarui.",
  "data": {
    "id": 889,
    "numerator_value": 45,
    "denominator_value": 50,
    "achievement_percent": 90,
    "notes": "Update data realisation"
  }
}
```

### 2.8 Hapus Realisasi

- **Method:** `DELETE`
- **URL:** `/api/sifast/simmutu/realisations/{id}`

Response sukses `200`:

```json
{
  "success": true,
  "message": "Realisasi mutu berhasil dihapus."
}
```

## 3) Ringkasan Field

- `mutu_indicator_id` -> id indikator aktif
- `period_date` -> tanggal acuan input (wajib format tanggal)
- `numerator_value` -> nilai numerator (angka >= 0)
- `denominator_value` -> nilai denominator (angka >= 0)
- `dep_id` -> kode departemen (wajib untuk pengelola bila user tidak punya dep bawaan)
- `notes` -> catatan tambahan (opsional)

## 4) Error Umum

- `401 Unauthorized` -> token tidak valid / tidak dikirim
- `403 Forbidden` -> user tidak punya hak akses SIMMUTU
- `422 Unprocessable Entity` -> validasi gagal (format field/dep tidak valid)
