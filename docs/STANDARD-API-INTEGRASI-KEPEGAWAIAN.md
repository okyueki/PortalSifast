# Standar integrasi API — PortalSifast ↔ aplikasi kepegawaian

**Tujuan:** Satu kontrak yang jelas untuk auth, identitas pegawai (NIK), dan dokumentasi — agar fitur baru tidak mengulangi inkonsistensi (misalnya modul terdokumentasi di satu file saja atau pola NIK beda antar modul).

**Pemilik:** tim backend + siapa pun yang menambah endpoint `/api` atau `/api/sifast/*` untuk konsumsi app kepegawaian.

---

## 1. Aturan emas (wajib diingat)

### 1.1 Token service tidak membawa identitas pegawai

- Token yang dibuat dengan `php artisan api:token:generate …` (atau setara) **tidak** “tahu” pegawai mana yang sedang aktif di app kepegawaian.
- Setiap endpoint yang **membatasi data per pegawai** (tiket milik NIK, payroll milik NIK, daftar emergency milik NIK, dll.) **wajib** menerima identitas eksplisit dari client, kecuali desainnya memang hanya untuk token hasil **login user** (Bearer dari `POST /api/login`) yang sudah punya `simrs_nik` di DB.

**Kesalahan yang harus dihindari:** mendokumentasikan atau mengimplementasikan “cukup Bearer saja” untuk token service tanpa menyebut **wajib** `nik` / setara.

### 1.2 Satu variabel NIK di app kepegawaian

- Di sisi app kepegawaian, pegunakan **satu sumber kebenaran** NIK (misalnya dari session login SIMRS / kepegawaian).
- NIK **yang sama** dipakai untuk: lookup user (`/api/sifast/user?nik=`), tiket, payroll, emergency (sesuai kontrak masing-masing body/query), selama backend memetakan ke `User.simrs_nik` / `Pegawai.nik` dengan aturan yang sama.

### 1.3 Cara kirim NIK yang setara (backend sudah mendukung)

Selain `?nik=`, backend payroll (dan pola serupa jika diterapkan di modul lain) mengenali setara berikut — **dokumentasi modul baru harus menyebutkan setara ini jika didukung:**

| Cara | Contoh |
|------|--------|
| Query | `?nik=...` atau `?simrs_nik=...` |
| Header | `X-Sifast-Nik` atau `X-Nik` |

Ini membantu client yang tidak ingin NIK tercatat di URL log proxy.

### 1.4 Format response API

- Ikuti envelope yang sudah dipakai proyek: `success`, `data`, `message`, `errors` (dan pagination Laravel untuk resource yang memakai `paginate()`), kecuali ada alasan kuat untuk modul terpisah — jika ya, dokumentasikan pengecualian di **ketiga** jalur dokumen (lihat §2).

---

## 2. Hierarki dokumen — mana yang di-update

| Dokumen | Peran | Kapan diubah |
|---------|--------|----------------|
| **[STANDARD-API-INTEGRASI-KEPEGAWAIAN.md](./STANDARD-API-INTEGRASI-KEPEGAWAIAN.md)** (berkas ini) | Kontrak proses & anti-pola | Hanya jika aturan emas atau proses review berubah |
| **[API-TICKETING.md](./API-TICKETING.md)** | Pola **auth + NIK + tiket**; referensi utama integrasi; bagian **Payroll** sebagai pintu masuk pola NIK | Setiap perubahan perilaku tiket/user-by-NIK/pola payroll entry |
| **[api-documentation.md](./api-documentation.md)** | Detail **field**, contoh JSON, payroll import, skenario lanjutan (login token vs service token) | Setiap perubahan request/response yang dilihat consumer |
| **[api-sifast.md](./api-sifast.md)** | **Indeks** endpoint (tiket, payroll, emergency, officer, …) + ringkasan sinkronisasi | Setiap endpoint baru di bawah `/api/sifast/` atau yang masuk “peta” integrasi frontend |

**Kesalahan yang harus dihindari:** mengupdate hanya `api-documentation.md` tanpa menyesuaikan `API-TICKETING.md` (pola NIK) dan `api-sifast.md` (tabel ringkas + § ringkasan), atau sebaliknya.

---

## 3. Checklist — fitur / endpoint baru untuk app kepegawaian

Gunakan sebelum merge atau saat rilis:

1. **Kode**
   - [ ] Auth: `auth:sanctum` (atau pola yang disepakati) jelas.
   - [ ] Jika pakai **token service**: validasi eksplisit — tanpa NIK/setara → **422** dengan pesan yang mengarahkan ke `?nik=` atau header (konsisten dengan modul payroll).
   - [ ] Pengujian: minimal satu tes “token service + tanpa NIK → gagal” dan “token service + NIK → sukses” bila relevan.

2. **Dokumentasi**
   - [ ] **API-TICKETING.md**: jika modul memakai pola yang sama dengan tiket/payroll, tambahkan paragraf atau baris di tabel ringkas; sebut **satu variabel NIK** dengan tiket bila applicable.
   - [ ] **api-documentation.md**: parameter, contoh `curl`, error umum.
   - [ ] **api-sifast.md**: baris di tabel endpoint §2; jika perlu, baris/kolom di § ringkasan sinkronisasi.

3. **Konsistensi istilah**
   - [ ] Tidak menulis “wajib login PortalSifast” sebagai **satu-satunya** jalur jika modul resmi untuk integrasi **token service + NIK** (jelaskan jalur utama vs skenario lanjutan).
   - [ ] Base URL: sebut `/api` dan `/api/sifast/...` konsisten dengan `routes/api.php`.

---

## 4. Anti-pola (jangan diulang)

| Anti-pola | Akibat | Yang benar |
|-----------|--------|------------|
| Dokumentasi payroll hanya di satu berkas | Developer tiket vs payroll dapat aturan NIK beda | Update **tiga** dokumen di §2 sesuai peran masing-masing |
| Menyebut integrasi app kepegawaian tanpa `nik` untuk token service | 422 di produksi, dianggap bug CORS atau server | Tekankan: **token service + identitas pegawai eksplisit** |
| Tabel ringkas hanya tiket + emergency | Payroll “hilang” dari peta integrasi | Selalu tambahkan baris di `api-sifast.md` dan referensi silang |
| Header alternatif NIK didukung kode tapi tidak tertulis | Client tidak tahu opsi privasi URL | Sebut `X-Sifast-Nik` / `X-Nik` / `simrs_nik` di dokumen modul |

---

## 5. Rujukan cepat — file kode yang sering jadi contoh

- Resolusi NIK untuk payroll: `App\Http\Controllers\Api\EmployeeSalaryController` (query + header).
- **Gaji bersih / slip:** `App\Support\PayrollSlipMath` — harus selaras dengan `resources/js/pages/payroll/print.tsx` dan key komponen di `payroll-components.ts` (lihat juga `api-documentation.md` bagian *Perhitungan gaji_bersih*).
- Tiket by NIK: `App\Http\Controllers\Api\ApiTicketController`.
- Rute grup integrasi: `routes/api.php` (prefix `sifast`).
- Tes pola token service + header NIK: `tests/Feature/Api/EmployeeSalaryApiTest.php`.

---

## 6. Revisi standar ini

Ubah berkas ini hika:

- ada **aturan baru** yang mempengaruhi semua modul integrasi (misalnya header standar baru), atau
- **proses dokumentasi** berubah (misalnya dokumen tambahan wajib).

Cantumkan tanggal singkat di commit message atau di bagian bawah jika tim ingin versioning manual.

*Terakhir diselaraskan: Maret 2026.*
