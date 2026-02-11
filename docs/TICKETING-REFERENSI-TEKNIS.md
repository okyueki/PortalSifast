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
| **Tiket gabungan (IT + IPS)** | Satu user sebagai primary; rekan dari departemen lain **dicatat di komentar** (atau fitur rekan di fase lanjut). |
| **Due date tiket pengembangan** | **Hanya Head IT** (atau role yang ditentukan) yang boleh menetapkan due date. Pemohon tidak mengisi due date untuk kategori Pengembangan Aplikasi. |

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
| `name` / `nama` | string | Baru, Ditugaskan, Dikerjakan, Tertunda, Selesai, Ditutup |
| `slug` atau `code` | string | Opsional |
| `created_at`, `updated_at` | timestamp | |

---

### 2.4 Tabel Transaksi Tiket

**`tickets`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigint PK | |
| `ticket_type_id` | bigint FK | |
| `ticket_category_id` | bigint FK | |
| `ticket_subcategory_id` | bigint FK, nullable | Opsional |
| `ticket_priority_id` | bigint FK | |
| `ticket_status_id` | bigint FK | |
| `dep_id` | string (FK) | Departemen penanggung jawab (dari `departemen.dep_id`). |
| `requester_id` | bigint FK | `users.id` — pemohon. |
| **`assignee_id`** | bigint FK, nullable | **Satu penanggung jawab utama (primary).** `users.id`. |
| `title` | string | Judul tiket |
| `description` | text, nullable | |
| `due_date` | timestamp, nullable | Untuk kategori Pengembangan Aplikasi: di-set oleh Head IT. |
| `response_due_at` | timestamp, nullable | Opsional: batas waktu tanggap (SLA) |
| `resolved_at` | timestamp, nullable | Opsional: waktu selesai |
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
| `path` / `disk_path` | string | Path di storage |
| `mime_type` | string, nullable | |
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

### 2.6 Tabel yang **Tidak** Dipakai (Fase 1)

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

Implementasi permission bisa pakai Laravel Policy atau Gate, dengan memeriksa `role` dan `dep_id`.

---

## 4. Aturan Bisnis Penting

1. **Satu tiket = satu penanggung jawab (assignee).** Simpan di `tickets.assignee_id`. Tidak ada tabel penugasan banyak orang.
2. **Due date tiket kategori "Pengembangan Aplikasi"** hanya boleh di-set oleh user dengan wewenang (admin / Head IT). Validasi di backend (Form Request / Policy).
3. **Departemen tiket** (`tickets.dep_id`) menentukan ke mana tiket mengarah; biasanya mengikuti kategori (kategori punya `dep_id`). Filter "tiket departemen saya" = tiket yang `dep_id` = `auth()->user()->dep_id` (untuk staff).
4. **Tiket gabungan (IT + IPS):** Satu orang sebagai assignee (primary); rekan lain **tidak** disimpan di tabel penugasan, hanya bisa disebutkan di **komentar** atau fitur lanjutan nanti.
5. **User.staff** harus punya **dep_id** agar "tiket departemen saya" konsisten. User.pemohon boleh `dep_id` null (atau tetap isi dari Pegawai untuk tampilan).

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

## 7. Referensi Dokumen Lain

- **`TICKETING-ITILv4-MASTER-PLAN.md`** — konteks lengkap, tujuan, fase, dan poin diskusi. Untuk mengubah keputusan di dokumen ini, sepakati dulu di tim dan update **kedua** dokumen (Master Plan + Referensi Teknis) agar tetap selaras.

---

*Dokumen ini membekukan keputusan teknis agar proyek tetap konsisten ketika diteruskan oleh programmer lain. Ubah hanya setelah disepakati tim.*
