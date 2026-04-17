# Request Backend – Panic Button & Alur Petugas

Dokumen ini merangkum request ke backend untuk fitur **panic button** dan **alur penjemputan petugas** (konfirmasi penjemputan, tracking live, sudah sampai, pilihan tujuan). Juga mencakup **push notification (FCM)** dan catatan **peta/navigasi**.

---

## ✅ Diterapkan di backend (ringkasan)

| Request | Status |
|--------|--------|
| **2.1** Response POST `officer/location` dengan `distance_to_target_meters` & `eta_minutes` | Sudah ada dari awal |
| **2.2** GET `operator/reports/{report_id}` – detail satu laporan | Ditambah: `GET /api/sifast/emergency/operator/reports/{report_id}` |
| **2.3** Rate limit POST `officer/location` ~5 detik aman | Throttle 20/min (`throttle:20,1`) |
| **3.1** Field tujuan: `destination_type`, `destination_name` (saat resolved) | Ditambah di DB + PATCH respond |
| **3.2** Status `arrived` | Konstanta `STATUS_ARRIVED` + validasi PATCH |
| **4** FCM: register device token | `POST /api/sifast/fcm/register` (body: `token`, `platform`) |
| **4** FCM: trigger notifikasi (laporan baru → operator; status update → pelapor) | `EmergencyFcmService`: trigger dipanggil; kirim ke FCM API belum (perlu credential FCM) |

---

## 1. API yang sudah dipakai (existing)

- **GET** `operator/reports` – list laporan untuk petugas (query: status, category, dll.)
- **PATCH** `operator/reports/{report_id}/respond` – body: `{ "status", "notes?", "assigned_team?" }`
- **POST** `officer/location` – body: `{ "latitude", "longitude", "report_id" }` (lokasi petugas dikirim setiap ~5 detik)

---

## 2. Request backend (prioritas)

### 2.1 Response POST `officer/location` – jarak & ETA

**Request:** Setiap response **POST** `officer/location` wajib mengembalikan:

- `distance_to_target_meters` – jarak dari posisi petugas ke lokasi laporan (meter)
- `eta_minutes` – estimasi waktu sampai (menit)

**Contoh response yang diharapkan:**

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

**Alasan:** Frontend layar tracking petugas menampilkan "~X km" dan "~Y menit" (seperti Gojek) tanpa hitung sendiri di client.

---

### 2.2 GET detail laporan untuk operator

**Request:** Endpoint **GET** detail satu laporan untuk operator, misalnya:

- **GET** `operator/reports/{report_id}`

**Response:** Satu objek laporan dengan field minimal sama seperti item di list (report_id, status, category, address, latitude, longitude, sender_name, sender_phone, created_at, waiting_minutes, dll.).

**Alasan:** Saat petugas membuka langsung URL detail/tracking (tanpa state dari list), frontend bisa refetch satu laporan by ID tanpa fetch seluruh list.

---

### 2.3 Rate limit POST `officer/location`

**Request:** Konfirmasi bahwa **POST** `officer/location` boleh dipanggil kira-kira **setiap 5 detik** per `report_id` (satu petugas, satu laporan aktif), tanpa di-block oleh rate limit.

**Alasan:** Tracking live dan pengiriman GPS berjalan setiap 5 detik; jika rate limit terlalu ketat, fitur bisa gagal.

---

## 3. Request backend (opsional)

### 3.1 Field tujuan akhir (bawa ke RS / rujuk)

**Request:** Saat laporan ditutup (status `resolved`), backend menyimpan tujuan akhir dalam bentuk terstruktur, misalnya:

- `destination_type`: enum `"rs_kita"` | `"rujuk"`
- `destination_name` atau `rujuk_ke`: string (opsional, untuk "rujuk ke mana")

Bisa ditambah di body **PATCH** `operator/reports/{report_id}/respond` (contoh: `destination_type`, `destination_name`) atau di tabel laporan.

**Contoh body PATCH (resolved + tujuan):**

```json
{
  "status": "resolved",
  "notes": "Pasien dibawa ke RS",
  "destination_type": "rs_kita"
}
```

atau untuk rujuk:

```json
{
  "status": "resolved",
  "notes": "Rujuk ke RS XYZ",
  "destination_type": "rujuk",
  "destination_name": "RS XYZ"
}
```

**Alasan:** Untuk pelaporan/audit dan tampilan "Pasien dibawa ke mana". Jika belum ada, frontend tetap mengirim via `notes` (mis. `"Bawa ke RS kita"` / `"Rujuk"`).

---

### 3.2 Status "sampai di lokasi" (arrived)

**Request (opsional):** Tambah status misalnya **`arrived`** = "petugas sudah sampai di lokasi pasien", sebelum pilihan bawa/rujuk dan sebelum `resolved`.

**Alasan:** Membedakan "sedang di jalan" (`in_progress`), "sudah sampai di lokasi" (`arrived`), dan "selesai" (`resolved`). Jika tidak ditambah, frontend tetap pakai `in_progress` + konfirmasi "Sudah sampai" lalu pilih tujuan → `resolved`.

---

## 4. Push notification (FCM)

**Konteks:** Untuk panic button, notifikasi wajib bisa dikirim (mis. ke petugas saat ada laporan baru, ke korban saat status berubah).

**Pembagian peran:**

- **Backend:** Menyimpan FCM device token per user/device (dari frontend). Memutuskan **kapan** mengirim notifikasi dan memanggil **FCM API** untuk mengirim.
- **Frontend:** Meminta izin notifikasi, mendapatkan FCM token, mengirim token ke backend (saat login atau endpoint registrasi device). Menangani notifikasi yang diterima (foreground/background) dan melakukan navigasi/refresh jika perlu.

**Request ke backend:**

1. **Endpoint registrasi device token**
   - Contoh: **POST** `user/device-token` atau `fcm/register`
   - Body: `{ "token": "<fcm_device_token>", "platform": "android" | "ios" | "web" }`
   - Backend menyimpan token (terkait user yang login). Update token jika berubah.

2. **Trigger notifikasi (backend memanggil FCM)**
   - **Laporan darurat baru** → kirim push ke **petugas/operator** (semua atau sesuai wilayah).
   - **Status laporan berubah** (mis. direspons, dalam perjalanan, selesai) → kirim push ke **korban** (pelapor) untuk laporan tersebut.
   - Payload bisa berisi `report_id`, `status`, `title`, `body` agar frontend bisa membuka halaman yang sesuai.

3. **Contoh payload notifikasi (saran)**

   Untuk petugas (laporan baru):

   ```json
   {
     "title": "Laporan darurat baru",
     "body": "Kecelakaan lalu lintas - Jl. Veteran",
     "data": {
       "type": "new_report",
       "report_id": "RPT-2024-0001"
     }
   }
   ```

   Untuk korban (status update):

   ```json
   {
     "title": "Update laporan darurat",
     "body": "Petugas dalam perjalanan ke lokasi Anda",
     "data": {
       "type": "status_updated",
       "report_id": "RPT-2024-0001",
       "status": "in_progress"
     }
   }
   ```

**Catatan:** Frontend akan mengimplementasi pengiriman token dan penanganan notifikasi masuk; backend yang mengimplementasi penyimpanan token dan pengiriman via FCM.

---

## 5. Peta & navigasi (catatan, bukan request backend)

- **Peta in-app:** Aplikasi memakai **Leaflet + OpenStreetMap (OSM)** untuk menampilkan peta dan marker. Ini **gratis**, tidak memakai Google Maps API.
- **Navigasi turn-by-turn:** Tombol "Buka di Maps" membuka aplikasi Google Maps / Maps di perangkat user via URL (deep link). Tidak ada pemanggilan Google Maps API dari server/app, sehingga **tidak ada biaya** dari sisi aplikasi.
- **Kesimpulan:** Tidak ada request khusus ke backend untuk peta. Untuk menghindari biaya, disarankan tetap memakai OSM + link ke aplikasi Maps; Google Maps API hanya diperlukan jika nanti ada kebutuhan fitur berbayar (mis. tiles atau Directions API di dalam app).
