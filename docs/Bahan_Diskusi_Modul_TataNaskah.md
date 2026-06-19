# Bahan Diskusi & Referensi Teknis — Modul Tata Naskah
**Modul Tata Naskah — Portal SIFAST**
**RSU 'Aisyiyah Siti Fatimah Tulangan**

> Dokumen ini adalah **bahan diskusi dan referensi teknis** untuk pembangunan Modul Tata Naskah. Dibuat berdasarkan tiga sumber: (1) Lampiran Pedoman Tata Naskah RS'ASF 2026 (dokumen asli), (2) Bahan Diskusi Tim Internal, dan (3) Analisis teknis. Keputusan desain yang sudah disepakati tercatat di §12; yang belum final di §13.

---

## Daftar Isi

1. [Ruang Lingkup & Batas Sistem](#1-ruang-lingkup--batas-sistem)
2. [Jenis Naskah Resmi RS'ASF](#2-jenis-naskah-resmi-rsasf)
3. [Anatomi Format Dokumen per Jenis Naskah](#3-anatomi-format-dokumen-per-jenis-naskah)
4. [Format Penomoran Dokumen](#4-format-penomoran-dokumen)
5. [Kalender Hijriyah + Masehi](#5-kalender-hijriyah--masehi)
6. [Hierarki Penandatangan](#6-hierarki-penandatangan)
7. [Alur Workflow per Kategori](#7-alur-workflow-per-kategori)
8. [Skema Database Final](#8-skema-database-final)
9. [Template & Inject Variabel](#9-template--inject-variabel)
10. [Arsitektur Sistem & Tech Stack](#10-arsitektur-sistem--tech-stack)
11. [Roadmap Implementasi](#11-roadmap-implementasi)
12. [Keputusan Teknis yang Sudah Disepakati](#12-keputusan-teknis-yang-sudah-disepakati)
13. [Poin yang Masih Perlu Keputusan Tim](#13-poin-yang-masih-perlu-keputusan-tim)
14. [Lampiran C — Stirling-PDF: Endpoint yang Dipakai](#lampiran-c--stirling-pdf-endpoint-yang-dipakai-modul-tata-naskah)

---

## 1. Ruang Lingkup & Batas Sistem

### Yang Dibangun di Modul Ini (Portal SIFAST)

- Manajemen dokumen **regulasi & korespondensi resmi** RS'ASF
- Auto-numbering otomatis sesuai format RS'ASF
- Template per jenis naskah + inject variabel otomatis
- Workflow approval multi-level sesuai hierarki jabatan RS
- TTE internal (fase 2) + verifikasi QR Code
- Distribusi dokumen ke unit + konfirmasi penerimaan
- Audit trail lengkap setiap perubahan status
- Dual kalender Hijriyah–Masehi otomatis
- Laporan & export siap akreditasi STARKES

### Yang Tetap di SIKAT (Tidak Diduplikasi)

- Surat masuk / surat keluar harian operasional
- Penomoran surat masuk/keluar
- SPO yang sudah berjalan di SIKAT (jika ada)

### Batas Tegas

```
[Portal SIFAST — Modul Tata Naskah]
  → Dokumen regulasi: PER, SK, INS, SE, SPO, Pedoman, Panduan
  → Korespondensi resmi Direktur: Surat Biasa, Undangan, Surat Keterangan,
    Surat Perintah, Surat Tugas, Surat Kuasa, Berita Acara, Pengumuman,
    Surat Pengantar, Rekomendasi, Memorandum, Sertifikat

[SIKAT — Legacy]
  → Surat masuk/keluar operasional harian
  → (Akses dari Portal via SSO link, tidak dibangun ulang)
```

---

## 2. Jenis Naskah Resmi RS'ASF

Berdasarkan Lampiran Pedoman Tata Naskah RS'ASF 2026, berikut daftar jenis naskah yang **sudah memiliki template resmi** dan harus didukung sistem:

### Kelompok A — Naskah Regulasi (Korporasi/RS)

| Kode | Nama Lengkap | Level Penandatangan | TTE Wajib | Berlaku Setelah |
|------|--------------|---------------------|-----------|-----------------|
| `PER` | Peraturan Direktur | Direktur | Ya | Tanggal ditetapkan |
| `SK` | Keputusan Direktur | Direktur | Ya | Tanggal ditetapkan |
| `INS` | Instruksi Direktur | Direktur | Ya | Tanggal ditetapkan |
| `SE` | Surat Edaran Direktur | Direktur | Ya | Tanggal ditetapkan |
| `SPO` | Standar Prosedur Operasional | Direktur | Ya | Tanggal terbit |
| `PDM` | Pedoman | Direktur | Ya | Tanggal berlaku |
| `PAN` | Panduan | Direktur | Ya | Tanggal berlaku |
| `CP` | Clinical Pathway | Direktur | Ya | Tanggal berlaku |
| `PRK` | Program Kerja | Direktur | Ya | Tanggal berlaku |

### Kelompok B — Naskah Korespondensi (Dapat dari Direktur atau Unit)

| Kode | Nama Lengkap | Level Penandatangan | TTE Wajib |
|------|--------------|---------------------|-----------|
| `SB` | Surat Biasa | Direktur | Opsional |
| `UND` | Undangan Direktur | Direktur | Tidak |
| `UND-UNIT` | Undangan Unit | Kabid/Kabag/Kepala Unit | Tidak |
| `SKT` | Surat Keterangan | Direktur | Tidak |
| `SPI` | Surat Perintah | Direktur | Tidak |
| `STD` | Surat Tugas Perjalanan Dinas | Direktur | Tidak |
| `LPD` | Laporan Perjalanan Dinas | Petugas (diketahui atasan) | Tidak |
| `SKU` | Surat Kuasa | Direktur | Ya (materai) |
| `PNG` | Pengumuman | Direktur | Tidak |
| `SPT` | Surat Pengantar | Direktur | Tidak |
| `BA` | Berita Acara | Direktur + Pihak II | Tidak |
| `RKM` | Rekomendasi | Direktur | Tidak |
| `MEM` | Memorandum/Memo Intern | Direktur (multi-level) | Opsional |
| `SP` | Surat Perjanjian / PKS | Direktur + Pihak II | Ya (materai) |
| `NTL` | Notulen | Notulis + Pimpinan Rapat | Tidak |
| `DFH` | Daftar Hadir | — | Tidak |
| `SRT` | Sertifikat | Direktur + Ketua Panitia | Tidak |
| `CTI` | Permohonan Cuti/Izin | Atasan langsung + tidak langsung | Tidak |

---

## 3. Anatomi Format Dokumen per Jenis Naskah

### 3.1 Kop Naskah — Dua Varian

**Varian A — Kop Standar (untuk PER, SK, INS, SE, Surat-surat)**
```
[Logo RS'ASF kiri] | Rumah Sakit Umum 'Aisyiyah
                   | Siti Fatimah
                   | Pimpinan Daerah 'Aisyiyah Sidoarjo
-----------------------------------------------------------
Footer: Jl. Raya Kenongo No.14 Tulangan Sidoarjo
        Telp.(031)8856303 (031)8857637 (031)72980115
        Fax.(031)8851922 Email: aisyiyah.15@gmail.com
```

**Varian B — Kop Tabel (khusus SPO)**
```
| Nama RS (kiri)  | Judul SPO (kanan)           |
|                 | Nomor Dokumen | No Revisi | Halaman |
| STANDAR PROSEDUR| Tanggal Terbit | Ditetapkan Direktur  |
| OPERASIONAL     |                | (nama + NBM)         |
```

### 3.2 Struktur Isi per Jenis

**Peraturan Direktur (PER):**
```
PERATURAN DIREKTUR RSU 'AISYIYAH SITI FATIMAH TULANGAN
NOMOR: [auto-generated]
TENTANG
[JUDUL — KAPITAL, TENGAH]

Direktur RSU 'Aisyiyah Siti Fatimah Tulangan
Menimbang   : a. ...; b. ...;
Mengingat   : 1. ...; 2. ...; dst.
MEMUTUSKAN
Menetapkan  : [JUDUL SINGKAT]
Pasal 1 ... Pasal 2 ... Pasal dst.
Ditetapkan di: Sidoarjo
Pada tanggal : [Hijriyah] / [Masehi]
Direktur,
[TTD] → dr. M Hud Suhargono, Sp.OG.SubSp. Obginsos / NBM. 1327 7025 1619433
Tembusan: Majelis Kesehatan PDA Sidoarjo / Sesuai Yang Bersangkutan / Unit Terkait / Arsip
```

**Surat Keputusan (SK):**
```
Sama dengan PER, tapi diktum menggunakan:
Kesatu: ... Kedua: ... Ketiga: ... (bukan Pasal)
```

**Instruksi Direktur (INS):**
```
Sama dengan SK, tapi setelah MEMUTUSKAN ada:
Menginstruksikan
Kepada : 1. ...; 2. dst.
Untuk  : Kesatu: ... Kedua: ...
```

**Surat Edaran (SE):**
```
SURAT EDARAN DIREKTUR
NOMOR: [auto]
TENTANG [JUDUL]
Kepada Yth: ...
Assalamu 'alaikum ...
[Isi paragraf]
Nashrun Minallah Wa Fathun Qorib
Wassalamu 'alaikum ...
Ditetapkan di / Pada tanggal [Hijriyah/Masehi]
Direktur, [TTD]
```

**SPO (Standar Prosedur Operasional):**
```
Format tabel, field wajib:
- PENGERTIAN
- TUJUAN
- KEBIJAKAN
- PROSEDUR (boleh multi-halaman, header tabel berulang)
- UNIT TERKAIT
Nomor Revisi harus ditrack (00, 01, 02, dst.)
```

**Memo Intern:**
```
Placeholder sistem yang sudah ada di pedoman:
${nomor}, ${lampiran}, ${sifat}, ${pengirim}, ${jabatan},
${tanggal_surat}, ${perihal}
QR Code 4 level: ${qrcode_4}=Koordinator, ${qrcode_3}=Kasubid/Kasubag,
                  ${qrcode_2}=Kabag/Kabid, ${qrcode}=Direktur
```

**Surat Biasa, Undangan, Surat Keterangan, dll.:**
> Semua menggunakan kop Varian A, salam pembuka Islami `Assalamu 'alaikum Warahmatullahi Wabarakatuh` dan salam penutup `Nashrun Minallah Wa Fathun Qorib / Wassalamu 'alaikum ...`

---

## 4. Format Penomoran Dokumen

### 4.1 Pola Format (Dari Contoh Nyata di Pedoman)

Dari contoh undangan yang terdapat di pedoman:
```
RS'ASF/…./III.6.AU/A/…/202…
```

Breakdown komponen:
```
RS'ASF / [nomor-urut] / [kode-unit] / [kode-sifat] / [bulan-romawi] / [tahun]
```

**Catatan khusus SPO (dari contoh pedoman):**
```
RS'ASF/08/SPO/ADM/I/III/2015
→ RS'ASF / 08 / SPO / ADM / I (revisi) / III (bulan) / 2015
```

### 4.2 Komponen Format per Jenis

| Komponen | Keterangan | Contoh |
|----------|-----------|--------|
| `RS'ASF` | Kode institusi — tetap | `RS'ASF` |
| `[nomor-urut]` | Counter per jenis + unit + tahun, 3 digit, auto-reset tiap 1 Jan | `001`, `042` |
| `[kode-jenis]` | Kode jenis naskah | `PER`, `SK`, `SPO`, `UND` |
| `[kode-unit]` | Kode departemen/unit (dari `departemen` SIMRS) | `ADM`, `KEP`, `MED` |
| `[bulan-romawi]` | Bulan ditetapkan dalam angka Romawi | `I`, `III`, `XII` |
| `[tahun]` | Tahun 4 digit | `2026` |

**Format final yang direkomendasikan:**
```
RS'ASF/[NNN]/[JENIS]/[UNIT]/[BR]/[YYYY]
Contoh: RS'ASF/001/PER/DIR/VI/2026
         RS'ASF/042/SPO/ADM/III/2026
         RS'ASF/007/SK/KEP/I/2026
```

### 4.3 Aturan Counter

- Counter scoped per **kode_jenis + dep_id + tahun**
- Increment atomic menggunakan `DB::transaction` + `lockForUpdate()`
- Reset otomatis setiap 1 Januari
- Nomor **tidak boleh di-delete** — jika dokumen dibatalkan, nomor tetap ada tapi status `batal`
- Override nomor oleh admin **hanya** diizinkan untuk migrasi dokumen lama (butuh log alasan)

### 4.4 Nomor Versi Dokumen

- Revisi **tidak mengubah nomor dokumen**
- Nomor tetap, versi naik: `v1 → v2 → v3`
- SPO: No. Revisi di header tabel (00, 01, 02, dst.)
- Dokumen `aktif` hanya boleh **satu versi pada satu waktu**

---

## 5. Kalender Hijriyah + Masehi

### 5.1 Kebutuhan

Seluruh dokumen RS'ASF mencantumkan **dua tanggal**:
```
Pada tanggal : 22 Dzulhijah 1447 H
               08 Juni 2026 M
```

### 5.2 Implementasi

Gunakan library PHP konversi Hijriyah yang sudah teruji:

```php
// Opsi 1: package umwari/hijri (ringan, no external dependency)
composer require umwari/hijri

use Umwari\Hijri\HijriDate;
$hijri = HijriDate::fromGregorian(2026, 6, 8);
// → "22 Dzulhijah 1447 H"

// Opsi 2: Hitung manual dengan algoritma Khalid Shaukat (akurat)
// Simpan di HijriConverterService.php
```

### 5.3 Format Tampilan

```
[NamaHariBahasa Indonesia], [DD] [NamaBulanHijriyah] [YYYY] H
[DD] [NamaBulanMasehi] [YYYY] M
```

Nama bulan Hijriyah: Muharram, Safar, Rabiul Awal, Rabiul Akhir, Jumadil Awal, Jumadil Akhir, Rajab, Sya'ban, Ramadhan, Syawal, Dzulqa'dah, Dzulhijah.

### 5.4 Penerapan di Sistem

- Tanggal Hijriyah **digenerate otomatis** dari tanggal Masehi saat dokumen ditetapkan
- Disimpan di kolom `tanggal_hijriyah VARCHAR(50)` di tabel `dokumen`
- Tidak boleh diedit manual (otomatis dari sistem)

---

## 6. Hierarki Penandatangan

### 6.1 Level Penandatangan (dari Pedoman)

| Level | Jabatan | Jenis Dokumen |
|-------|---------|---------------|
| **L1 — Direktur** | dr. M Hud Suhargono, Sp.OG.SubSp. Obginsos / NBM. 1327 7025 1619433 | PER, SK, INS, SE, SPO, semua surat resmi Direktur |
| **L2 — Kabid/Kabag** | Nama + NIK (per jabatan) | Undangan unit, surat internal unit |
| **L3 — Kepala Unit** | Nama + NIK | Memo intern, dokumen internal unit |
| **L4 — Koordinator** | Nama + NIK | Tanda-tangan pertama di memo 4-level |

### 6.2 Memo Intern — Alur 4 Level (dari Template Pedoman)

Berdasarkan placeholder `${qrcode_4}` sampai `${qrcode}` di pedoman:

```
[Koordinator - qrcode_4] → [Kasubid/Kasubag - qrcode_3] → [Kabag/Kabid - qrcode_2] → [Direktur - qrcode]
```

Ini adalah **workflow approval berjenjang yang sudah ada di format fisik** — sistem digital harus mencerminkan alur ini.

### 6.3 Delegasi Penandatangan

- Jika pejabat cuti/berhalangan → bisa didelegasikan ke pejabat lain
- Delegasi harus tercatat di `permintaan_tanda_tangan.didelegasikan_kepada`
- Di dokumen tercetak, tulisan: "a.n. [Nama Direktur] / [Nama Pejabat yang Menandatangani] / [Jabatan]"

---

## 7. Alur Workflow per Kategori

### 7.1 Workflow Regulasi (PER, SK, INS, SE, SPO, Pedoman)

```
[draft]
   ↓
[review_unit]     → unit pembuat review internal
   ↓ (atau ditolak → kembali ke draft dengan catatan)
[review_mutu]     → bagian mutu/kesekretariatan review
   ↓ (atau ditolak)
[menunggu_tte]    → Direktur approve & TTE
   ↓ (atau ditolak)
[aktif]           → nomor digenerate, dokumen dipublish
   ↓
[menunggu_review] → T-30 hari sebelum tanggal_review, notifikasi otomatis
   ↓
[kadaluarsa]      → jika tidak direvisi setelah tanggal_review
   ATAU
[direvisi]        → versi baru dibuat, versi lama diarsip
   ↓
[arsip]
```

**Aturan penting:**
- Nomor dokumen **baru digenerate saat status berubah ke `menunggu_tte`** (bukan saat draft)
- Dokumen `aktif` tidak bisa diedit langsung — harus buat versi baru
- Status `kadaluarsa` tidak menghapus akses — dokumen masih bisa dibaca tapi ada badge peringatan

### 7.2 Workflow Korespondensi (Surat, Memo, Undangan, dll.)

```
[draft]
   ↓
[persetujuan_atasan]   → Kabid/Kabag setujui (untuk surat unit)
   ATAU langsung ke:
[menunggu_tte]         → untuk dokumen yang butuh TTE Direktur
   ↓
[terbit]               → nomor digenerate, dokumen aktif
   ↓
[arsip]
```

**Catatan:** Surat operasional sederhana (undangan unit, memo internal) bisa skip ke `terbit` langsung setelah persetujuan atasan langsung.

### 7.3 Workflow SPO (Khusus)

SPO punya **No. Revisi** yang harus ditrack terpisah:
```
Revisi 00 → Revisi 01 → Revisi 02 → ...
```
Setiap revisi = versi baru di `versi_dokumen`, tapi `nomor_dokumen` tetap sama. No. Revisi tersimpan di `regulasi_meta.nomor_revisi`.

### 7.4 State Machine — Aturan Transisi

```
draft           → review_unit (submit oleh pembuat)
review_unit     → review_mutu (approve unit) | draft (tolak dengan catatan)
review_mutu     → menunggu_tte (approve mutu) | review_unit (tolak)
menunggu_tte    → aktif (TTE Direktur) | review_mutu (tolak)
aktif           → menunggu_review (otomatis T-30 hari)
menunggu_review → aktif (review selesai, tidak ada perubahan) | draft_revisi (ada perubahan)
draft_revisi    → [ikuti alur dari awal, versi baru]
aktif/kadaluarsa → arsip (manual oleh admin/kesekretariatan)
```

### 7.5 Notifikasi Otomatis

| Event | Notifikasi ke | Channel |
|-------|--------------|---------|
| Submit review | Reviewer unit | Telegram + FCM |
| Approve/tolak unit | Pembuat dokumen | Telegram + FCM |
| Masuk ke mutu | Tim mutu/kesekretariatan | Telegram + FCM |
| Menunggu TTE | Direktur | Telegram + FCM |
| Dokumen aktif | Pembuat + distribusi list | Telegram + FCM |
| T-30 hari review | Owner + tim mutu | Telegram + FCM |
| Dokumen kadaluarsa | Owner + tim mutu + admin | Telegram + FCM |

---

## 8. Skema Database Final

### 8.1 Prinsip Desain

- **Reuse `departemen` (SIMRS)** untuk unit kerja — tidak membuat tabel `unit_kerja` baru di fase 1
- **Reuse `users`** yang sudah ada (dengan `simrs_nik`)
- **Tidak duplikasi** data yang sudah ada di SIKAT
- Kolom `tanggal_hijriyah` disimpan sebagai string (sudah diformat)

### 8.2 Tabel Master

```sql
CREATE TABLE konfigurasi_jenis_dokumen (
    kode                    VARCHAR(10) PRIMARY KEY,       -- PER, SK, SPO, dll
    nama                    VARCHAR(100) NOT NULL,
    kategori                ENUM('regulasi','korespondensi','khusus') NOT NULL,
    deskripsi               TEXT NULL,

    -- Penomoran
    format_nomor            VARCHAR(150) DEFAULT "RS'ASF/[NNN]/[KODE]/[UNIT]/[BR]/[YYYY]",
    prefix_kode_rs          VARCHAR(10) DEFAULT "RS'ASF",

    -- Inject ke PDF
    halaman_inject          TINYINT UNSIGNED DEFAULT 1,
    posisi_x                SMALLINT UNSIGNED NULL,
    posisi_y                SMALLINT UNSIGNED NULL,
    ukuran_font             TINYINT UNSIGNED DEFAULT 11,
    alignment               ENUM('kiri','tengah','kanan') DEFAULT 'kanan',

    -- Template
    template_docx           VARCHAR(500) NULL,
    template_pdf            VARCHAR(500) NULL,
    varian_kop              ENUM('standar','tabel_spo','memo') DEFAULT 'standar',

    -- Workflow
    tipe_workflow           ENUM('regulasi','korespondensi','khusus') NOT NULL,
    butuh_tte_direktur      BOOLEAN DEFAULT TRUE,
    level_penandatangan     ENUM('direktur','kabid_kabag','kepala_unit') DEFAULT 'direktur',
    jumlah_reviewer         TINYINT UNSIGNED DEFAULT 2,  -- berapa level review sebelum TTE

    -- Salam Islami (semua dokumen RS'ASF memakainya)
    pakai_salam_islami      BOOLEAN DEFAULT TRUE,

    is_aktif                BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8.3 Tabel Utama Dokumen

```sql
CREATE TABLE dokumen (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nomor_dokumen           VARCHAR(80) NULL UNIQUE,       -- NULL sampai status menunggu_tte
    judul                   VARCHAR(255) NOT NULL,
    kategori                ENUM('regulasi','korespondensi','khusus') NOT NULL,
    kode_jenis              VARCHAR(10) NOT NULL,
    dep_id                  INT NOT NULL,                  -- FK ke departemen SIMRS (reuse existing)
    tingkat                 ENUM('korporasi','rs','unit') DEFAULT 'unit',

    dibuat_oleh             BIGINT UNSIGNED NOT NULL,      -- FK ke users
    versi_saat_ini_id       BIGINT UNSIGNED NULL,

    status                  ENUM(
                                'draft','review_unit','review_mutu',
                                'menunggu_tte','aktif','menunggu_review',
                                'kadaluarsa','arsip','batal'
                            ) DEFAULT 'draft',

    -- Tanggal (dual kalender)
    tanggal_ditetapkan      DATE NULL,
    tanggal_hijriyah        VARCHAR(50) NULL,              -- "22 Dzulhijah 1447 H" — auto-generate
    tanggal_berlaku         DATE NULL,
    tanggal_review          DATE NULL,                     -- kapan harus direview ulang
    tanggal_kadaluarsa      TIMESTAMP NULL,

    diarsipkan_pada         TIMESTAMP NULL,
    deleted_at              TIMESTAMP NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (kode_jenis) REFERENCES konfigurasi_jenis_dokumen(kode)
);
```

### 8.4 Tabel Versi Dokumen

```sql
CREATE TABLE versi_dokumen (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dokumen_id              BIGINT UNSIGNED NOT NULL,
    nomor_versi             TINYINT UNSIGNED NOT NULL DEFAULT 1,
    nomor_revisi            VARCHAR(5) NULL,               -- "00","01","02" — khusus SPO

    -- Tiga file per versi (sesuai proposal grok: original → numbered → final)
    file_asli               VARCHAR(500) NULL,             -- upload dari user
    file_bernomor           VARCHAR(500) NULL,             -- setelah inject nomor
    file_final              VARCHAR(500) NULL,             -- setelah TTE embed

    hash_sha256             CHAR(64) NOT NULL,
    ukuran_kb               INT UNSIGNED NOT NULL,
    jumlah_halaman          SMALLINT UNSIGNED NOT NULL,

    catatan_perubahan       TEXT NULL,
    dibuat_oleh             BIGINT UNSIGNED NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE
);
```

### 8.5 Counter Penomoran (Atomic)

```sql
CREATE TABLE counter_nomor_dokumen (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode_jenis      VARCHAR(10) NOT NULL,
    dep_id          INT NOT NULL,
    tahun           SMALLINT UNSIGNED NOT NULL,
    counter         MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    UNIQUE KEY uq_counter (kode_jenis, dep_id, tahun),
    FOREIGN KEY (kode_jenis) REFERENCES konfigurasi_jenis_dokumen(kode)
);
```

### 8.6 Tabel Pendukung

```sql
-- Approval & TTE
CREATE TABLE permintaan_tanda_tangan (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    versi_dokumen_id        BIGINT UNSIGNED NOT NULL,
    penandatangan_id        BIGINT UNSIGNED NOT NULL,     -- FK users
    jabatan                 VARCHAR(100) NULL,
    urutan                  TINYINT UNSIGNED NOT NULL,    -- 1=pertama, dst
    level_qrcode            TINYINT UNSIGNED NULL,        -- 1-4 untuk memo 4-level
    status                  ENUM('pending','signed','rejected','delegasi') DEFAULT 'pending',
    ditandatangani_pada     TIMESTAMP NULL,
    alasan_ditolak          TEXT NULL,
    data_tanda_tangan       JSON NULL,                    -- koordinat, hash, dll
    didelegasikan_kepada    BIGINT UNSIGNED NULL,         -- FK users, jika delegasi

    FOREIGN KEY (versi_dokumen_id) REFERENCES versi_dokumen(id)
);

-- Distribusi + konfirmasi penerimaan (wajib untuk STARKES)
CREATE TABLE distribusi_dokumen (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dokumen_id      BIGINT UNSIGNED NOT NULL,
    dep_id          INT NOT NULL,                         -- unit penerima
    dikirim_oleh    BIGINT UNSIGNED NOT NULL,
    dikirim_pada    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diterima_oleh   BIGINT UNSIGNED NULL,                 -- konfirmasi penerimaan
    diterima_pada   TIMESTAMP NULL,
    catatan         TEXT NULL,

    FOREIGN KEY (dokumen_id) REFERENCES dokumen(id)
);

-- Audit trail (wajib, setiap perubahan status)
CREATE TABLE audit_dokumen (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dokumen_id      BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    aksi            VARCHAR(50) NOT NULL,                 -- 'submit_review','approve','tolak','tte', dll
    status_lama     VARCHAR(30) NULL,
    status_baru     VARCHAR(30) NULL,
    catatan         TEXT NULL,
    ip_address      VARCHAR(45) NULL,
    user_agent      VARCHAR(300) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dokumen_id) REFERENCES dokumen(id)
);
```

### 8.7 Tabel Meta (Polimorfik per Kategori)

```sql
-- Meta khusus dokumen regulasi (PER, SK, INS, SE, SPO, dll.)
CREATE TABLE meta_regulasi (
    dokumen_id          BIGINT UNSIGNED PRIMARY KEY,
    dasar_hukum         TEXT NULL,                        -- isi "Mengingat"
    menimbang           TEXT NULL,
    mengingat           TEXT NULL,
    diktum              TEXT NULL,                        -- isi keputusan/pasal
    nomor_revisi        VARCHAR(5) NULL,                  -- "00","01" — SPO
    keterangan_lampiran TEXT NULL,
    tags_clinical_pathway JSON NULL,

    FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE
);

-- Meta khusus surat (Surat Biasa, Undangan, Surat Keterangan, dll.)
-- CATATAN: Hanya untuk surat yang TIDAK lewat SIKAT.
-- Surat masuk/keluar operasional harian tetap di SIKAT.
CREATE TABLE meta_surat (
    dokumen_id      BIGINT UNSIGNED PRIMARY KEY,
    kepada          TEXT NULL,
    perihal         VARCHAR(255) NULL,
    tembusan        TEXT NULL,
    sifat           ENUM('biasa','segera','rahasia','sangat_rahasia') DEFAULT 'biasa',
    lampiran        VARCHAR(150) NULL,
    hal             VARCHAR(255) NULL,

    FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE
);

-- Untuk AI semantic search (fase 3)
CREATE TABLE embedding_dokumen (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    versi_dokumen_id    BIGINT UNSIGNED NOT NULL,
    indeks_chunk        SMALLINT UNSIGNED NOT NULL,
    teks_chunk          TEXT NOT NULL,
    embedding           JSON NULL,
    model_version       VARCHAR(50) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Template & Inject Variabel

### 9.1 Daftar Placeholder (dari Pedoman RS'ASF)

Berdasarkan template Memo Intern yang sudah ada di pedoman, RS'ASF sudah menggunakan sistem placeholder. Sistem harus konsisten dengan ini:

| Placeholder | Data dari | Keterangan |
|-------------|-----------|-----------|
| `${nomor}` | `dokumen.nomor_dokumen` | Auto-generate |
| `${judul}` | `dokumen.judul` | Input user |
| `${perihal}` | `meta_surat.perihal` | Input user |
| `${tanggal_masehi}` | `dokumen.tanggal_ditetapkan` | Auto (format: 08 Juni 2026 M) |
| `${tanggal_hijriyah}` | `dokumen.tanggal_hijriyah` | Auto-convert |
| `${pengirim}` | `users.nama` (pembuat) | Auto |
| `${jabatan}` | `users.jabatan` | Auto |
| `${lampiran}` | `meta_surat.lampiran` | Input user |
| `${sifat}` | `meta_surat.sifat` | Input user |
| `${kepada}` | `meta_surat.kepada` | Input user |
| `${tembusan}` | `meta_surat.tembusan` | Input user |
| `${nama_direktur}` | `pengaturan_rs.nama_direktur` | Dari config |
| `${nbm_direktur}` | `pengaturan_rs.nbm_direktur` | Dari config |
| `${qrcode}` | Generate dari hash dokumen | TTE Direktur |
| `${qrcode_2}` | Generate dari hash dokumen | TTE Kabid/Kabag |
| `${qrcode_3}` | Generate dari hash dokumen | TTE Kasubid |
| `${qrcode_4}` | Generate dari hash dokumen | TTE Koordinator |

### 9.2 Alur Template (Fase 1 — Upload Manual)

```
1. Admin upload template .docx per jenis naskah ke sistem
2. User download template → edit di Word → export PDF → upload ke sistem
3. Sistem inject: nomor, tanggal Hijriyah+Masehi, QR Code ke posisi yang dikonfigurasi
4. Hasilkan file_bernomor (PDF dengan nomor terinjeksi)
5. Setelah TTE → hasilkan file_final (PDF dengan TTE embed)
```

### 9.3 PDF Processing — Stirling-PDF (Keputusan Tim)

> **Status:** Tim memutuskan memakai **Stirling-PDF** sebagai mesin PDF processing via REST API.
> Instance internal: `http://192.168.10.44:8888` (v2.13.0, status UP).
> Swagger UI: `/swagger-ui/index.html` (butuh login + API key).
> Daftar endpoint yang **benar-benar dipakai** modul Tata Naskah: **Lampiran C**.

Stirling-PDF adalah **aplikasi terpisah** (Docker) di server RS. Laravel memanggil REST API-nya — business logic tetap di Portal SIFAST.

```
[Server RS'ASF]
│
├── Stirling-PDF → http://192.168.10.44:8888
│   (Java, self-hosted, data PDF tidak keluar RS)
│
└── Laravel Portal SIFAST
    └── StirlingPdfService.php → HTTP POST + X-API-KEY → terima PDF hasil
```

**Config di `.env` Portal:**
```env
STIRLING_PDF_URL=http://192.168.10.44:8888
STIRLING_PDF_API_KEY=...   # dari SECURITY_CUSTOMGLOBALAPIKEY di Stirling, atau user API key
STIRLING_PDF_TIMEOUT=120
```

**Config di `config/services.php`:**
```php
'stirling_pdf' => [
    'url' => env('STIRLING_PDF_URL'),
    'api_key' => env('STIRLING_PDF_API_KEY'),
    'timeout' => (int) env('STIRLING_PDF_TIMEOUT', 120),
],
```

**Wrapper Laravel (desain):**
```php
// app/Services/Tatanaskah/StirlingPdfService.php
final class StirlingPdfService
{
    public function addTextStamp(string $pdfPath, string $text, array $position): string { /* ... */ }
    public function addImageStamp(string $pdfPath, string $imagePath, array $position): string { /* ... */ }
    public function addWatermark(string $pdfPath, string $text): string { /* ... */ }
    public function getPdfInfo(string $pdfPath): array { /* jumlah_halaman, ukuran, dll */ }
    public function certSign(string $pdfPath, string $p12Path, string $password, array $opts): string { /* fase 2+ */ }
}
```

**Yang TIDAK perlu dipanggil dari Portal:**
- UI Stirling (view-pdf, visual sign drag-drop) — fitur frontend-only, tidak ada di API
- Semua 50+ tool lainnya — hanya panggil endpoint yang ada di Lampiran C

**Catatan penting dari dokumentasi Stirling:**
- Semua request wajib header `X-API-KEY` jika security enabled (instance RS sudah aktif — endpoint mengembalikan 401 tanpa key)
- Beberapa fitur signing visual **hanya tersedia di Web UI**, bukan API — untuk Tata Naskah pakai `add-stamp` (gambar TTD/QR) dan `cert-sign` (sertifikat)
- Validasi parameter (fontSize, spacer) saat panggil `add-watermark` — hindari nilai ekstrem (risiko DoS)

---

#### Opsi alternatif (tidak dipilih): FPDI + TCPDF

Tetap dicatat sebagai fallback jika Stirling-PDF down, tapi **bukan jalur utama**.

| | FPDI + TCPDF | Stirling-PDF ✅ |
|--|--|--|
| Setup | `composer require` | Docker + API key |
| Inject teks/gambar | Manual coding koordinat | `add-stamp` API |
| TTE sertifikat | Terbatas | `cert-sign` + shared signing |
| Maintenance | Satu codebase | Dua service |

---

## 10. Arsitektur Sistem & Tech Stack

### 10.1 Stack (Mengikuti Portal SIFAST yang Ada)

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Inertia.js |
| Backend | Laravel (PHP) |
| Database | MySQL |
| PDF Processing | **Stirling-PDF** v2.13.0 via REST API (`192.168.10.44:8888`) — lihat §9.3 & Lampiran C |
| Storage | Disk private + Signed URL |
| Notifikasi | Telegram Bot + FCM (sudah ada di Portal) |
| Auth | Fortify (reuse, tidak dibangun ulang) |
| Konversi Hijriyah | `umwari/hijri` atau HijriConverterService custom |
| AI (fase 3) | OpenRouter + embedding (belum ditentukan provider) |

### 10.2 Struktur Kode

```
app/
├── Http/Controllers/Tatanaskah/
│   ├── DokumenController.php
│   ├── ApprovalController.php
│   ├── DistribusiController.php
│   └── PublicVerifikasiController.php
├── Models/
│   ├── Dokumen.php
│   ├── VersiDokumen.php
│   ├── KonfigurasiJenisDokumen.php
│   ├── CounterNomorDokumen.php
│   ├── PermintaanTandaTangan.php
│   ├── DistribusiDokumen.php
│   ├── AuditDokumen.php
│   ├── MetaRegulasi.php
│   └── MetaSurat.php
├── Services/Tatanaskah/
│   ├── StirlingPdfService.php         ← wrapper HTTP ke Stirling-PDF API
│   ├── DocumentNumberService.php      ← generate nomor atomic
│   ├── DocumentStorageService.php     ← adapt dari TicketAttachmentStorageService
│   ├── HijriConverterService.php      ← konversi tanggal dual kalender
│   └── DistribusiNotifService.php     ← kirim notif Telegram/FCM
├── Jobs/
│   ├── InjectNomorDokumenJob.php
│   └── KirimNotifikasiDistribusiJob.php
└── Policies/
    └── DokumenPolicy.php

resources/js/modules/tatanaskah/
├── pages/
│   ├── Index.jsx           ← daftar + filter
│   ├── Create.jsx          ← form buat dokumen baru
│   ├── Show.jsx            ← detail + PDF viewer
│   ├── Approval.jsx        ← halaman pengesahan (two-panel)
│   ├── Distribusi.jsx
│   └── Arsip.jsx
├── components/
│   ├── DokumenCard.jsx
│   ├── StatusBadge.jsx
│   ├── PdfViewer.jsx
│   └── WorkflowTimeline.jsx
└── public/
    └── VerifikasiPublik.jsx  ← tanpa login, akses via QR Code
```

### 10.3 Role & Permission

Tambahkan flag di tabel `users` (pola existing Portal):

```php
// users table — tambah kolom:
'can_buat_dokumen'          // staf unit — bisa draft dokumen
'can_review_dokumen'        // reviewer unit
'can_approve_mutu'          // tim mutu/kesekretariatan
'can_tte_dokumen'           // Direktur / pejabat yang berwenang TTE
'can_distribusi_dokumen'    // admin distribusi
'can_manage_tatanaskah'     // admin modul (CRUD master jenis, template)
'can_konfirmasi_terima'     // kepala unit — konfirmasi terima distribusi
```

---

## 11. Roadmap Implementasi

### Fase 0 — Persiapan (1 minggu)

- [ ] Setup role & permission flag di `users`
- [ ] Seed `konfigurasi_jenis_dokumen` dengan 20+ jenis naskah RS'ASF
- [ ] Upload template awal (minimal: PER, SK, SPO, Memo Intern, Surat Biasa)
- [ ] Setup `HijriConverterService` + test akurasi konversi
- [ ] Setup `DocumentNumberService` + unit test race condition
- [ ] Verifikasi koneksi Stirling-PDF (`GET /api/v1/info/status`) + simpan API key di `.env`
- [ ] Uji `add-stamp` via Swagger untuk 2–3 jenis naskah (tentukan koordinat `%`)

### Fase 1 — MVP Document Control (4–5 minggu)

- [ ] Migration: semua tabel (dokumen, versi_dokumen, counter, meta, audit, distribusi)
- [ ] CRUD dokumen + upload file PDF
- [ ] Auto-numbering atomic (generate saat status → `menunggu_tte`)
- [ ] Inject nomor + tanggal dual kalender ke PDF
- [ ] Workflow status: draft → review_unit → review_mutu → menunggu_tte → aktif
- [ ] `audit_dokumen` — setiap transisi status
- [ ] Distribusi dokumen + **konfirmasi penerimaan** (wajib STARKES)
- [ ] Notifikasi Telegram/FCM per event
- [ ] Halaman daftar dokumen + filter (jenis, status, unit, tanggal review)
- [ ] Halaman detail + PDF viewer
- [ ] Reminder otomatis T-30 hari sebelum tanggal_review
- [ ] Permission guard per role

### Fase 2 — TTE & Laporan (3–4 minggu)

- [ ] TTE "soft": upload PDF yang sudah ditandatangani + hash SHA-256
- [ ] QR Code di dokumen → link ke halaman verifikasi publik (tanpa login)
- [ ] Halaman verifikasi publik: scan QR → tampil status & keaslian dokumen
- [ ] Export laporan: dokumen aktif per unit, dokumen menjelang kadaluarsa
- [ ] Export Excel/PDF siap akreditasi STARKES
- [ ] Link ke SIKAT untuk surat terkait (SSO)
- [ ] Override nomor oleh admin (untuk migrasi dokumen lama — dengan log alasan)

### Fase 3 — Advanced (Evaluasi setelah Fase 2)

- [ ] TTE Internal PKI (RSA-2048, OpenSSL, Root CA RS) — evaluasi kebutuhan vs biaya maintenance
- [ ] ATAU integrasi BSrE/Kominfo (jika RS sudah siap infrastruktur)
- [ ] AI Semantic Search: `embedding_dokumen` + vector search
- [ ] OCR dokumen legacy (arsip fisik lama)
- [ ] Generator PDF dari rich text editor (bukan upload manual)
- [ ] Integrasi clinical pathway tags dengan SIMRS

---

## 12. Keputusan Teknis yang Sudah Disepakati

| # | Keputusan | Alasan |
|---|-----------|--------|
| 1 | Penomoran pakai `counter_nomor_dokumen` + transaction + row lock | Anti-duplikat, atomic, scoped per jenis+unit+tahun |
| 2 | Reuse `departemen` SIMRS (bukan buat `unit_kerja` baru) | Konsisten dengan tiket, SIMRS, payroll |
| 3 | `META_SURAT` tetap ada tapi scope-nya bukan surat operasional SIKAT | Untuk surat resmi Direktur yang tidak lewat SIKAT |
| 4 | Nomor dokumen **tidak berubah saat revisi** — versi naik, nomor tetap | Referensi di lapangan tidak kacau |
| 5 | Nomor digenerate saat `menunggu_tte`, bukan saat draft | Nomor hanya keluar untuk dokumen yang akan resmi |
| 6 | Distribusi + konfirmasi penerimaan masuk **Fase 1** (bukan Fase 2) | Wajib untuk STARKES — surveyor tanya bukti distribusi |
| 7 | TTE fase 1: approval flag + hash SHA-256 saja | PKI mandiri terlalu berat untuk fase awal |
| 8 | Tanggal Hijriyah auto-generate, tidak boleh diedit manual | Konsistensi dan mencegah kesalahan manusia |
| 9 | Storage file: disk private + Signed URL (bukan disk public) | Keamanan dokumen internal RS |
| 10 | Audit trail tabel terpisah `audit_dokumen` (bukan gabung `ticket_activities`) | Domain berbeda, tapi struktur mirip |
| 11 | Salam Islami (Assalamu'alaikum, Nashrun Minallah) dikonfigurasi per jenis | Sesuai pedoman RS'ASF, semua dokumen resmi memakai salam |
| 12 | PDF processing via **Stirling-PDF** REST API (instance internal RS) | Server sudah running v2.13.0; fokus Laravel ke business logic; siap TTE cert & shared signing fase 2+ |

---

## 13. Poin yang Masih Perlu Keputusan Tim

| # | Pertanyaan | Opsi | Rekomendasi |
|---|------------|------|-------------|
| 1 | Format kode unit di nomor dokumen — pakai kode apa? | A) Kode departemen SIMRS B) Kode singkat baru | Pakai kode `departemen` SIMRS, tambah kolom `kode_singkat` jika belum ada |
| 2 | Scope counter nomor — ada yang tanpa kode unit (nomor pusat Direktur)? | A) Semua pakai kode unit B) Direktur punya counter sendiri tanpa unit | Tanyakan ke Kesekretariatan |
| 3 | Reset counter per tahun atau per bulan? | A) Per tahun (lebih umum) B) Per bulan | Per tahun, kecuali ada jenis tertentu yang harus per bulan |
| 4 | Siapa owner template dokumen? | A) Kesekretariatan B) Tim IT C) Admin modul | Rekomendasi: Kesekretariatan buat template, IT setup di sistem |
| 5 | Nomor boleh di-override admin untuk migrasi? | A) Ya (dengan log) B) Tidak | Ya, tapi wajib log alasan dan siapa yang override |
| 6 | Apakah SPO di SIKAT akan dipindah ke sistem baru? | A) Migrasi bertahap B) SPO baru saja di sini C) Tidak, SIKAT tetap pegang | Perlu inventaris berapa SPO di SIKAT |
| 7 | Dokumen kadaluarsa: otomatis atau manual? | A) Otomatis setelah tanggal_review lewat B) Manual oleh admin | Rekomendasi: otomatis status `menunggu_review` → jika 30 hari tidak ada aksi → `kadaluarsa` |
| 8 | Berapa lama dokumen arsip disimpan sebelum bisa dihapus permanen? | A) Tidak pernah dihapus B) 5 tahun C) Sesuai kebijakan | Sesuaikan dengan kepolitikan retensi dokumen RS (cek dengan Kesekretariatan) |
| 9 | Koordinat inject (nomor, TTD, QR) per jenis naskah — siapa tentukan? | A) Hardcode di config B) Admin atur via `konfigurasi_jenis_dokumen` C) Uji di Swagger Stirling dulu | Rekomendasi: simpan posisi % di master jenis dokumen; uji visual di Swagger UI |
| 10 | Fallback jika Stirling-PDF down? | A) Queue job + retry B) Manual proses sementara C) FPDI fallback | Rekomendasi: queue + retry + alert admin; FPDI opsional |

---

## Lampiran A — Mapping Jenis Naskah RS'ASF ke Kode Sistem

| Nama Lengkap di Pedoman | Kode Sistem | Kategori | Kop | TTE |
|------------------------|-------------|----------|-----|-----|
| Peraturan Direktur | `PER` | regulasi | standar | Wajib |
| Keputusan Direktur | `SK` | regulasi | standar | Wajib |
| Instruksi Direktur | `INS` | regulasi | standar | Wajib |
| Surat Edaran Direktur | `SE` | regulasi | standar | Wajib |
| Standar Prosedur Operasional | `SPO` | regulasi | tabel_spo | Wajib |
| Pedoman | `PDM` | regulasi | standar | Wajib |
| Panduan | `PAN` | regulasi | standar | Wajib |
| Clinical Pathway | `CP` | regulasi | standar | Wajib |
| Program Kerja | `PRK` | regulasi | standar | Wajib |
| Surat Biasa | `SB` | korespondensi | standar | Opsional |
| Undangan Direktur | `UND` | korespondensi | standar | Tidak |
| Undangan Unit | `UND-UNIT` | korespondensi | standar | Tidak |
| Surat Keterangan | `SKT` | khusus | standar | Tidak |
| Surat Perintah | `SPI` | korespondensi | standar | Tidak |
| Surat Tugas Perjalanan Dinas | `STD` | korespondensi | standar | Tidak |
| Laporan Perjalanan Dinas | `LPD` | korespondensi | khusus | Tidak |
| Surat Kuasa | `SKU` | khusus | standar | Ya (materai) |
| Pengumuman | `PNG` | korespondensi | standar | Tidak |
| Surat Pengantar | `SPT` | korespondensi | standar | Tidak |
| Berita Acara | `BA` | khusus | standar | Tidak |
| Rekomendasi | `RKM` | khusus | standar | Tidak |
| Memorandum / Memo Intern | `MEM` | korespondensi | memo | Opsional |
| Surat Perjanjian / PKS | `SP` | khusus | standar | Ya (materai) |
| Notulen | `NTL` | korespondensi | khusus | Tidak |
| Daftar Hadir | `DFH` | korespondensi | khusus | Tidak |
| Sertifikat | `SRT` | khusus | khusus | Wajib |
| Permohonan Cuti/Izin | `CTI` | korespondensi | khusus | Tidak |

---

## Lampiran C — Stirling-PDF: Endpoint yang Dipakai Modul Tata Naskah

> **Instance RS:** `http://192.168.10.44:8888` — versi **2.13.0** (terverifikasi via `GET /api/v1/info/status`).
> **Auth:** header `X-API-KEY: {key}` pada setiap request POST.
> **Swagger:** `/swagger-ui/index.html` (login diperlukan untuk browse schema).
> **Prinsip:** Portal **tidak** memanggil semua 50+ tool Stirling — hanya endpoint di bawah ini.

### C.1 Ringkasan: Yang Dipakai vs Tidak

| Kategori | Dipakai? | Keterangan |
|----------|----------|------------|
| **Stamp (teks/gambar)** | ✅ Fase 1 | Inject nomor, tanggal, TTD PNG, QR Code |
| **Watermark** | ✅ Fase 1 | Preview draft / label KONFIDENCIAL |
| **Get PDF Info** | ✅ Fase 1 | Ambil `jumlah_halaman`, metadata untuk `versi_dokumen` |
| **Convert Office→PDF** | ⚠️ Opsional | Jika nanti generate dari .docx server-side (fase 3) |
| **Cert Sign** | ✅ Fase 2+ | TTE kriptografis dengan sertifikat .p12/.pfx |
| **Shared Signing Sessions** | ✅ Fase 2+ | Memo 4-level / multi-penandatangan |
| **Add Password / Flatten** | ✅ Fase 2 | Lock PDF setelah publish |
| **Timestamp RFC 3161** | ⚠️ Fase 3 | Timestamp otoritatif (evaluasi kebutuhan) |
| **OCR** | ⚠️ Fase 3 | Arsip fisik legacy |
| **Merge / Compress / Repair** | ⚠️ Sesuai kebutuhan | Lampiran, optimasi ukuran |
| **Visual Sign (drag-drop)** | ❌ Tidak | Frontend-only Stirling, bukan API |
| **Split / Rotate / Crop / dll.** | ❌ Tidak | Di luar scope Tata Naskah |

### C.2 Endpoint per Alur Dokumen

#### Fase 1 — MVP (wajib diintegrasikan)

| # | Endpoint | Method | Kapan dipanggil | Input utama | Output |
|---|----------|--------|-----------------|-------------|--------|
| 1 | `/api/v1/general/get-pdf-info` | POST | Setelah user upload `file_asli` | `fileInput` (PDF) | Metadata: jumlah halaman, ukuran → isi `versi_dokumen` |
| 2 | `/api/v1/misc/add-stamp` | POST | Status → `menunggu_tte`: inject **nomor + tanggal Hijriyah/Masehi** | `fileInput`, `stampType=text`, `stampText`, koordinat `%` | `file_bernomor` |
| 3 | `/api/v1/misc/add-stamp` | POST | Fase 1 TTE soft: inject **QR Code verifikasi** | `stampType=image`, `stampImage` (PNG QR), posisi halaman terakhir | PDF dengan QR |
| 4 | `/api/v1/misc/add-stamp` | POST | Fase 1 TTE soft: inject **gambar TTD** (PNG) | `stampType=image`, `stampImage` (PNG TTD Direktur/pejabat) | `file_final` (soft sign) |
| 5 | `/api/v1/security/add-watermark` | POST | Preview dokumen **draft** (opsional) | `watermarkType=text`, `watermarkText=DRAFT`, opacity rendah | PDF preview |
| 6 | `/api/v1/info/status` | GET | Health check dari Portal / monitoring | — | `{ status: UP, version }` |

**Parameter kunci `add-stamp` (teks):**
```
fileInput      = PDF sumber
stampType      = text | image
stampText      = "RS'ASF/001/PER/DIR/VI/2026"  (untuk teks)
stampImage     = file PNG (untuk QR / TTD)
pageNumbers    = 1 | last | 1,3,5
xPercent       = posisi horizontal (0–100)
yPercent       = posisi vertikal (0–100)
fontSize       = ukuran font (teks)
rotation       = rotasi derajat
opacity        = transparansi (0–1)
```

> Posisi `%` disimpan di `konfigurasi_jenis_dokumen` (kolom `posisi_x`, `posisi_y` bisa diadaptasi ke persen). Uji koordinat per jenis naskah lewat Swagger UI sebelum hardcode.

#### Fase 2 — TTE & Keamanan PDF

| # | Endpoint | Method | Kapan dipanggil | Keterangan |
|---|----------|--------|-----------------|------------|
| 7 | `/api/v1/security/cert-sign` | POST | TTE kriptografis Direktur | Upload PDF + sertifikat `.p12` + password; set `pageNumber` walaupun invisible sign |
| 8 | `/api/v1/security/cert-sign/sessions` | POST | Memo 4-level / multi-signer | Buat sesi shared signing |
| 9 | `/api/v1/security/cert-sign/sessions/{id}/participants` | POST | Tambah penandatangan (Koordinator → Direktur) | Mapping ke `permintaan_tanda_tangan.urutan` |
| 10 | `/api/v1/security/cert-sign/sessions/{id}/finalize` | POST | Semua sudah sign → finalisasi PDF | Hasilkan `file_final` |
| 11 | `/api/v1/security/add-password` | POST | Setelah publish | Lock PDF agar tidak diedit |
| 12 | `/api/v1/misc/flatten` | POST | Setelah TTE | Flatten annotation/signature layer |

**Workflow participant (token-based, jika penandatangan sign via link terpisah):**
- `GET /api/v1/workflow/participant/document?token=...`
- `POST /api/v1/workflow/participant/submit-signature`

> Untuk Tata Naskah fase 2: evaluasi apakah penandatangan sign **di dalam Portal** (Portal panggil cert-sign atas nama user) atau via **link token Stirling** (lebih dekat ke shared signing native).

#### Fase 3 — Lanjutan (evaluasi)

| # | Endpoint | Kapan | Keterangan |
|---|----------|-------|------------|
| 13 | `/api/v1/convert/office/pdf` | Generate PDF dari template .docx | Ganti alur "export manual Word" |
| 14 | `/api/v1/security/timestamp-pdf` | Timestamp RFC 3161 | Tambah cap waktu otoritatif post-sign |
| 15 | `/api/v1/misc/ocr-pdf` | OCR arsip lama | Indeks teks dokumen legacy |
| 16 | `/api/v1/general/merge-pdfs` | Gabung lampiran | Dokumen + lampiran jadi satu PDF |
| 17 | `/api/v1/misc/compress-pdf` | File terlalu besar | Optimasi storage |
| 18 | `/api/v1/general/repair` | PDF corrupt dari upload | Recovery sebelum proses |

### C.3 Alur Pipeline PDF di Portal (via Stirling)

```
Upload file_asli (user)
    │
    ├─► get-pdf-info ──────────────► isi jumlah_halaman, ukuran_kb
    │
    ├─► [opsional] add-watermark ──► preview DRAFT
    │
    ▼
Status → menunggu_tte (nomor digenerate Portal, BUKAN Stirling)
    │
    ├─► add-stamp (teks) ───────────► nomor + tanggal Hijriyah/Masehi
    │                                 = file_bernomor
    │
    ├─► add-stamp (image QR) ───────► QR verifikasi publik
    │
    ▼
TTE (fase 1: stamp image TTD PNG → file_final)
    │   (fase 2: cert-sign / shared signing sessions)
    │
    ├─► [fase 2] add-password + flatten
    │
    ▼
Simpan hash_sha256 + audit_dokumen
```

**Penting:** Penomoran dokumen (`RS'ASF/001/...`) tetap di **`DocumentNumberService` Portal** — Stirling hanya **men-stamp teks** ke PDF, bukan generate counter.

### C.4 Contoh Panggilan dari Laravel

```php
// Inject nomor dokumen (teks) — fase 1
$response = Http::withHeaders(['X-API-KEY' => config('services.stirling_pdf.api_key')])
    ->timeout(config('services.stirling_pdf.timeout'))
    ->attach('fileInput', Storage::disk('private')->get($pdfPath), 'dokumen.pdf')
    ->post(config('services.stirling_pdf.url').'/api/v1/misc/add-stamp', [
        'stampType'   => 'text',
        'stampText'   => $nomorDokumen."\n".$tanggalHijriyah."\n".$tanggalMasehi,
        'pageNumbers' => '1',
        'xPercent'    => $config->posisi_x ?? 60,
        'yPercent'    => $config->posisi_y ?? 15,
        'fontSize'    => $config->ukuran_font ?? 11,
        'opacity'     => 1,
        'rotation'    => 0,
    ]);

if (! $response->successful()) {
    throw new StirlingPdfException('add-stamp gagal: '.$response->status());
}

Storage::disk('private')->put($outputPath, $response->body());
```

### C.5 Checklist Integrasi Stirling

- [ ] API key Stirling (`SECURITY_CUSTOMGLOBALAPIKEY` atau user key) disimpan di `.env` Portal
- [ ] Portal bisa reach `192.168.10.44:8888` dari container/app server
- [ ] Uji `add-stamp` per jenis naskah (PER, SPO, Memo) — tentukan koordinat `%` final
- [ ] Health check `GET /api/v1/info/status` dimonitor (alert jika DOWN)
- [ ] Job queue untuk proses PDF (Stirling bisa lambat pada file besar)
- [ ] Validasi ukuran file upload sebelum kirim ke Stirling

---

## Lampiran B — Checklist Sebelum Mulai Coding

- [ ] Dokumen ini sudah disetujui tim (developer + Kesekretariatan + manajemen)
- [ ] Format nomor resmi per jenis sudah dikonfirmasi Kesekretariatan
- [ ] Kode singkat tiap departemen/unit sudah terdefinisi di SIMRS
- [ ] Template .docx minimal (PER, SK, SPO, Memo, Surat Biasa) sudah siap dari Kesekretariatan
- [ ] Library konversi Hijriyah sudah ditest akurasinya
- [ ] Poin diskusi di §13 sudah dijawab semua
- [ ] Semua developer baca dokumen ini sebelum mulai coding

---

*Dokumen ini dibuat berdasarkan: Lampiran Pedoman Tata Naskah RS'ASF 2026 (sumber primer), Bahan Diskusi Tim Internal Portal SIFAST, dan analisis teknis Claude AI. Versi 1.0 — Juni 2026.*

*Revisi dokumen ini harus melalui persetujuan: Lead Developer + Kesekretariatan RS'ASF.*
