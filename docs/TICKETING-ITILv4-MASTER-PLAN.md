# Master Plan: Sistem Ticketing Berbasis ITIL v4

**Dokumen ini dipakai sebagai:** acuan pengembangan dan **bahan diskusi** tim. Silakan dibaca, diberi catatan, dan didiskusikan sebelum mulai coding.

**Untuk acuan teknis tetap (tabel, role, aturan):** gunakan **`TICKETING-REFERENSI-TEKNIS.md`** — dokumen itu membekukan keputusan agar programmer lain tidak mengubah desain tanpa disepakati.

---

## 1. Tujuan & Ruang Lingkup

**Tujuan:** Membangun sistem tiket (ticketing) untuk rumah sakit yang mengacu pada praktik ITIL v4, agar setiap **insiden**, **permintaan layanan**, dan nantinya **perubahan** layanan IT tercatat rapi, punya alur kerja jelas, dan bisa diukur.

**Yang masuk dalam sistem (ruang lingkup):**
- **Dua divisi pelayanan:** **IT** (sistem informasi, jaringan, aplikasi) dan **IPS** (Instalasi Sarana Prasarana: peralatan kantor, alat medis, sarana prasarana). Satu sistem tiket, dua divisi penanggung jawab.
- **Manajemen Insiden** — gangguan layanan yang perlu diperbaiki
- **Manajemen Permintaan Layanan (Service Request)** — permintaan layanan standar (misalnya minta akses, minta instalasi, perbaikan alat)
- **Problem** — akar penyebab berulang (bisa ditambah di fase lanjut)
- **Change Enablement** — perubahan yang terkendali (bisa ditambah di fase lanjut)
- Kategorisasi, prioritas, SLA dasar, dan penugasan ke divisi/tim/pegawai (termasuk fasilitasi untuk tim kecil yang merangkap support & programmer)

**Yang tidak masuk (untuk fase awal):** CMDB lengkap, manajemen aset penuh, portofolio proyek, manajemen keuangan IT.

**Poin diskusi:** Apakah untuk fase 1 cukup **Insiden + Permintaan Layanan** dulu, atau ada tipe tiket lain yang harus masuk dari awal?

---

## 2. Konteks Tim & Divisi yang Terlibat

Sistem ini dipakai oleh **tim kecil** dengan **peran ganda** dan **lebih dari satu divisi**. Agar desain dan aturan mainnya pas, konteks ini perlu dicatat dan difasilitasi di dalam sistem.

### 2.1 Divisi IT (tim kecil, peran campur)

- **Jumlah:** sekitar 3 orang.
- **Peran tidak tetap:** kadang **support** (menangani tiket), kadang **programmer** (ngoding/pengembangan), kadang rapat atau tugas lain.
- **Head IT:** selain urusan teknis juga menjalankan tugas manajemen (rapat, koordinasi dengan pihak lain, dll), sehingga tidak selalu bisa langsung menangani tiket.

**Implikasi untuk sistem:**
- Satu orang bisa sekaligus **pemohon**, **penanggung jawab tiket**, dan **programmer** yang mengerjakan backlog pengembangan.
- Sistem perlu memudahkan **programmer** juga: misalnya tampilan “tiket yang ditugaskan ke saya” vs “tiket tim”, filter “sedang saya kerjakan” vs “antrian”, agar saat mereka membagi waktu antara support dan ngoding tetap terbantu.
- SLA dan prioritas perlu **realistis** untuk tim kecil (misalnya tidak mengasumsikan ada orang yang full-time hanya jaga tiket).
- **Poin diskusi:** Apakah perlu fitur “ketersediaan” sederhana (misalnya status “sedang fokus ngoding / rapat”) agar ekspektasi pemohon dan tim bisa diselaraskan?

### 2.2 Permintaan pengembangan aplikasi (dari manajemen) — masuk tiket?

**Ya.** Permintaan dari manajemen untuk “buatkan aplikasi” atau pengembangan fitur **masuk ke sistem tiket** agar tercatat, punya satu nomor tiket, dan bisa dilacak. Bisa dipetakan sebagai:

- **Tipe:** Permintaan Layanan (Service Request), atau
- **Kategori:** misalnya “Pengembangan Aplikasi” / “Proyek Pengembangan” di bawah Permintaan Layanan.

**Tolak ukur (KPI/SLA) tidak sama dengan IT support.** Tingkat kesulitan dan lama pengerjaan pengembangan aplikasi berbeda dengan perbaikan insiden (mis. printer error, akses SIMRS). Jadi:

- **Support (insiden/request rutin):** tolak ukur bisa pakai SLA waktu tanggap + waktu selesai (jam/hari) seperti P1–P4.
- **Pengembangan aplikasi:** tolak ukur lebih cocok **berdasarkan kesepakatan** — misalnya due date per fase, target per rilis, atau “selesai sesuai kesepakatan dengan pemohon”, **bukan** SLA “resolve dalam 4 jam” seperti insiden.

**Di ITIL v4:** Tidak ada standar baku khusus untuk “programmer” atau pengembangan aplikasi. Praktik yang mendekati: permintaan pengembangan biasanya masuk **Service Request** (permintaan layanan yang sifatnya custom/proyek) dan bisa diatur dengan **target waktu yang berbeda** dari insiden — misalnya lewat kategori khusus atau aturan SLA terpisah untuk kategori “Pengembangan Aplikasi”.

**Implikasi di sistem kita:**
- Ada **kategori** (atau subkategori) untuk “Pengembangan Aplikasi” / “Proyek Pengembangan”.
- **Aturan SLA/tolak ukur** untuk kategori ini **berbeda** dari insiden/support: misalnya hanya “batas waktu sesuai kesepakatan” (due date manual atau per fase), tidak pakai rumus response/resolution jam seperti P1–P4.
- Laporan nanti bisa memisahkan: tiket support vs tiket pengembangan, agar KPI tim support dan “selesainya proyek aplikasi” tidak dicampur tolak ukurnya.

**Keputusan:** Due date untuk tiket pengembangan aplikasi **ditetapkan oleh Head IT** (bukan pemohon). Pemohon/user tidak mengerti kompleksitas IT sehingga penetapan batas waktu menjadi wewenang Head IT.

### 2.3 Divisi IPS (Instalasi Sarana Prasarana)

- **IPS** = **Instalasi Sarana Prasarana** rumah sakit.
- **Tugas:** menangani kerusakan/perawatan **peralatan kantor** dan **alat medis** (bukan hanya sistem informasi).

**Implikasi untuk sistem:**
- Tiket tidak hanya ditangani **divisi IT**, tetapi juga **divisi IPS**.
- Kategori tiket harus bisa membedakan:
  - **Domain IT:** software, jaringan, akses, aplikasi SIMRS, email, printer (jika terkait sistem), dll → penugasan ke **IT**.
  - **Domain IPS:** peralatan kantor, alat medis, sarana prasarana (AC, listrik, bangunan, dll) → penugasan ke **IPS**.
- Penugasan bisa ke **divisi** dulu (IT vs IPS), baru kemudian ke **orang** di divisi tersebut, atau langsung ke orang yang sudah jelas divisinya.

**Poin diskusi:**
- Daftar kategori untuk **IT** vs **IPS** perlu dirinci bareng (IT: apa saja; IPS: peralatan kantor, alat medis, jenis alat medis, dll). Siapa user IPS yang akses sistem diatur lewat **role & auth** (lihat §2.4).

### 2.4 Tiket gabungan IT + IPS (lebih dari satu orang, beda departemen)

**Ada skenario** satu tiket dikerjakan **bersama** oleh orang dari **dua departemen**. Contoh: kerusakan alat medis yang melibatkan bagian hardware (IPS) dan bagian software/antarmuka (IT) — **Agus dari IPS** dan **Anwar dari IT** bersama-sama menangani tiket yang sama.

**Implikasi di sistem:**
- Satu tiket punya **satu penanggung jawab utama (primary)**; rekan dari departemen lain (Agus IPS, Anwar IT) bisa dicatat di **komentar** atau nanti fase lanjut lewat mekanisme rekan penugasan.
- Model data: field **assignee_id** di tabel `tickets` (satu user primary); kontribusi rekan tercatat di timeline komentar.
- Di detail tiket: tampil satu penanggung jawab utama; rekan bisa disebutkan di komentar.
- Tolak ukur tiket tetap **satu** (satu tiket satu status selesai).

**Keputusan:** Penugasan **hanya satu penanggung jawab utama (primary)** per tiket. Tidak pakai role collaborator. Untuk tiket gabungan (Agus IPS + Anwar IT): satu orang ditunjuk sebagai primary; rekan dari divisi lain bisa dicatat di komentar atau nanti fase lanjut ditambah mekanisme “rekan penugasan” jika perlu.

### 2.5 Ringkasan: siapa terfasilitasi

| Pihak | Kebutuhan yang terfasilitasi |
|-------|------------------------------|
| **Programmer (departemen IT)** | Bisa lihat tiket “milik saya” vs “tim”, filter antrian, dan tidak dianggap full-time support sehingga SLA/prioritas bisa disesuaikan. |
| **Head IT** | Tetap bisa pantau tiket tim dan prioritas; menetapkan due date tiket pengembangan; bisa assign ke anggota tim. |
| **Staff IT (support)** | Bisa menerima penugasan tiket, update status, komentar, dan lampiran sesuai domain IT. |
| **Departemen IPS** | Mendapat tiket yang masuk kategori sarana prasarana / peralatan kantor / alat medis; penugasan ke orang IPS. |
| **Pemohon (user lain)** | Satu pintu: buat tiket sekali, sistem dan kategori membantu arah ke IT atau IPS. |

### 2.6 User, akses sistem, dan kaitan dengan Pegawai

**Semua pihak yang terlibat (IT, IPS, pemohon)** pada dasarnya terdaftar di **Pegawai** (SIMRS) — data induk ada di `app/Models/Pegawai.php`. Yang **login ke aplikasi ticketing** adalah **User** (tabel `users`); User bisa dihubungkan ke Pegawai lewat **NIK** (`simrs_nik`).

**Siapa yang akses sistem (termasuk user IPS)** diatur lewat **role dan auth**:
- **Role:** diperkuat di **authorization** (admin, staff, pemohon) — siapa boleh buat tiket, siapa boleh assign, siapa boleh lihat tiket departemen mana.
- **Departemen user:** setiap User (agent IT/IPS) punya **dep_id** (dari tabel `departemen`: IT, IPS, dll.) agar filter “tiket departemen saya” konsisten dan penugasan mengarah ke orang yang departemennya sesuai. Tiket gabungan: satu primary; rekan dari departemen lain bisa dicatat di komentar.

**Alur singkat:** Pegawai (SIMRS) → yang perlu akses aplikasi dibuatkan **User** (login) → User diberi **role** dan **dep_id** → auth & policy menentukan akses. Daftar user per departemen bisa dikelola di modul user (data pegawai per departemen dari SIMRS via relasi Pegawai → departemen).

**Sumber divisi: tabel `departemen` (SIMRS).** Divisi untuk penugasan tiket **tidak buat tabel baru** — pakai tabel **`departemen`** yang sudah ada dan berelasi dengan **Pegawai**. Struktur: `departemen` (`dep_id`, `nama`). Contoh yang relevan untuk tiket saat ini: `dep_id` **IT** (Bagian IT/Programer/EDP), **IPS** (Instalasi Pemeliharaan Sarana). Pegawai punya kolom `departemen` (= dep_id) dan relasi ke tabel departemen. Jadi:
- **Tiket** mengarah ke departemen penanggung jawab (IT atau IPS) dengan mereferensi **dep_id** dari tabel `departemen`.
- **User** (agent) divisinya bisa diambil dari Pegawai yang di-link via `simrs_nik` → Pegawai.departemen, atau kita simpan **dep_id** di User agar filter “tiket departemen saya” cepat tanpa selalu join ke Pegawai.
- Nanti kalau sistem dikembangkan ke **command center** (permintaan jemput pasien, keluhan umum, dll.), departemen lain di tabel yang sama (IGD, PEN, dll.) bisa dipakai tanpa ubah struktur.

**Role — saran untuk sekarang dan ke depan (command center):** Karena ke depan mau dikembangkan bukan cuma ticketing IT tapi juga **command center** (permintaan jemput pasien, keluhan masuk ke sini, dll.), sebaiknya **role tetap sederhana dan bisa dikembangkan**:
- **Sekarang:** role minimal misalnya **admin**, **staff** (bisa beda akses per departemen: IT vs IPS), **pemohon** (user yang hanya bisa buat tiket dan lihat tiket sendiri). Tidak perlu rinci head_it / programmer / support dulu — nanti kalau ada kebutuhan permission khusus bisa ditambah.
- **Nanti (command center):** tinggal tambah role atau permission baru (mis. operator command center, dispatcher ambulans) tanpa mengubah fondasi. Divisi/departemen tetap mengacu ke tabel **departemen** sehingga semua unit RS bisa terfasilitasi.

**Poin diskusi:** Setuju role sederhana dulu (admin, staff, pemohon) dengan divisi dari tabel `departemen`?

---

## 3. Kaitan dengan ITIL v4

Agar satu bahasa dengan standar, berikut pemetaan praktik ITIL v4 ke fitur sistem:

| Praktik ITIL v4 | Penerapan di sistem kita |
|-----------------|---------------------------|
| **Manajemen Insiden** | Tipe tiket "Insiden", alur status sampai selesai/closed |
| **Manajemen Permintaan Layanan** | Tipe tiket "Permintaan Layanan", bisa pakai template layanan |
| **Manajemen Problem** | Tipe "Problem", bisa dihubungkan ke Insiden (fase 2) |
| **Change Enablement** | Tipe "Permintaan Perubahan", alur persetujuan (fase 2) |
| **Manajemen Tingkat Layanan** | SLA waktu tanggap & waktu selesai, due date per prioritas |
| **Continual Improvement** | Laporan & metrik (fase 3) |

**Prinsip ITIL v4 yang kita ikuti:** Fokus pada nilai, Mulai dari kondisi sekarang, Berjalan bertahap, Tetap sederhana.

**Poin diskusi:** Apakah nama tipe tiket pakai bahasa Indonesia (Insiden, Permintaan Layanan) atau tetap Inggris (Incident, Service Request) di tampilan?

---

## 4. Model Data (Konsep)

### 4.1 Entitas Utama

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Tiket     │──────▶│  Tipe Tiket  │       │  Kategori   │
│ (insiden,   │       │ (insiden,     │       │ (master     │
│  permintaan,│       │  permintaan   │       │  kategori)  │
│  problem,   │       │  layanan,     │       │             │
│  perubahan) │       │  problem,     │       └──────┬──────┘
└──────┬──────┘       │  perubahan)   │              │
       │              └──────────────┘              │
       │              ┌──────────────┐              │
       ├─────────────▶│  Prioritas   │              │
       │              │ (P1–P4 +     │              │
       │              │  dampak/     │              │
       │              │  urgensi)     │              │
       │              └──────────────┘              │
       │              ┌──────────────┐       ┌──────▼───────┐
       ├─────────────▶│   Status     │       │ Subkategori  │
       │              │ (baru,       │       │ (opsional)   │
       │              │  ditugaskan,  │       └──────────────┘
       │              │  dikerjakan,  │
       │              │  tertunda,    │       ┌──────────────┐
       │              │  selesai,     │       │  Layanan     │
       │              │  ditutup)     │       │  (layanan    │
       │              └──────────────┘       │  terdampak)  │
       │                                      └──────────────┘
       │
       ├─────────────▶ Pemohon (User)
       ├─────────────▶ Penanggung jawab utama (satu User, primary); tiket gabungan: rekan bisa dicatat di komentar
       ├─────────────▶ Departemen (dep_id dari tabel departemen — IT, IPS, dll.) — arah penugasan
       ├─────────────▶ Grup/Tim (opsional, dalam satu departemen)
       │
       └─────────────▶ Komentar (timeline)
                       Lampiran (file)
```

### 4.2 Hubungan Antar Tipe (fase lanjut)

- **Insiden** bisa dikaitkan ke **Problem** (banyak insiden, satu problem).
- **Permintaan Perubahan** bisa merujuk ke Insiden atau Problem (perubahan untuk perbaikan).

### 4.3 Tabel Database (ringkas)

| Tabel | Fungsi |
|-------|--------|
| `departemen` (SIMRS) | Sudah ada: `dep_id`, `nama`. Dipakai sebagai **divisi** penugasan (IT, IPS, dll.); relasi dengan Pegawai. Tidak perlu tabel divisi baru. |
| `ticket_types` | Master tipe: Insiden, Permintaan Layanan, Problem, Perubahan |
| `ticket_categories` | Master kategori; dikaitkan ke **dep_id** (IT/IPS) agar tiket mengarah ke departemen yang benar |
| `ticket_subcategories` | Subkategori (opsional) |
| `ticket_priorities` | P1–P4 beserta definisi dampak/urgensi |
| `ticket_statuses` | Baru, Ditugaskan, Dikerjakan, Tertunda, Selesai, Ditutup |
| `tickets` | Data utama tiket (tipe, kategori, prioritas, status, **dep_id** departemen penanggung jawab, pemohon, **assignee_id** = satu penanggung jawab utama, batas waktu) |
| `ticket_comments` | Timeline aktivitas dan percakapan; untuk tiket gabungan, rekan (Agus IPS, Anwar IT) bisa disebutkan di sini |
| `ticket_attachments` | File lampiran |
| `ticket_sla_rules` | Aturan SLA per tipe/prioritas/kategori; **kategori Pengembangan Aplikasi** pakai aturan beda (due date ditetapkan Head IT) |
| `groups` / `group_user` | Tim/grup dalam satu departemen (opsional) |
| `users` (perluas) | Tambah **role** (admin, staff, pemohon) dan **dep_id** (untuk staff: departemen IT/IPS) agar auth & filter “tiket departemen saya”; User tetap link ke Pegawai lewat `simrs_nik` |

**Poin diskusi:** Daftar **kategori per departemen** — kategori untuk **IT** (Software, Jaringan, Akses, Aplikasi SIMRS, Email, Printer sistem, dll) vs kategori untuk **IPS** (Peralatan kantor, Alat medis, AC/listrik/sarana, dll). Siapa yang mengisi dan merawat daftar ini?

---

## 5. Fitur per Modul

### 5.1 Master Data (wajib di fase 1)

- **Tipe tiket:** Minimal Insiden + Permintaan Layanan; Problem & Perubahan bisa fase 2.
- **Divisi/departemen:** Pakai tabel **`departemen`** yang sudah ada (SIMRS); tidak buat tabel baru. Yang relevan untuk tiket: dep_id **IT**, **IPS**. Kategori dikaitkan ke dep_id agar tiket mengarah ke departemen yang benar.
- **Kategori & subkategori:** Bisa ditambah/edit (CRUD), dipakai saat buat tiket; bedakan kategori IT vs IPS.
- **Prioritas:** P1–P4 dengan penjelasan dampak/urgensi; bisa pakai matriks.
- **Status:** Mengikuti alur kerja; nanti bisa beda per tipe jika perlu.
- **SLA (sederhana):** Waktu tanggap & waktu selesai per prioritas (atau per tipe + prioritas); disesuaikan dengan tim kecil (IT + IPS). **Kategori “Pengembangan Aplikasi”** pakai aturan tolak ukur berbeda (due date kesepakatan, bukan SLA jam seperti insiden).

**Poin diskusi:** Prioritas P1–P4 kita definisikan bagaimana? (Contoh: P1 = layanan utama down, P4 = permintaan kecil.)

### 5.2 Tiket (fase 1 – MVP)

- **Buat tiket:** Form berisi judul, deskripsi, tipe, kategori, prioritas; pemohon = user yang login. Kategori menentukan **departemen** (IT/IPS) dari tabel `departemen`. Kategori “Pengembangan Aplikasi” → due date ditetapkan **Head IT** (bukan pemohon).
- **Daftar tiket:** Tabel dengan filter (status, tipe, prioritas, departemen, penanggung jawab, tanggal). Tampilan “Tiket ditugaskan ke saya” vs “Tiket departemen saya”.
- **Detail tiket:** Header + **satu penanggung jawab utama (primary)** + timeline komentar + lampiran. Untuk tiket gabungan (Agus IPS + Anwar IT), rekan bisa dicatat di komentar.
- **Ubah tiket:** Ubah status, **ganti penanggung jawab** (satu user primary), tambah komentar/lampiran.
- **Alur dasar:** Baru → Ditugaskan → Dikerjakan → Selesai → Ditutup (bisa ada status Tertunda di tengah).

### 5.3 Penugasan & Notifikasi (fase 1–2)

- Penugasan **satu penanggung jawab utama (primary)** per tiket — field `assignee_id` di `tickets` (atau satu baris di tabel penugasan). Tidak pakai collaborator. Tiket gabungan (dua orang beda departemen): satu sebagai primary, rekan dicatat di komentar.
- Penugasan ke user yang departemennya sesuai (dari tabel `departemen` via Pegawai/User); User punya **dep_id** untuk filter “tiket departemen saya”.
- Notifikasi dasar: tiket baru, tiket ditugaskan ke saya, ada komentar baru (email dan/atau in-app).

**Poin diskusi:** Notifikasi pertama mau lewat apa dulu? Email saja, atau ada Telegram/WhatsApp?

### 5.4 Laporan & SLA (fase 2–3)

- Dashboard: tiket per status, per prioritas, per **departemen** (IT, IPS, dll.), yang melewati batas waktu.
- Pemenuhan SLA: waktu tanggap & selesai vs target (realistis untuk tim kecil).
- Laporan sederhana: jumlah per kategori, per departemen, per penanggung jawab, tren bulanan.

---

## 6. Arsitektur Teknis (Stack yang Dipakai)

- **Backend:** Laravel 12 (PHP 8.4).
- **Frontend:** Inertia.js v2 + React, Tailwind, komponen UI yang sudah ada.
- **Autentikasi:** Laravel Fortify; user sudah ada. Penanggung jawab = user aplikasi (bisa dihubungkan ke data Pegawai SIMRS lewat `simrs_nik`).
- **Basis data:** MySQL (yang sudah dipakai); ditambah tabel-tabel ticketing.
- **Notifikasi (nanti):** Laravel Notification (email, database); bisa ditambah channel lain (mis. Telegram).
- **Antrian (opsional):** Laravel Queue untuk kirim email dan job berat.

**Rekomendasi:** Pemohon dan penanggung jawab pakai **User** yang login. Data induk = **Pegawai** (SIMRS), relasi ke **departemen** (tabel `departemen`: dep_id, nama). User di-link ke Pegawai lewat `simrs_nik`; User perlu **role** (admin, staff, pemohon) dan **dep_id** (untuk staff: departemen IT/IPS dari tabel `departemen`) agar auth & filter “tiket departemen saya” konsisten.

---

## 7. Fase Pengembangan

### Fase 1 – MVP (Insiden + Permintaan Layanan + IT & IPS)

1. **Master data**
   - **Divisi = tabel `departemen`** (SIMRS, sudah ada); tidak buat tabel divisions. Akses via model Departemen; yang dipakai untuk tiket fase 1: dep_id IT, IPS.
   - Migrasi: `ticket_types`, `ticket_categories` (dengan kaitan ke **dep_id**), `ticket_priorities`, `ticket_statuses`.
   - Seeder: nilai awal (Insiden, Permintaan Layanan, P1–P4, status, kategori contoh per dep_id IT/IPS).
   - Halaman admin master (atau minimal seed + konfigurasi sederhana).

2. **Tiket**
   - Migrasi: `tickets` (dengan **dep_id** departemen penanggung jawab, **assignee_id** = satu penanggung jawab utama), `ticket_comments`, `ticket_attachments`.
   - Model: `Ticket`, `TicketComment`, `TicketAttachment`; relasi ke User, **Departemen** (dep_id), kategori, prioritas, status, tipe. Satu tiket satu assignee (primary).
   - Controller + Form Request: buat, ubah, daftar, detail. Due date tiket pengembangan hanya bisa di-set oleh Head IT (atau role admin/staff tertentu).
   - Frontend: Form buat tiket (kategori auto-set departemen IT/IPS; kategori “Pengembangan Aplikasi”); daftar tiket filter (departemen, “tiket saya” vs “tiket departemen saya”); detail tiket dengan **satu penanggung jawab** + timeline + lampiran. Tiket gabungan: rekan dicatat di komentar.

3. **Alur kerja & penugasan**
   - Perpindahan status yang wajar (validasi di backend).
   - **Satu penanggung jawab (primary)** per tiket; form assign di detail tiket pilih satu user (dari departemen yang sesuai atau beda jika tiket gabungan).

4. **SLA & tolak ukur**
   - Tabel aturan SLA per prioritas/tipe (waktu tanggap & selesai, dalam menit) untuk tiket **support/insiden**.
   - Untuk kategori **Pengembangan Aplikasi:** due date **ditetapkan Head IT** (bukan pemohon); due date di-set manual/per fase.
   - Hitung due date sesuai aturan; tampilkan di daftar dan detail (peringatan jika lewat batas).

### Fase 2 – Problem, Perubahan, Grup, Notifikasi

- Tipe tiket: Problem, Permintaan Perubahan.
- Hubungan: Insiden → Problem; Perubahan → rujukan ke Insiden/Problem.
- Alur persetujuan untuk Perubahan (status Menunggu Persetujuan → Disetujui/Ditolak).
- Grup/tim **per departemen**: tabel grup & anggota (IT punya grup, IPS punya grup); penugasan ke grup lalu bisa didistribusi ke user.
- Notifikasi: email + database (tiket baru, penugasan, komentar); opsi “hanya tiket ke saya” untuk programmer/Head IT.

### Fase 3 – Laporan & Peningkatan Berkelanjutan

- Dashboard: grafik tiket per status/prioritas/tipe **per departemen** (IT, IPS, dll.), daftar overdue.
- Laporan: volume per kategori, per departemen, per penanggung jawab, kepatuhan SLA.
- Ekspor sederhana (CSV/Excel).

---

## 8. Urutan dan Ketergantungan

```
Master (departemen dari SIMRS, tipe, kategori, prioritas, status)
    → CRUD Tiket + Komentar + Lampiran (+ dep_id)
    → Penugasan satu primary per tiket + batas waktu / SLA dasar (due date pengembangan = Head IT)
    → Tampilan “tiket saya” vs “tiket departemen saya”
    → Notifikasi dasar
    → Problem + Perubahan + Persetujuan (fase 2)
    → Grup per departemen + Laporan (fase 2–3)
```

**Urutan development yang disarankan:**
1. Pakai tabel **departemen** (SIMRS) untuk divisi; migrasi + model + seeder master ticketing (tipe, kategori per dep_id, prioritas, status).
2. Perluas **User**: role + dep_id (untuk staff). CRUD tiket (buat, daftar, detail, ubah status/assignee); satu assignee primary per tiket; daftar dengan filter departemen & “tiket saya”.
3. Komentar & lampiran.
4. Batas waktu & SLA; due date pengembangan hanya bisa di-set oleh Head IT (policy).
5. Notifikasi (email/database).
6. Setelah stabil: Problem, Perubahan, Grup per departemen, lalu laporan.

---

## 9. Langkah Selanjutnya (Setelah Diskusi)

1. **Sepakati cakupan fase 1** — MVP: Insiden + Permintaan Layanan + **departemen IT & IPS** (dari tabel `departemen`) + master + **satu assignee primary** per tiket + SLA dasar. Due date pengembangan = **Head IT**.
2. **Finalisasi master** — Daftar kategori per **dep_id** (IT vs IPS) dan subkategori jika dipakai; siapa yang merawat daftar ini.
3. **Mulai implementasi** — Pakai **tabel `departemen`** (SIMRS) untuk divisi; migrasi master ticketing; **perluas User (role, dep_id)**; tabel **tickets** (assignee_id, dep_id) + comments + attachments; frontend daftar (filter departemen & “tiket saya”) + form buat + detail (satu penanggung jawab; tiket gabungan: rekan di komentar).

**Keputusan yang sudah masuk dokumen:**
- **Divisi** = tabel **departemen** (dep_id, nama), relasi ke Pegawai; tidak buat tabel divisi baru.
- **Due date tiket pengembangan** = ditetapkan **Head IT** (bukan pemohon).
- **Penugasan** = **satu penanggung jawab utama (primary)** per tiket; tiket gabungan: rekan dicatat di komentar.
- **Role** = sederhana dulu (admin, staff, pemohon), siap dikembangkan ke command center nanti.

**Pertanyaan untuk diskusi tim (jika ada):**
- Apakah daftar kategori per departemen (IT, IPS) plus kategori “Pengembangan Aplikasi” sudah mewakili kebutuhan RS?
- Siapa yang boleh membuat tiket? (Diperkuat di role/auth.)
- Notifikasi fase 1: email dulu atau perlu in-app?
