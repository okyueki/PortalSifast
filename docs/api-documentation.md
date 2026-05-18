# 📋 Dokumentasi API Backend - PortalSifast

**Versi:** 2.0  
**Base URL:** `https://portalsifast.rsaisyiyahsitifatimah.com/api`  
**Format:** JSON  
**Auth:** Bearer Token (Laravel Sanctum)

**Update Terakhir:** Maret 2026

**Standar integrasi & sinkronisasi dokumen:** [STANDARD-API-INTEGRASI-KEPEGAWAIAN.md](./STANDARD-API-INTEGRASI-KEPEGAWAIAN.md) (token service, NIK, checklist saat menambah endpoint).

---

## 🔐 Autentikasi

Semua endpoint (kecuali login) memerlukan header:
```
Authorization: Bearer {token}
```

### Login (email + password) — PortalSifast API

**POST** `/api/login`

Request body: `{ "email": "...", "password": "..." }`

Response sukses mengembalikan `token` dan objek `user` yang **termasuk `simrs_nik` dan `phone`**:
```json
{
  "success": true,
  "data": {
    "token": "1|...",
    "user": {
      "id": 1,
      "name": "Nama User",
      "email": "user@example.com",
      "simrs_nik": "123456789",
      "phone": "08123456789",
      "role": "pemohon",
      "dep_id": "IT"
    }
  }
}
```

### Current User (user yang sudah login)

**GET** `/api/user` (tanpa query parameter)

Header: `Authorization: Bearer {token}`

Mengembalikan user yang sedang login (dari token), **termasuk `simrs_nik`**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nama User",
    "email": "user@example.com",
    "simrs_nik": "123456789",
    "phone": "08123456789",
    "dep_id": "IT",
    "role": "pemohon"
  }
}
```

**GET** `/api/user?nik=xxx` — lookup user by NIK (untuk integrasi kepegawaian; perilaku tetap seperti sebelumnya).

**Integrasi app kepegawaian (token env + NIK):** pola resmi dijelaskan di **[API-TICKETING.md](./API-TICKETING.md)**. Payroll memakai **aturan NIK yang sama** dengan tiket (`?nik=` + Bearer token).

### CORS

Jika frontend di domain lain memanggil API ini, set di `.env`:
```
CORS_ALLOWED_ORIGINS=https://frontend-domain.com,https://app.example.com
```
Lalu jalankan: `php artisan config:clear`

---

## 📡 Endpoints

---

## 💰 Payroll / Slip Gaji

Modul payroll untuk pegawai melihat data gaji. **Cara integrasi NIK disamakan dengan tiket** — lihat **[API-TICKETING.md](./API-TICKETING.md)** (bagian *”Login” dan Get Nama User*).

### Status Publish

Data payroll harus di-approve oleh staff payroll terlebih dahulu sebelum bisa diakses via API.

| Status | Arti |
|--------|------|
| `draft` | Baru diimport, BELUM bisa diakses via API |
| `published` | Sudah diapprove, BISA diakses via API |

Staff payroll bisa approve via halaman `/payroll/import-history`.

### Satu cara yang disarankan (sama seperti tiket)

| Yang dipakai | Sumber |
|--------------|--------|
| **Bearer token** | Satu token service dari env (`VITE_PORTALSIFAST_API_TOKEN`), dibuat sekali di PortalSifast |
| **NIK** | Nilai yang **sama** dipakai untuk tiket: dari session login kepegawaian Anda, atau dari `GET /api/sifast/user?nik=...` |

**Aturan praktis:** setiap panggilan payroll dari app kepegawaian **selalu** sertakan **`nik`** (query), kecuali Anda sengaja pakai skenario lanjutan di bagian bawah.

```
GET /api/sifast/payroll?nik={nik}&page=1&per_page=12
Authorization: Bearer {token_service}
```

Contoh urutan di frontend (sama pola dengan tiket):

1. Pegawai sudah login di app kepegawaian → Anda punya variabel `nik` (satu sumber kebenaran).
2. (Opsional) `GET /api/sifast/user?nik=...` untuk nama/email di UI.
3. `GET /api/sifast/payroll?nik=...&page=...` untuk daftar gaji.

Tanpa `nik` di URL, token service **tidak** tahu pegawai mana → **422**. Itu bukan CORS; tambahkan `nik`.

**Alternatif query/header** (setara `nik`): `?simrs_nik=...`, atau header `X-Sifast-Nik` / `X-Nik` jika tidak ingin NIK di URL.

### Nilai Total dari CSV (Priority)

Display slip gaji mengambil **nilai total langsung dari CSV** (bukan dihitung ulang dari komponen):

| Field | Sumber | Contoh |
|-------|--------|--------|
| `jumlah_tunjangan` | Kolom `Jumlah_Tunjangan` di CSV | `5399007` |
| `jumlah` | Kolom `Jumlah` di CSV | `9308310` |
| `jumlah_pot` | Kolom `Jumlah_Pot` di CSV | `2152714` |
| `gaji_bersih` | Kolom `Pembulatan` di CSV | `7155596` |

Ini penting karena ada kalanya `jumlah_tunjangan` di CSV **tidak sama** dengan penjumlahan komponen (ada item lain yang tidak di-breakdown).

### Struktur Komponen CSV

#### Kolom Pendapatan
| Key (raw_row) | Label di Slip | Contoh |
|---------------|--------------|--------|
| `gaji_pokok` | Gaji Pokok | `4291650` |
| `keluarga` | Tunj. Keluarga | `858330` |
| `fungsional` | Tunj. Fungsional | `100000` |
| `struktural` | Tunj. Struktural | `750000` |
| `operasional` | Tunj. Operasional | `1000000` |
| `tunj_bpjs_tk` | BPJS Ketenagakerjaan | `382347` |
| `bpjs_kes` | BPJS Kesehatan | `259756` |
| `transport_spj` | Transport/SPJ | `525000` |
| `jm_dokter` | Jasa Medis Dokter | `0` |
| `lain_lain` | Lain-lain | `0` |
| `lembur` | Lembur | `332300` |
| `on_call` | On Call / Asisten | `0` |
| `jkn` | Remunerasi JKN | `518593` |
| `umum` | Remunerasi Umum | `250459` |
| `jkn_susulan` | Remunerasi JKN Susulan | `26940` |
| `jkn_susulan_l` | Remunerasi JKN Susulan L | `12935` |

#### Kolom Potongan
| Key (raw_row) | Label di Slip | Contoh |
|---------------|--------------|--------|
| `pot_bpjs_tk` | BPJS Ketenagakerjaan | `382347` |
| `bpjs_kes_k` | BPJS Kesehatan | `259756` |
| `jht_i` | Jaminan Hari Tua | `122547` |
| `jp_i` | Jaminan Pensiun | `61274` |
| `bpjs_kes_i` | BPJS Kesehatan | `64939` |
| `bpjs_kes_tidak_ditanggung` | BPJS Kes tdk di tgg | `0` |
| `matan` | Matan | `15000` |
| `lazismu` | Lazismu | `15000` |
| `obat2an` | Obat/Jasmed/Tindakan | `0` |
| `hutang_bpjs` | Hutang BPJS | `0` |
| `hutang_seragam` | Hutang Seragam | `0` |
| `ikkm` | IKKM | `50000` |
| `lain_pot` | Lain-lain | `0` |
| `pajak` | Pajak (PPh 21) | `1181851` |
| `zakat` | Zakat | `0` |

#### Total dari CSV
| Key (raw_row) | Label di Slip | Contoh |
|---------------|--------------|--------|
| `jumlah_tunjangan` | Jumlah Tunjangan | `5399007` |
| `jumlah` | Jumlah Gaji | `9308310` |
| `jumlah_pot` | Jumlah Potongan | `2152714` |
| `pembulatan` | Gaji Bersih | `7155596` |

---

### A. List Gaji (Pagination)

**GET** `/api/sifast/payroll`

#### Query Parameters
| Parameter | Tipe | Wajib (integrasi app) | Contoh | Keterangan |
|---|---|---|---|---|
| `nik` | string | **Ya** (token service) | `03.09.07.1998` | Sama makna dengan tiket: NIK pegawai yang sedang aktif di app |
| `period` | string | Tidak | `2026-02` | Filter periode **YYYY-MM** |
| `page` | int | Tidak | `1` | Halaman |
| `per_page` | int | Tidak | `12` | Default 12, maks 100 |

#### Contoh cURL (disarankan — sama pola tiket)
```bash
curl -G “https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/payroll” \
  --data-urlencode “nik=03.09.07.1998” \
  --data-urlencode “page=1” \
  --data-urlencode “per_page=12” \
  -H “Authorization: Bearer {token_service}” \
  -H “Accept: application/json”
```

#### Skenario lanjutan (bukan wajib untuk app kepegawaian)

| Skenario | Perilaku |
|----------|----------|
| Token hasil **`POST /api/login`** dan user di DB sudah punya **`simrs_nik`** | Boleh **tanpa** `?nik` — backend pakai NIK dari profil token. |
| User belum punya `simrs_nik` di DB | Backend **bisa** mengisi otomatis dari email SIMRS (`petugas`/`dokter`) saat login / `/user` / payroll — tetap disarankan app **tetap kirim `?nik`** agar konsisten dengan tiket. |
| Data belum di-publish | Response **403** - “Data payroll ini belum dipublish dan belum bisa diakses.” |

---

#### Response `200 OK` (pagination Laravel)
Struktur mengikuti `LengthAwarePaginator` (field `data`, `links`, `current_page`, `per_page`, `total`, dll. di root JSON).

```json
{
  “current_page”: 1,
  “data”: [
    {
      “id”: 78,
      “period_start”: “2026-02-01”,
      “period_label”: “Februari 2026”,
      “simrs_nik”: “26.01.03.2009”,
      “employee_name”: “apt.Rika Rosalia S.Farm,M.Farm”,
      “unit”: “FARM”,
      “npwp”: null,
      “phone”: null,
      “ref_no”: 9,
      “salary_no”: 9,
      “penerimaan”: “7155596.00”,
      “pembulatan”: “7155596.00”,
      “pajak”: “1181851.00”,
      “zakat”: null,
      “gaji_bersih”: 7155596,
      “status”: “published”
    }
  ],
  “first_page_url”: “...”,
  “last_page”: 1,
  “links”: [],
  “next_page_url”: null,
  “path”: “...”,
  “per_page”: 15,
  “prev_page_url”: null,
  “to”: 1,
  “total”: 1
}
```

#### Response `403 Forbidden` (belum di-publish)
```json
{
  “message”: “Data payroll ini belum dipublish dan belum bisa diakses.”
}
```
Solusi: Approve import di `/payroll/import-history` melalui staff payroll.

#### Response `422` (lupa `nik` dengan token service)
```json
{
  “message”: “Parameter nik wajib diisi atau akun Anda belum terhubung dengan NIK kepegawaian.”,
  “hint”: “Sama seperti tiket: kirim ?nik= (atau header X-Sifast-Nik) dengan NIK dari session kepegawaian.”,
  “example_query”: “/api/sifast/payroll?nik=03.09.07.1998&page=1&per_page=12”
}
```

Perbaikan: tambahkan **`?nik=`** seperti di [API-TICKETING.md](./API-TICKETING.md).

**React Query:** `queryKey` wajib ikut `nik` (sama seperti tiket ikut NIK) supaya cache antar pegawai tidak tertukar.

---

### B. Detail Gaji

**GET** `/api/sifast/payroll/{id}`

Menampilkan detail lengkap slip gaji termasuk komponen pendapatan dan potongan.

#### Akses
| Role | Akses |
|---|---|
| Pegawai (punya `simrs_nik`) | Hanya bisa akses gaji milik sendiri |
| Admin / Staff | Bisa akses semua gaji |
| Service Account | Bisa akses semua gaji |

#### Contoh cURL
```bash
curl -X GET “https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/payroll/78” \
  -H “Authorization: Bearer {token}” \
  -H “Accept: application/json”
```

#### Response `200 OK`
```json
{
  “data”: {
    “id”: 78,
    “period_start”: “2026-02-01”,
    “period_label”: “Februari 2026”,
    “simrs_nik”: “26.01.03.2009”,
    “employee_name”: “apt.Rika Rosalia S.Farm,M.Farm”,
    “unit”: “FARM”,
    “npwp”: null,
    “phone”: null,
    “ref_no”: 9,
    “salary_no”: 9,
    “penerimaan”: “7155596.00”,
    “pembulatan”: “7155596.00”,
    “pajak”: “1181851.00”,
    “zakat”: null,
    “gaji_bersih”: 7155596,
    “terbilang”: “Tujuh Juta Seratus Lima Puluh Lima Ribu Lima Ratus Sembilan Puluh Enam Rupiah”,
    “masa_kerja”: {
      “years”: 16,
      “months”: 7,
      “days”: 0
    },
    “status”: “published”,
    “published_at”: “2026-05-16T10:30:00Z”,
    “published_by”: 1,
    // Komponen Pendapatan
    “gaji_pokok”: “4291650.00”,
    “keluarga”: “858330.00”,
    “fungsional”: “100000.00”,
    “struktural”: “750000.00”,
    “operasional”: “1000000.00”,
    “tunj_bpjs_tk”: “382347.00”,
    “bpjs_kes”: “259756.00”,
    “transport_spj”: “525000.00”,
    “jm_dokter”: “0.00”,
    “lain_lain”: “0.00”,
    “lembur”: “332300.00”,
    “on_call”: “0.00”,
    “jkn”: “518593.00”,
    “umum”: “250459.00”,
    “jkn_susulan”: “26940.00”,
    “jkn_susulan_l”: “12935.00”,
    // Komponen Potongan
    “pot_bpjs_tk”: “382347.00”,
    “bpjs_kes_k”: “259756.00”,
    “jht_i”: “122547.00”,
    “jp_i”: “61274.00”,
    “bpjs_kes_i”: “64939.00”,
    “bpjs_kes_tidak_ditanggung”: “0.00”,
    “matan”: “15000.00”,
    “lazismu”: “15000.00”,
    “obat2an”: “0.00”,
    “hutang_bpjs”: “0.00”,
    “hutang_seragam”: “0.00”,
    “ikkm”: “50000.00”,
    “lain_pot”: “0.00”,
    // Total dari CSV
    “jumlah_tunjangan”: “5399007.00”,
    “jumlah”: “9308310.00”,
    “jumlah_pot”: “2152714.00”,
    // Raw data (semua kolom CSV asli)
    “raw_row”: {
      “no_ref”: “9”,
      “no_gaji”: “9”,
      “nama”: “apt.Rika Rosalia S.Farm,M.Farm”,
      “nik”: “26.01.03.2009”,
      “gaji_pokok”: “4.291.650”,
      “keluarga”: “ 858.330 “,
      “jkk”: “ 14.706 “,
      “jkm”: “ 18.382 “,
      “jht”: “ 226.712 “,
      “jp”: “ 122.547 “,
      “tunj_bpjs_tk”: “ 382.347 “,
      “bpjs_kes”: “ 259.756 “,
      “lembur”: “ 332.300 “,
      “jkn_februari_2026”: “ 518.593 “,
      “umum_maret_2026”: “ 250.459 “,
      “pajak”: “1.181.851”,
      “jumlah_tunjangan”: “ 5.399.007 “,
      “jumlah”: “ 9.308.310 “,
      “jumlah_pot”: “ 2.152.714 “,
      “penerimaan”: “Rp7.155.596”,
      “pembulatan”: “Rp7.155.596”
    }
  }
}
```

#### Catatan Penting untuk Frontend

1. **Gunakan kolom langsung**, bukan hitung ulang dari komponen
2. **Jumlah Tunjangan**: pakai `jumlah_tunjangan`, bukan jumlah komponen
3. **Jumlah Gaji**: pakai `jumlah`, bukan penjumlahan manual
4. **Jumlah Potongan**: pakai `jumlah_pot`
5. **Gaji Bersih**: pakai `pembulatan` atau `gaji_bersih`
6. **Terbilang**: dari field `terbilang` (sudah di-generate backend)

#### Response Error `403 Forbidden` (belum publish)
```json
{
  “message”: “Data payroll ini belum dipublish dan belum bisa diakses.”
}
```

#### Response Error `422 Unprocessable Entity`
```json
{
  “message”: “Akun Anda belum terhubung dengan NIK kepegawaian.”
}
```

---

### C. Import Gaji via API (Admin/Staff Only)

**POST** `/api/sifast/payroll/import`

Endpoint untuk import data gaji dari file CSV. Hanya dapat diakses oleh user dengan role `admin` atau staff dengan `can_access_payroll = true`.

**Import menggunakan status `draft`** - data belum bisa diakses via API sampai di-approve.

#### Request Headers
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

#### Request Body (multipart/form-data)
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `period` | string | Ya | Format **YYYY-MM** (contoh: `2026-02`) |
| `file` | file | Ya | File CSV, max 10MB |

#### Contoh cURL
```bash
curl -X POST “https://portalsifast.rsaisyiyahsitifatimah.com/api/sifast/payroll/import” \
  -H “Authorization: Bearer {token}” \
  -F “period=2026-02” \
  -F “file=@/path/to/gaji.csv”
```

#### Response `200 OK`
```json
{
  “success”: true,
  “message”: “Import gaji berhasil. Imported: 150, Skipped: 2.”,
  “data”: {
    “imported”: 150,
    “skipped”: 2,
    “total_rows”: 152,
    “warnings”: [
      {
        “nik”: “01.02.03.2000”,
        “nama”: “John Doe”,
        “issues”: [“Penerimaan bernilai 0”]
      }
    ],
    “import_id”: 5
  }
}
```

#### Validation Rules (Automatic Warning Detection)
| Kondisi | Warning |
|---|---|
| `employee_name` kosong | “Nama pegawai kosong” |
| `penerimaan` = 0 | “Penerimaan bernilai 0” |
| `penerimaan` < 30% rata-rata | “Penerimaan di bawah rata-rata (outlier rendah)” |
| `penerimaan` > 250% rata-rata | “Penerimaan di atas rata-rata (outlier tinggi)” |
| `pajak` > 50% penerimaan | “Pajak melebihi 50% dari penerimaan” |

#### Response Error `403 Forbidden`
```json
{
  “message”: “Hanya admin dan staff yang dapat mengimpor gaji.”
}
```

---

### D. Format CSV untuk Import

#### Header CSV yang Didukung
```csv
No. Ref;No. Gaji;Nama;NIK;Gaji Pokok;Keluarga;Fungsional;Struktural;Operasional;JKK;JKM;JHT;JP;TUNJ_BPJS_TK;BPJS KES;Transt/SPJ/Komunikasi;JM Dokter;Lain2/Bonus;Lembur;On Call;JKN Februari 2026;Umum Maret 2026;JKN Susulan;JKN Susulan_L;Jumlah;Jumlah_Tunjangan;Zakat;Pajak;JKK_K;JKM_K;JHT_K;JP_K;POT_BPJS_TK;BPJS_KES_K;JHT_I;JP_I;BPJS_Kes_I;BPJS_Kes_tdk_di_tgg;Matan;Lazismu;Obat2an/R;Hutang BPJS;Hutang Seragam;IKKM;Lain - lain;Jumlah_Pot;Penerimaan;Pembulatan
```

#### Contoh Data
```csv
9;9;apt.Rika Rosalia S.Farm,M.Farm;26.01.03.2009;4.291.650;858.330;100.000;750.000;1.000.000;14.706;18.382;226.712;122.547;382.347;259.756;525.000;0;0;332.300;-;518.593;250.459;26.940;12.935;9.308.310;5.399.007;-;1.181.851;14.706;18.382;226.712;122.547;382.347;259.756;122.547;61.274;64.939;-;15.000;15.000;-;-;-;50.000;-;2.152.714;Rp7.155.596;Rp7.155.596
```

#### Catatan Format
- **Delimiter**: Otomatis mendeteksi `;` (semi-colon)
- **Encoding**: UTF-8 (perangana BOM otomatis dihapus)
- **Angka**: Format Indonesia (`1.234.567`) atau `Rp1.234.567`
- **Header**: Case-insensitive, spasi dikonversi ke underscore
- **Kolom Opsional**: NIK kosong akan di-skip

---

## 🔐 Fitur Web Management (Non-API)

Fitur berikut hanya tersedia melalui web interface (`/payroll/*`), bukan API:

| Fitur | URL | Keterangan |
|---|---|---|
| Dashboard Analytics | `/payroll/dashboard` | Chart tren gaji, distribusi unit, YoY growth |
| Import History | `/payroll/import-history` | Riwayat import dengan rollback |
| Approval Workflow | `/payroll/import-history` | Approve/reject import payroll |
| Audit Log | `/payroll/audit-logs` | Track semua perubahan |
| Email Slip Gaji | Via UI | Kirim slip ke email individual/bulk |
| Export CSV | `/payroll?export=csv` | Download data sesuai filter |

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

### Payroll Tables

```php
// employee_salaries — data gaji karyawan
Schema::create('employee_salaries', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('import_id')->nullable()->constrained('payroll_imports')->nullOnDelete();
    $table->date('period_start');
    $table->string('simrs_nik');
    $table->string('employee_name')->nullable();
    $table->string('unit')->nullable();
    $table->string('npwp')->nullable();
    $table->decimal('penerimaan', 20, 2)->nullable();
    $table->decimal('pembulatan', 20, 2)->nullable();
    $table->decimal('pajak', 20, 2)->nullable();
    $table->decimal('zakat', 20, 2)->nullable();
    $table->json('raw_row')->nullable(); // Semua kolom CSV asli
    $table->timestamps();

    $table->unique(['period_start', 'simrs_nik']);
    $table->index('simrs_nik');
});

// payroll_imports — riwayat import dengan approval
Schema::create('payroll_imports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
    $table->date('period_start');
    $table->string('filename')->nullable();
    $table->integer('total_rows')->default(0);
    $table->integer('imported_count')->default(0);
    $table->integer('skipped_count')->default(0);
    $table->integer('warning_count')->default(0);
    $table->enum('status', ['completed', 'rolled_back'])->default('completed');
    $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('approved_at')->nullable();
    $table->text('approval_notes')->nullable();
    $table->timestamp('rolled_back_at')->nullable();
    $table->foreignId('rolled_back_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});

// payroll_audit_logs — audit trail
Schema::create('payroll_audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action'); // imported, deleted, approved, rejected, rolled_back, email_sent
    $table->string('model_type')->nullable();
    $table->unsignedBigInteger('model_id')->nullable();
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->text('description')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamps();
    
    $table->index(['model_type', 'model_id']);
    $table->index('action');
});
```

### Emergency Tables

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

1. **Authentication**: Gunakan Laravel Sanctum untuk token-based auth.
2. **Report ID**: Generate format `RPT-{YEAR}-{5-digit-sequence}` menggunakan observer atau mutator.
3. **Geofencing** (opsional): Tentukan radius area operator menggunakan PostGIS atau Haversine formula.
4. **WhatsApp Integration**: Tambahkan WhatsApp Business API sebagai kanal notifikasi tambahan selain push notification.
5. **Audit Log**: Setiap perubahan status laporan harus tercatat di tabel `payroll_audit_logs`.
6. **Queue**: Gunakan Laravel Queue (Redis) untuk mengirim notifikasi/email agar tidak memblokir response API.
7. **Payroll Import**: Service `EmployeeSalaryImportService` menangani parsing CSV dengan auto-detect delimiter.
8. **Approval Workflow**: Setiap import payroll harus di-approve admin sebelum bisa di-rollback.

---

## 📜 Changelog

### v2.0 (Maret 2026)
**Payroll Module - Advanced Features**
- ✅ **Dashboard Analytics**: Chart tren gaji 12 bulan, distribusi per unit (PieChart), YoY growth, top earners
- ✅ **Email Slip Gaji**: Kirim slip via email (individual & bulk) dengan queue job
- ✅ **Approval Workflow**: Import payroll memerlukan approval admin sebelum final
- ✅ **Audit Log**: Track semua aktivitas (import, delete, approve, reject, rollback, email)
- ✅ **Import History**: Riwayat import dengan opsi rollback
- ✅ **Validation Rules**: Deteksi anomali saat import (nama kosong, penerimaan 0, outlier, pajak tinggi)
- ✅ **Multi-Period View**: Histori gaji pegawai dengan statistik dan trend chart
- ✅ **Comparison**: Perbandingan total vs periode sebelumnya
- ✅ **Bulk Operations**: Bulk delete dan bulk email
- ✅ **Export CSV**: Download data payroll sesuai filter
- ✅ **Keyboard Shortcuts**: `/` untuk fokus search, `Esc` untuk reset filter

**API Updates**
- ✅ Dokumentasi endpoint `/api/sifast/payroll/import` untuk import via API
- ✅ Response payroll dengan field tambahan (`period_label`, `gaji_bersih`, `terbilang`, `masa_kerja`)
- ✅ Validation warnings pada import response

### v1.0 (Februari 2026)
- Initial release dengan fitur Panic Button / Emergency Report
- Basic Payroll API (list & detail gaji sendiri)
- FCM Push Notification integration
- WebSocket via Laravel Reverb
