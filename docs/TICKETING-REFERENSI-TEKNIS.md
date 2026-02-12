# Dokumen Referensi Teknis — Sistem Ticketing Sika

**Untuk siapa:** Programmer yang meneruskan atau mengembangkan proyek ini.  
**Tujuan:** Acuan tetap agar keputusan desain **tidak berubah** tanpa disepakati ulang. Untuk konteks lengkap dan bahan diskusi, baca **`TICKETING-ITILv4-MASTER-PLAN.md`**.

**Bahasa:** Indonesia.

---

## 1. Ringkasan Keputusan (Jangan Diubah)

| Aspek | Keputusan |
|-------|-----------|
| **Divisi / departemen** | Pakai tabel **`departemen`** (SIMRS). **Jangan** buat tabel `divisions` atau sejenisnya. |
| **Role** | Hanya tiga: **admin**, **staff**, **pemohon**. Tidak pakai role rinci (head_it, programmer, support) di fase ini. |
| **Penugasan tiket** | **Satu penanggung jawab utama (primary)** per tiket. Tidak ada collaborator; tidak pakai tabel `ticket_assignments` multi-assignee. |
| **Model penugasan** | **Semi bebas (semi-open)**: tiket baru boleh tanpa assignee (unassigned pool), staff bisa ambil sendiri, admin/Head IT bisa assign ke siapa saja. |
| **Tiket gabungan (IT + IPS)** | Satu user sebagai primary; rekan dari departemen lain **dicatat di komentar** (atau fitur rekan di fase lanjut). |
| **Due date tiket pengembangan** | **Hanya Head IT** (atau role yang ditentukan) yang boleh menetapkan due date. Pemohon tidak mengisi due date untuk kategori Pengembangan Aplikasi. |
| **Eskalasi tiket** | **Tidak pakai kolom eskalasi** (tim kecil). Jika tiket stuck, lakukan **assign ulang** ke orang lain. |
| **Konfirmasi penutupan** | Status "Selesai" → "Menunggu Konfirmasi" → "Ditutup". Pemohon konfirmasi, atau **auto-close setelah 3 hari**. Teknisi juga bisa langsung tutup jika perlu. |
| **Reopen tiket** | **Tidak boleh reopen**. Jika masalah muncul lagi, **buat tiket baru** dengan referensi ke tiket lama (`related_ticket_id`). |
| **Audit trail** | Semua perubahan status dan assignee tercatat di tabel **`ticket_activities`**. |

---

## 2. Tabel Database

### 2.1 Tabel yang Sudah Ada (SIMRS) — Dipakai Langsung

**`departemen`**  
Sumber: SIMRS. **Jangan** duplikasi ke tabel baru.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `dep_id` | string (PK) | Kode departemen, contoh: `IT`, `IPS`, `IGD`, `PEN` |
| `nama` | string | Nama departemen |

**Contoh dep_id untuk ticketing fase 1:** `IT` (Bagian IT/Programer/EDP), `IPS` (Instalasi Pemeliharaan Sarana).  
Relasi: **Pegawai** punya kolom `departemen` (= dep_id) → relasi ke `departemen`.

---

### 2.2 Tabel User (Perluasan)

**`users`** (tabel Laravel yang sudah ada)

**Kolom yang harus ditambah** untuk ticketing:

| Kolom | Tipe | Nullable | Keterangan |
|-------|------|----------|------------|
| `role` | string/enum | tidak | Nilai: `admin`, `staff`, `pemohon` |
| `dep_id` | string (FK) | ya | Referensi ke `departemen.dep_id`. Untuk staff: departemen IT/IPS. Untuk pemohon bisa null. |

**Kolom yang sudah ada dan dipakai:** `simrs_nik` (hubungan ke Pegawai).

---

### 2.3 Tabel Master Ticketing (Baru)

**`ticket_types`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `name` / `nama` | string | Contoh: Insiden, Permintaan Layanan |
| `slug` atau `code` | string, unique | Opsional, untuk kode tetap |
| `created_at`, `updated_at` | timestamp | |

**`ticket_categories`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `name` / `nama` | string | |
| `dep_id` | string (FK) | Ke `departemen.dep_id`. Kategori ini mengarah ke departemen mana (IT/IPS). |
| `ticket_type_id` | bigint FK | Opsional: kaitan ke tipe tiket |
| `is_development` | boolean | Default false. True untuk kategori "Pengembangan Aplikasi" (due date oleh Head IT). |
| `created_at`, `updated_at` | timestamp | |

**`ticket_subcategories`** (opsional)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `name` / `nama` | string | |
| `ticket_category_id` | bigint FK | |
| `created_at`, `updated_at` | timestamp | |

**`ticket_priorities`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `name` / `nama` | string | Contoh: P1, P2, P3, P4 |
| `level` atau `order` | int | Urutan 1–4 |
| `description` | text, nullable | Dampak/urgensi (opsional) |
| `created_at`, `updated_at` | timestamp | |

**`ticket_statuses`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `name` / `nama` | string | Baru, Ditugaskan, Dikerjakan, Tertunda, Selesai, Menunggu Konfirmasi, Ditutup |
| `slug` atau `code` | string | Opsional |
| `created_at`, `updated_at` | timestamp | |

**Alur status lengkap:**
```
Baru → Ditugaskan → Dikerjakan → (Tertunda) → Selesai → Menunggu Konfirmasi → Ditutup
                                                      ↘ (auto-close 3 hari) ↗
                                                      ↘ (teknisi tutup langsung) ↗
```

---

### 2.4 Tabel Transaksi Tiket

**`tickets`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_number` | string, unique | Auto-generate: TKT-YYYYMMDD-XXXX |
| `ticket_type_id` | bigint FK | |
| `ticket_category_id` | bigint FK, nullable | Bisa null; default dari kategori |
| `ticket_subcategory_id` | bigint FK, nullable | Opsional |
| `ticket_priority_id` | bigint FK | |
| `ticket_status_id` | bigint FK | |
| `dep_id` | string (FK) | Departemen penanggung jawab (dari `departemen.dep_id`). |
| `requester_id` | bigint FK | `users.id` — pemohon. |
| **`assignee_id`** | bigint FK, nullable | **Satu penanggung jawab utama (primary).** `users.id`. |
| `title` | string | Judul tiket |
| `description` | text, nullable | |
| `due_date` | timestamp, nullable | Untuk kategori Pengembangan Aplikasi: di-set oleh Head IT. |
| `first_response_at` | timestamp, nullable | Waktu respons pertama (assign/komentar) |
| `response_due_at` | timestamp, nullable | Batas waktu tanggap (SLA) |
| `resolution_due_at` | timestamp, nullable | Batas waktu selesai (SLA) |
| `resolved_at` | timestamp, nullable | Waktu selesai (saat masuk Menunggu Konfirmasi) |
| `closed_at` | timestamp, nullable | Waktu tiket ditutup (untuk hitung auto-close) |
| `related_ticket_id` | bigint FK, nullable | Referensi ke tiket sebelumnya (jika ini tiket lanjutan/terkait) |
| `asset_id` | bigint FK, nullable | Referensi ke aset (untuk IPS: alat medis, peralatan). Disiapkan untuk fase 2. |
| `created_at`, `updated_at` | timestamp | |

**`ticket_comments`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_id` | bigint FK | |
| `user_id` | bigint FK | Pengirim komentar |
| `body` | text | Isi komentar; untuk tiket gabungan, rekan bisa disebutkan di sini. |
| `is_internal` | boolean | Opsional: hanya tampil untuk staff/admin |
| `created_at`, `updated_at` | timestamp | |

**`ticket_attachments`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_id` | bigint FK | |
| `user_id` | bigint FK | Yang mengunggah |
| `filename` | string | Nama file asli |
| `path` | string | Path di storage (disk: public) |
| `mime_type` | string, nullable | |
| `size` | unsignedBigInteger, nullable | Ukuran file (bytes). Max upload: 10 MB. |
| `created_at`, `updated_at` | timestamp | |

---

### 2.5 Tabel SLA (Fase 1 atau 2)

**`ticket_sla_rules`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_type_id` | bigint FK, nullable | |
| `ticket_priority_id` | bigint FK, nullable | |
| `ticket_category_id` | bigint FK, nullable | Kategori "Pengembangan Aplikasi" pakai aturan beda (due date manual). |
| `response_minutes` | int, nullable | Batas waktu tanggap (menit) |
| `resolution_minutes` | int, nullable | Batas waktu selesai (menit) |
| `created_at`, `updated_at` | timestamp | |

**Aturan bisnis:** Untuk kategori Pengembangan Aplikasi, due date **bukan** dari SLA jam ini — due date **ditetapkan Head IT** dan disimpan di `tickets.due_date`.

---

### 2.6 Tabel Vendor & Biaya Perbaikan (Fase 2)

**`ticket_vendor_costs`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_id` | bigint FK | |
| `vendor_name` | string | Nama vendor yang terlibat |
| `estimated_cost` | decimal(15,2), nullable | Estimasi biaya perbaikan |
| `actual_cost` | decimal(15,2), nullable | Biaya realisasi |
| `sparepart_notes` | text, nullable | Catatan sparepart yang diganti |
| `vendor_notes` | text, nullable | Catatan tambahan terkait pekerjaan vendor |
| `created_at`, `updated_at` | timestamp | |

**Kegunaan:**
- Laporan biaya tahunan IT dan IPS
- Evaluasi vendor
- Analisa peralatan yang sering rusak
- Dasar perencanaan anggaran dan pengadaan

**Berlaku untuk:** Perbaikan alat medis, perbaikan sarana prasarana, penggantian komponen kecil (mouse, keyboard, SSD, RAM, dll).

---

### 2.7 Tabel Activity Log (Audit Trail)

**`ticket_activities`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_id` | bigint FK | |
| `user_id` | bigint FK | User yang melakukan aksi |
| `action` | string | Jenis aksi: `created`, `status_changed`, `assigned`, `unassigned`, `commented`, `attachment_added`, `priority_changed`, `closed`, `auto_closed`, dll. |
| `old_value` | string, nullable | Nilai sebelum perubahan (mis. status lama, assignee lama) |
| `new_value` | string, nullable | Nilai setelah perubahan |
| `description` | text, nullable | Deskripsi tambahan (opsional) |
| `created_at` | timestamp | Waktu aksi |

**Kegunaan:**
- Audit trail lengkap untuk setiap tiket
- Laporan produktivitas per staff
- Analisa waktu penyelesaian per tahap
- Bukti akuntabilitas penugasan

**Contoh data:**
| action | old_value | new_value | description |
|--------|-----------|-----------|-------------|
| `created` | null | null | Tiket dibuat |
| `status_changed` | Baru | Ditugaskan | null |
| `assigned` | null | Budi (IT) | Diambil sendiri |
| `assigned` | Budi (IT) | Ani (IT) | Dipindahkan oleh admin |
| `closed` | Menunggu Konfirmasi | Ditutup | Auto-close 3 hari |
| `auto_closed` | Menunggu Konfirmasi | Ditutup | Auto-close 3 hari tanpa respons pemohon |

---

### 2.8 Tabel yang **Tidak** Dipakai (Fase 1)

- **`divisions`** — tidak dipakai. Divisi = tabel **`departemen`**.
- **`ticket_assignments`** (multi-assignee) — tidak dipakai. Satu tiket satu assignee, pakai kolom **`tickets.assignee_id`**.

---

## 3. Role dan Permission

### 3.1 Daftar Role (Tetap)

| Role | Keterangan |
|------|------------|
| **admin** | Full akses: master data, semua tiket, assign, ubah status, set due date pengembangan. |
| **staff** | Bisa lihat tiket (sesuai kebijakan: "tiket departemen saya" + "tiket ditugaskan ke saya"), assign, ubah status, komentar, lampiran. Bisa dibatasi per departemen (staff IT vs staff IPS). Head IT bisa dianggap admin atau staff dengan permission tambahan (mis. set due date). |
| **pemohon** | Hanya buat tiket dan lihat tiket sendiri. Tidak assign, tidak ubah status tiket orang lain. |

**Tidak dipakai di fase 1:** head_it, programmer, support, staff_it, staff_ips sebagai role terpisah. Pembeda staff IT vs IPS lewat **dep_id** (departemen), bukan role berbeda.

### 3.2 Siapa Boleh Apa (Ringkas)

| Aksi | admin | staff | pemohon |
|------|-------|-------|---------|
| Buat tiket | ✅ | ✅ | ✅ |
| Lihat semua tiket / tiket departemen | ✅ | ✅ (sesuai dep_id) | ❌ |
| Lihat tiket sendiri | ✅ | ✅ | ✅ |
| Assign / ganti penanggung jawab | ✅ | ✅ (sesuai kebijakan) | ❌ |
| Ubah status tiket | ✅ | ✅ | ❌ |
| Set due date (khusus Pengembangan Aplikasi) | ✅ | Hanya jika diizinkan (mis. Head IT) | ❌ |
| Kelola master (kategori, prioritas, dll) | ✅ | ❌ | ❌ |
| Konfirmasi penutupan (status Menunggu Konfirmasi) | ❌ | ❌ | ✅ (hanya pemohon tiket) |
| Komplain (kembalikan ke Dikerjakan) | ❌ | ❌ | ✅ (hanya pemohon tiket) |
| Ekspor CSV | ✅ | ✅ | ❌ |

Implementasi permission pakai **TicketPolicy** (Laravel Policy), dengan memeriksa `role` dan `dep_id`.

### 3.3 Model Penugasan (Semi Bebas)

Sistem menggunakan model **semi bebas (semi-open assignment)**:

1. **Tiket baru** masuk dengan status "Baru"
2. **Tiket boleh belum memiliki penanggung jawab** (`assignee_id` kosong / unassigned pool)
3. **Staff** dapat:
   - Mengambil tiket departemennya sendiri (assign ke diri sendiri)
4. **Admin / Head IT** dapat:
   - Menetapkan atau mengubah penugasan ke siapa saja
5. **Semua perubahan penugasan** tercatat dalam timeline tiket (komentar otomatis atau log)

**Alasan model ini dipilih:**
- Menghindari bottleneck di satu orang
- Memberikan fleksibilitas pada tim kecil
- Tetap menjaga akuntabilitas melalui satu primary assignee

---

## 4. Aturan Bisnis Penting

1. **Satu tiket = satu penanggung jawab (assignee).** Simpan di `tickets.assignee_id`. Tidak ada tabel penugasan banyak orang.
2. **Due date tiket kategori "Pengembangan Aplikasi"** hanya boleh di-set oleh user dengan wewenang (admin / Head IT). Validasi di backend (Form Request / Policy).
3. **Departemen tiket** (`tickets.dep_id`) menentukan ke mana tiket mengarah; biasanya mengikuti kategori (kategori punya `dep_id`). Filter "tiket departemen saya" = tiket yang `dep_id` = `auth()->user()->dep_id` (untuk staff).
4. **Tiket gabungan (IT + IPS):** Satu orang sebagai assignee (primary); rekan lain **tidak** disimpan di tabel penugasan, hanya bisa disebutkan di **komentar** atau fitur lanjutan nanti.
5. **User.staff** harus punya **dep_id** agar "tiket departemen saya" konsisten. User.pemohon boleh `dep_id` null (atau tetap isi dari Pegawai untuk tampilan).
6. **Tiket boleh tanpa penanggung jawab** (`assignee_id = null`) saat status "Baru". Tiket dalam kondisi ini berada dalam **"unassigned pool"** dan dapat diambil oleh staff sesuai departemennya.
7. **Kategori dengan `is_development = true`** diperlakukan sebagai tiket pengembangan/proyek dengan aturan berbeda:
   - Due date ditentukan oleh Head IT (bukan pemohon)
   - Tidak mengikuti SLA response/resolution seperti insiden
   - Dapat dilaporkan terpisah dari tiket support rutin
8. **Eskalasi tiket:** Tidak pakai kolom eskalasi khusus. Jika tiket stuck atau assignee tidak bisa menyelesaikan, lakukan **assign ulang** ke staff lain di departemen yang sama atau ke admin/Head IT.
9. **Konfirmasi penutupan:** Setelah status "Selesai", tiket masuk status "Menunggu Konfirmasi". Pemohon bisa konfirmasi (tutup) atau komplain (kembali ke Dikerjakan). Jika **3 hari tidak ada respons**, tiket **auto-close**. Teknisi juga bisa langsung menutup tiket jika diperlukan.
10. **Reopen tiket tidak diizinkan.** Jika masalah yang sama muncul lagi setelah tiket ditutup, **buat tiket baru** dan isi `related_ticket_id` dengan referensi ke tiket sebelumnya. Ini menjaga integritas data dan memudahkan analisa masalah berulang.
11. **Audit trail otomatis:** Setiap perubahan status, assignee, prioritas, dan aksi penting lainnya **tercatat otomatis** di tabel `ticket_activities`. Tidak perlu input manual.

---

## 5. Relasi Model (Ringkas)

- **User** → `dep_id` → **Departemen** (departemen.dep_id)  
- **User** → `simrs_nik` → **Pegawai** (data SIMRS)  
- **Pegawai** → `departemen` (dep_id) → **Departemen**  
- **Ticket** → requester_id, assignee_id → **User**  
- **Ticket** → dep_id → **Departemen**  
- **Ticket** → ticket_type_id, ticket_category_id, ticket_priority_id, ticket_status_id → master masing-masing  
- **TicketComment**, **TicketAttachment** → ticket_id, user_id → **Ticket**, **User**

---

## 6. Urutan Implementasi yang Disarankan

1. **Tabel & model**
   - Pastikan akses ke **departemen** (baca dari SIMRS atau model `Departemen`).
   - Migrasi: `ticket_types`, `ticket_categories` (dengan `dep_id`, `is_development`), `ticket_priorities`, `ticket_statuses`.
   - Migrasi: `tickets` (termasuk `dep_id`, `assignee_id`), `ticket_comments`, `ticket_attachments`.
   - Migrasi: tambah kolom **users**: `role`, `dep_id`.
   - Seeder: nilai awal tipe, status, prioritas, kategori contoh (IT & IPS).

2. **Auth & authorization**
   - Policy/Gate untuk tiket (lihat, buat, ubah, assign) berdasarkan `role` dan `dep_id`.
   - Validasi: hanya admin / Head IT yang bisa set `due_date` untuk kategori Pengembangan Aplikasi.

3. **CRUD tiket**
   - Buat, daftar, detail, ubah status, assign (satu user). Filter: "tiket saya", "tiket departemen saya".
   - Komentar & lampiran.

4. **SLA & due date**
   - Aturan SLA untuk insiden/support (response/resolution menit).
   - Due date pengembangan: input hanya untuk role tertentu; simpan di `tickets.due_date`.

5. **Notifikasi** (fase lanjut): tiket baru, penugasan, komentar.

---

## 7. Progress Implementasi

**Status:** Fase 1–3 - Core CRUD + Dashboard + Reporting  
**Update terakhir:** Februari 2025

### ✅ Yang Sudah Diimplementasikan

#### Database (13 Migrasi)
- [x] **Tabel Master:** `ticket_types`, `ticket_categories`, `ticket_subcategories`, `ticket_priorities`, `ticket_statuses`
- [x] **Tabel Utama:** `tickets`, `ticket_comments`, `ticket_attachments`, `ticket_activities`
- [x] **Perluasan Users:** Kolom `role`, `dep_id` ditambahkan ke tabel users
- [x] **Notifikasi:** Tabel `notifications` untuk database channel
- [x] **Seeder:** Data awal tipe (Insiden, Permintaan Layanan), prioritas (P1-P4), status (Baru, Ditugaskan, Dikerjakan, Selesai, Menunggu Konfirmasi, Ditutup, Dibatalkan), kategori IT & IPS

#### Backend (Laravel)
- [x] **10+ Model** dengan relasi lengkap:
  - `Ticket`, `TicketType`, `TicketCategory`, `TicketSubcategory`
  - `TicketPriority`, `TicketStatus`, `TicketComment`, `TicketAttachment`, `TicketActivity`
- [x] **TicketPolicy** — authorization terpusat (view, create, update, delete, assign, changeStatus, setDueDate, confirmClosure, comment, attach)
- [x] **DashboardController** — statistik tiket role-based (admin/staff/pemohon)
- [x] **TicketController** dengan CRUD lengkap:
  - `index()` - list tiket dengan filter role-based (admin: semua, staff: departemen, pemohon: sendiri)
  - `create()`, `store()` - form & simpan tiket baru
  - `show()` - detail tiket dengan komentar, aktivitas, lampiran
  - `edit()`, `update()` - ubah tiket
  - `destroy()` - hapus tiket (admin only)
  - `assignToSelf()` - staff ambil tiket untuk departemennya
  - `close()` - tutup tiket
  - `confirm()` - pemohon konfirmasi penutupan
  - `complain()` - pemohon komplain, tiket kembali ke Dikerjakan
  - `searchForLink()` - API pencarian tiket untuk related ticket selector
  - `export()` - ekspor CSV dengan filter
- [x] **TicketCommentController** untuk manajemen komentar
- [x] **TicketAttachmentController** untuk upload & hapus lampiran
- [x] **Form Requests:** `StoreTicketRequest`, `UpdateTicketRequest`, `StoreTicketCommentRequest`, `StoreTicketAttachmentRequest`
- [x] **Routes** di `web.php` dengan resource routes + custom routes

#### Alur Kerja & Status
- [x] **Selesai → Menunggu Konfirmasi:** Otomatis saat staff set status "Selesai"
- [x] **Konfirmasi:** Pemohon bisa konfirmasi (tutup) atau komplain (kembali ke Dikerjakan)
- [x] **Auto-close:** Command `tickets:auto-close` dijadwalkan daily (3 hari tanpa respons dari pemohon)

#### SLA & Due Date
- [x] **SLA Management:** Hitung response time & resolution time (accessor di model Ticket)
- [x] **Due Date:** Validasi Head IT untuk kategori Pengembangan Aplikasi (policy `setDueDate`)

#### Notifikasi
- [x] **TicketCreatedNotification** — email + database ke staff departemen
- [x] **TicketAssignedNotification** — email + database ke assignee
- [x] **TicketCommentNotification** — email + database ke requester & assignee (kecuali komentar internal)

#### Frontend (React + Inertia)
- [x] **Halaman Tiket:**
  - `resources/js/Pages/tickets/index.tsx` - daftar tiket dengan pagination & filter
  - `resources/js/Pages/tickets/show.tsx` - detail tiket dengan komentar, lampiran, tombol konfirmasi/komplain
  - `resources/js/Pages/tickets/create.tsx` - form buat tiket baru
  - `resources/js/Pages/tickets/edit.tsx` - form edit tiket
- [x] **TypeScript Types:** `resources/js/types/ticket.ts`
- [x] **Sidebar Menu:** Link "Tiket" ditambahkan

#### Testing (Pest)
- [x] **23 Feature Tests** di `tests/Feature/Ticketing/TicketTest.php`:
  - Index: admin lihat semua, staff lihat departemen, pemohon lihat sendiri, guest redirect
  - Create: tampilkan form, validasi, simpan tiket
  - Show: akses requester, akses admin, tolak pemohon lain
  - Update: ubah status, logging aktivitas
  - Assign: self-assign, tolak beda departemen, admin override
  - Close: staff tutup tiket
  - Comment: public, internal, force pemohon non-internal
  - Filter: by status, search by ticket number
  - Delete: admin only, tolak staff
- [x] **7 Factory** untuk testing:
  - `UserFactory` dengan states: `admin()`, `staff($depId)`, `pemohon()`
  - `TicketFactory` dengan states: `assigned()`, `ips()`, `it()`, `withStatus()`
  - `TicketTypeFactory`, `TicketCategoryFactory`, `TicketPriorityFactory`, `TicketStatusFactory`, `TicketCommentFactory`

#### Dashboard & Reporting (Fase 3)
- [x] **Dashboard:** statistik tiket (open, closed bulan ini, overdue, assigned to me), grafik per status, tiket terbaru, daftar overdue
- [x] **Export CSV:** ekspor tiket dengan filter (status, departemen, tanggal)
- [x] **Related Ticket:** UI pilih tiket terkait saat buat tiket baru (50 tiket terakhir)

### ⏳ Belum Diimplementasikan (Langkah Selanjutnya)

#### Prioritas Tinggi
- [x] **Laporan SLA:** grafik kepatuhan response/resolution time — `/reports/sla`

#### Prioritas Sedang
- [x] **Fitur Rekan:** kolaborator dari departemen lain (bukan primary assignee) — tabel `ticket_collaborators`, UI di detail tiket

#### Fase 2 (Master Plan)
- [x] **Tipe Problem & Permintaan Perubahan** — ditambahkan ke seeder (slug: problem, change_request)
- [x] **Tracking Vendor & Biaya:** UI untuk `ticket_vendor_costs` di detail tiket (tambah, hapus)
- [x] **Grup per departemen:** tabel `ticket_groups`, `ticket_group_members`; assign ke grup, filter "Pool grup saya", staff anggota grup bisa ambil tiket

---

## 9. Daftar Routes

| Method | URI | Controller | Keterangan |
|--------|-----|------------|------------|
| GET | `/dashboard` | DashboardController | Statistik tiket |
| GET | `/tickets` | TicketController@index | Daftar tiket |
| GET | `/tickets/create` | TicketController@create | Form buat tiket |
| POST | `/tickets` | TicketController@store | Simpan tiket |
| GET | `/tickets/{id}` | TicketController@show | Detail tiket |
| GET | `/tickets/{id}/edit` | TicketController@edit | Form edit tiket |
| PATCH/PUT | `/tickets/{id}` | TicketController@update | Update tiket |
| DELETE | `/tickets/{id}` | TicketController@destroy | Hapus tiket (admin) |
| POST | `/tickets/{id}/assign-self` | TicketController@assignToSelf | Ambil tiket |
| POST | `/tickets/{id}/close` | TicketController@close | Tutup tiket |
| POST | `/tickets/{id}/confirm` | TicketController@confirm | Konfirmasi (pemohon) |
| POST | `/tickets/{id}/complain` | TicketController@complain | Komplain (pemohon) |
| GET | `/tickets/search-for-link?q=` | TicketController@searchForLink | Cari tiket untuk related |
| GET | `/tickets/export?status=&department=&from=&to=` | TicketController@export | Ekspor CSV |
| GET | `/reports/sla?from=&to=&dep_id=` | SlaReportController | Laporan SLA (admin/staff) |
| POST | `/tickets/{id}/comments` | TicketCommentController@store | Tambah komentar |
| DELETE | `/tickets/{id}/comments/{id}` | TicketCommentController@destroy | Hapus komentar |
| POST | `/tickets/{id}/attachments` | TicketAttachmentController@store | Upload lampiran |
| DELETE | `/tickets/{id}/attachments/{id}` | TicketAttachmentController@destroy | Hapus lampiran |
| POST | `/tickets/{id}/collaborators` | TicketCollaboratorController@store | Tambah rekan |
| DELETE | `/tickets/{id}/collaborators/{id}` | TicketCollaboratorController@destroy | Hapus rekan |
| POST | `/tickets/{id}/vendor-costs` | TicketVendorCostController@store | Tambah biaya vendor |
| PATCH | `/tickets/{id}/vendor-costs/{id}` | TicketVendorCostController@update | Ubah biaya vendor |
| DELETE | `/tickets/{id}/vendor-costs/{id}` | TicketVendorCostController@destroy | Hapus biaya vendor |

---

## 10. Konfigurasi & Setup

**Storage (lampiran):**
```bash
php artisan storage:link
```
Lampiran disimpan di `storage/app/public/tickets/{ticket_id}/`. Max 10 MB. Format: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, gif, zip.

**Scheduler (auto-close):**
Command `tickets:auto-close` dijadwalkan daily di `routes/console.php`. Tambahkan ke cron:
```
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

**Notifikasi email:** Pastikan konfigurasi mail di `.env` (MAIL_*) untuk pengiriman email.

---

## 11. Struktur File yang Dibuat

```
app/
├── Console/Commands/
│   └── AutoCloseTicketsCommand.php
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   ├── SlaReportController.php
│   │   ├── TicketController.php
│   │   ├── TicketCommentController.php
│   │   ├── TicketAttachmentController.php
│   │   ├── TicketCollaboratorController.php
│   │   └── TicketVendorCostController.php
│   └── Requests/
│       ├── StoreTicketRequest.php
│       ├── UpdateTicketRequest.php
│       ├── StoreTicketCommentRequest.php
│       ├── StoreTicketAttachmentRequest.php
│       ├── StoreTicketVendorCostRequest.php
│       └── UpdateTicketVendorCostRequest.php
├── Models/
│   ├── Ticket.php
│   ├── TicketSlaRule.php
│   ├── TicketVendorCost.php
│   ├── TicketType.php
│   ├── TicketCategory.php
│   ├── TicketSubcategory.php
│   ├── TicketPriority.php
│   ├── TicketStatus.php
│   ├── TicketComment.php
│   ├── TicketAttachment.php
│   ├── TicketActivity.php
│   ├── TicketCollaborator.php
│   ├── TicketGroup.php
│   └── TicketGroupMember.php
├── Notifications/
│   ├── TicketCreatedNotification.php
│   ├── TicketAssignedNotification.php
│   └── TicketCommentNotification.php
└── Policies/
    └── TicketPolicy.php

database/
├── factories/
│   ├── TicketFactory.php
│   ├── TicketTypeFactory.php
│   ├── TicketCategoryFactory.php
│   ├── TicketPriorityFactory.php
│   ├── TicketStatusFactory.php
│   └── TicketCommentFactory.php
├── migrations/
│   ├── *_create_ticket_types_table.php
│   ├── *_create_ticket_categories_table.php
│   ├── *_create_ticket_subcategories_table.php
│   ├── *_create_ticket_priorities_table.php
│   ├── *_create_ticket_statuses_table.php
│   ├── *_create_tickets_table.php
│   ├── *_create_ticket_comments_table.php
│   ├── *_create_ticket_attachments_table.php
│   ├── *_create_ticket_activities_table.php
│   ├── *_create_ticket_collaborators_table.php
│   ├── *_create_ticket_groups_table.php
│   ├── *_create_ticket_group_members_table.php
│   ├── *_add_ticket_group_id_to_tickets_table.php
│   ├── *_add_ticketing_role_columns_to_users_table.php
│   ├── *_create_notifications_table.php
│   └── ...
└── seeders/
    └── TicketingSeeder.php

resources/js/
├── Pages/
│   ├── reports/
│   │   └── sla.tsx
│   └── tickets/
│       ├── index.tsx
│       ├── show.tsx
│       ├── create.tsx
│       └── edit.tsx
└── types/
    └── ticket.ts

routes/
└── console.php  # Schedule: tickets:auto-close daily

tests/Feature/Ticketing/
└── TicketTest.php
```

---

## 8. Backlog / Rencana Pengembangan

Catatan fitur yang direncanakan untuk fase lanjut:

### 8.1 Tagging / Pengelompokan Kasus ✅ (Implementasi)

**Tujuan:** Mendukung pembangunan **Knowledge Base**.

- Tiket bisa diberi **tag** (many-to-many) untuk pengelompokan kasus.
- **Struktur:** Tabel `ticket_tags` (id, name, slug, is_active) dan pivot `ticket_ticket_tag` (ticket_id, ticket_tag_id).
- Tag disediakan di master (seeder: printer-error, akses-simrs, monitor-putus, dll.). Pilih tag saat buat/edit tiket.
- Filter daftar tiket berdasarkan tag. Tag ditampilkan di detail tiket dan di daftar (badge).
- Tiket selesai dengan tag tertentu nanti dapat dipakai referensi Knowledge Base.

### 8.2 Biaya Sparepart (Perbaikan Sendiri) ✅ (Implementasi)

**Konsep:** Saat perbaikan dilakukan **secara internal** (oleh tim IT/IPS sendiri), biaya spare part dicatat terpisah dari biaya vendor.

**Perbedaan dengan Biaya Vendor:**

| Aspek | Biaya Vendor (TicketVendorCost) | Biaya Sparepart (TicketSparepartItem) |
|-------|---------------------------------|--------------------------------------|
| Skenario | Perbaikan dikirim ke vendor/luar | Perbaikan dilakukan sendiri (in-house) |
| Yang dicatat | vendor_name, estimated_cost, actual_cost, sparepart_notes, vendor_notes | nama_item, qty, harga_satuan, catatan |
| Tujuan | Tracking biaya outsourcing | Tracking biaya komponen untuk perbaikan internal |

**Implementasi:** Tabel `ticket_sparepart_items` (ticket_id, nama_item, qty, harga_satuan, catatan). Satu tiket bisa punya banyak baris. CRUD lewat `TicketSparepartItemController`; izin pakai `manageVendorCosts`. UI di detail tiket: card "Biaya Sparepart" dengan daftar item, total, form tambah, hapus.

---

### 8.3 Integrasi API dengan Sistem Kepegawaian ✅ (Implementasi)

**Kebutuhan:** Pelapor/pemohon **tidak perlu login** ke PortalSifast; mereka sudah login di aplikasi kepegawaian (login pakai NIK). Aplikasi kepegawaian memanggil PortalSifast untuk buat tiket / lihat tiket atas nama pegawai tersebut.

**Status:** ✅ **Sudah diimplementasikan.** API ticketing tersedia di `/api/tickets` dengan autentikasi Sanctum Bearer Token.

**Arsitektur yang diimplementasikan:**

1. **API terpisah** (`routes/api.php`) dengan prefix `/api/...` untuk konsumsi aplikasi kepegawaian.
2. **Autentikasi API:** Aplikasi kepegawaian memanggil API dengan **token** (Laravel Sanctum API token untuk “service account”, atau API key di header). Bukan login NIK per user—NIK dipakai hanya untuk **mengidentifikasi pelapor** di body/query.
3. **Identifikasi pelapor pakai NIK:**
   - Request bawa **NIK** di body (POST) atau query (GET).
   - PortalSifast cari **User** dengan `simrs_nik` = NIK.
   - **Jika belum ada:** bisa **auto-create** user (role `pemohon`, nama/email dari data pegawai yang dikirim) agar tiket punya `requester_id`. Alternatif: tolak dengan pesan “Pegawai belum terdaftar di PortalSifast, hubungi admin.”
   - Tiket dibuat dengan `requester_id` = user tersebut (struktur tiket tetap pakai `requester_id`, tidak diubah jadi NIK saja).

4. **Endpoint yang tersedia:**
   - `POST /api/tickets` — buat tiket (body: nik, title, description, ticket_type_id, ticket_priority_id, …). Server cari/create user by NIK, lalu create ticket.
   - `GET /api/tickets?nik=xxx` — daftar tiket milik NIK (requester).
   - `GET /api/tickets/{id}?nik=xxx` — detail tiket (hanya jika requester sesuai NIK).
   - `GET /api/health` — health check (tanpa auth).

5. **Controller:** `App\Http\Controllers\Api\ApiTicketController`
   - Method `store()`: Buat tiket baru, auto-create user jika belum ada.
   - Method `index()`: List tiket milik NIK.
   - Method `show()`: Detail tiket (dengan validasi requester).
   - Helper `findOrCreateUserByNik()`: Cari/buat user dari Pegawai SIMRS.

6. **Request Validation:** `App\Http\Requests\Api\StoreTicketApiRequest` (validasi sama dengan `StoreTicketRequest` + field `nik`).

7. **Dokumentasi:** Lihat `docs/API-TICKETING.md` untuk detail endpoint, contoh request, dan cara generate token.

**Ringkas:** Pelapor tetap diidentifikasi sebagai **User** di PortalSifast (via `simrs_nik` = NIK). Mereka tidak perlu login ke PortalSifast; aplikasi kepegawaian yang sudah tahu NIK-nya memanggil API dengan token service, dan PortalSifast memetakan NIK → User (atau membuat user dari Pegawai SIMRS) lalu mengisi `requester_id`. Setelah API ini ada, integrasi dari sisi kepegawaian tinggal panggil API dengan NIK + data tiket.

---

## 12. Referensi Dokumen Lain

- **`TICKETING-ITILv4-MASTER-PLAN.md`** — konteks lengkap, tujuan, fase, dan poin diskusi. Untuk mengubah keputusan di dokumen ini, sepakati dulu di tim dan update **kedua** dokumen (Master Plan + Referensi Teknis) agar tetap selaras.

---

*Dokumen ini membekukan keputusan teknis agar proyek tetap konsisten ketika diteruskan oleh programmer lain. Ubah hanya setelah disepakati tim.*
