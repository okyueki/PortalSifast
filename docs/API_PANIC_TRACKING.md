# API Panic Button & Emergency Tracking - PortalSifast

**Versi:** 6.0
**Base URL:** `https://portalsifast.rsaisyiyahsitifatimah.com/api`
**Format:** JSON
**Auth:** Bearer Token (Laravel Sanctum)

**Update Terakhir:** Mei 2026

---

## FILOSOFI: "SEMUA BISA MENJADI PENOLONG"

```
PRIORITAS #1: FAST RESPONSE
PRIORITAS #2: FAST RESPONSE
PRIORITAS #3: FAST RESPONSE
```

**Tidak ada auto-assign.** Semua staff online mendapat notifikasi, siapa saja bisa decide untuk ambil tugas.

---

## 🔒 Reliability & Scalability

### Built-in Features:
| Feature | Keterangan |
|---------|------------|
| **Pessimistic Locking** | Mencegah race condition saat 2 staff accept bersamaan |
| **Queue + Retry** | FCM dikirim via queue dengan retry 3x jika gagal |
| **Auto-escalation** | Reminder otomatis tiap 2/5/10 menit jika belum dihandle |
| **Audit Log** | Semua action dicatat untuk accountability |

---

## 📡 Endpoint Quick Reference

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/sifast/emergency/reports` | Kirim panic button |
| POST | `/api/sifast/emergency/reports/{id}/accept` | Staff accept tugas |
| PATCH | `/api/sifast/emergency/operator/reports/{id}/respond` | Update status |
| POST | `/api/sifast/officer/location` | Kirim lokasi tracking |
| GET | `/api/sifast/emergency/dashboard` | Dashboard admin |
| GET | `/panic-staff` | Halaman staff mobile |

---

## 1. Kirim Laporan Darurat (Panic Button)

**POST** `/api/sifast/emergency/reports`

### Request Body
```json
{
  "nik": "03.09.07.1998",
  "latitude": -7.2651234,
  "longitude": 112.7485634,
  "address": "Jl. Raya Pondok Indah",
  "category": "kecelakaan_lalu_lintas",
  "sender_name": "Ahmad Fauzi",
  "sender_phone": "081234567890"
}
```

### Kategori Valid
| Value | Label |
|-------|-------|
| `kecelakaan_lalu_lintas` | Kecelakaan Lalu Lintas |
| `ibu_hamil` | Ibu Hamil (darurat persalinan) |
| `serangan_jantung` | Serangan Jantung |
| `serangan_stroke` | Serangan Stroke |
| `home_care` | Request Home Care |
| `ambulance` | Request Ambulance |

### Response Success (201)
```json
{
  "success": true,
  "message": "Laporan berhasil diterima",
  "data": {
    "report_id": "EMG-2026-00001",
    "status": "pending",
    "created_at": "2026-05-18T10:00:00+07:00"
  }
}
```

### Efek Samping
- FCM broadcast ke SEMUA staff (via queue, retry 3x)
- WebSocket event `EmergencyReportCreated` ke Command Center
- Audit log entry dibuat

---

## 2. Accept Tugas Panic (Staff Mobile)

**POST** `/api/sifast/emergency/reports/{report_id}/accept`

Staff yang accept akan di-assign ke laporan tersebut.

### Request
- Auth: Bearer Token (officer/staff login)
- Body: kosong (ID petugas diambil dari token)

### Response Success (200)
```json
{
  "success": true,
  "message": "Tugas panic berhasil di-accept",
  "data": {
    "report_id": "EMG-2026-00001",
    "status": "responded",
    "responded_at": "2026-05-18T10:01:00+07:00",
    "assigned_officer": {
      "id": 5,
      "name": "Ahmad Fauzi",
      "phone": "081298765432"
    },
    "start_tracking_url": "/api/sifast/officer/location"
  }
}
```

### Response Conflict (409) - Sudah diambil orang lain
```json
{
  "success": false,
  "message": "Laporan sudah diambil oleh petugas lain: Siti Aminah",
  "error_code": "ALREADY_TAKEN"
}
```

### Response Error (422) - Status bukan pending
```json
{
  "success": false,
  "message": "Laporan tidak bisa di-accept (status: responded)",
  "error_code": "STATUS_INVALID"
}
```

### Technical Details
- Menggunakan **pessimistic locking** (SELECT FOR UPDATE) untuk mencegah race condition
- Jika 2 staff klik accept bersamaan, yang pertama dapat lock menang
- Yang kedua akan dapat error 409

---

## 3. Halaman Staff Mobile (Web)

**GET** `/panic-staff`

Halaman web untuk staff terima panic button. Bisa diakses dari browser.

### Fitur
- Tampilkan semua laporan `pending` yang belum di-assign
- WebSocket real-time untuk panic baru masuk
- Alarm suara saat panic masuk
- Tombol **ACCEPT** untuk ambil tugas
- Tombol **Buka di Maps** untuk navigasi

### Auth
Menggunakan session login staff/admin (Laravel standard auth).

---

## 4. Update Status Laporan

**PATCH** `/api/sifast/emergency/operator/reports/{report_id}/respond`

### Request Body
```json
{
  "status": "in_progress",
  "notes": "Sedang dalam perjalanan ke lokasi"
}
```

### Status Values
| Status | Keterangan |
|--------|------------|
| `responded` | Sudah di-accept (auto dari accept endpoint) |
| `in_progress` | Sedang di jalan |
| `arrived` | Sudah sampai di lokasi |
| `resolved` | Selesai |

### Contoh: Selesai dengan tujuan
```json
{
  "status": "resolved",
  "notes": "Pasien ditangani dan dibawa ke IGD",
  "destination_type": "rs_kita"
}
```

### destination_type Values
| Value | Keterangan |
|-------|------------|
| `rs_kita` | Dibawa ke RS kita |
| `rujuk` | Dirujuk ke RS lain |

---

## 5. Kirim Lokasi Petugas (GPS Tracking)

**POST** `/api/sifast/officer/location`

Petugas kirim lokasi setiap ~5 detik saat dalam perjalanan.

### Request Body
```json
{
  "report_id": "EMG-2026-00001",
  "latitude": -7.2700,
  "longitude": 112.7500,
  "speed_kmh": 42,
  "heading": 90
}
```

### Response
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

### Rate Limit
- **20 requests/menit** (cukup untuk kirim tiap 3 detik)

---

## 6. Command Center Dashboard

**GET** `/api/sifast/emergency/dashboard`

### Response
```json
{
  "success": true,
  "data": {
    "reports": [...],
    "stats": {
      "by_status": {
        "pending": 2,
        "responded": 1,
        "in_progress": 3,
        "arrived": 1
      },
      "total_active": 7,
      "long_waiting": 1,
      "avg_response_time": 45,
      "staff_online": 12,
      "today": {
        "total": 15,
        "resolved": 8
      }
    }
  }
}
```

---

## 7. FCM Push Notification

### Register Token
**POST** `/api/sifast/fcm/register`

```json
{
  "token": "fcm_device_token_string",
  "platform": "android"
}
```

### Panic Broadcast (ke semua staff)
```json
{
  "title": "🚨 PANIC BUTTON!",
  "body": "Kecelakaan lalu lintas\nJl. Raya Pondok Indah",
  "data": {
    "type": "new_panic",
    "report_id": "EMG-2026-00001",
    "latitude": "-7.2651234",
    "longitude": "112.7485634",
    "category": "kecelakaan_lalu_lintas",
    "action": "accept"
  }
}
```

### Retry Policy
- **Tries:** 3
- **Backoff:** 10s, 30s, 60s
- **Queue:** `fcm`
- **Timeout:** 60 detik

---

## 8. Auto-escalation System

Panic yang belum dihandle akan otomatis di-remind ke staff.

### Timeline
| Waiting Time | Action |
|--------------|--------|
| T+0 | Initial broadcast |
| T+2 menit | Reminder normal |
| T+5 menit | Urgent reminder + alert admin |
| T+10 menit | Escalation (broadcast ulang + admin alert) |

### Console Command
```bash
php artisan panic:check-pending
```

Dijalankan via scheduler setiap 2 menit:
```php
Schedule::command('panic:check-pending')->everyTwoMinutes();
```

---

## 9. Audit Log

Semua action pada panic dicatat.

### Endpoint (Future)
```
GET /api/sifast/emergency/reports/{id}/audit
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "action": "accept",
      "user_name": "Ahmad Fauzi",
      "data": {
        "previous_status": "pending",
        "new_status": "responded"
      },
      "created_at": "2026-05-18T10:01:00+07:00"
    },
    {
      "action": "in_progress",
      "user_name": "Ahmad Fauzi",
      "data": {
        "notes": "Sedang dalam perjalanan"
      },
      "created_at": "2026-05-18T10:02:00+07:00"
    }
  ]
}
```

---

## 10. WebSocket Events

Channel: `emergency.command-center` (private channel untuk admin/staff)

### EmergencyReportCreated
```json
{
  "report_id": "EMG-2026-00001",
  "category": "kecelakaan_lalu_lintas",
  "latitude": -7.2651234,
  "longitude": 112.7485634,
  "address": "Jl. Raya Pondok Indah",
  "sender_name": "Budi Santoso",
  "status": "pending",
  "created_at": "2026-05-18T10:00:00+07:00"
}
```

### EmergencyReportStatusChanged
```json
{
  "report_id": "EMG-2026-00001",
  "previous_status": "pending",
  "status": "responded",
  "operator_name": "Ahmad Fauzi",
  "responded_at": "2026-05-18T10:01:00+07:00"
}
```

---

## 11. Peta & Navigasi

- **Peta:** Leaflet + OpenStreetMap (gratis)
- **Navigasi:** Tombol "Buka di Maps" → deep link Google Maps
- Tidak perlu Google Maps API key

---

## 🚨 Error Codes

| HTTP | Error Code | Message | Penjelasan |
|------|------------|---------|------------|
| 409 | `ALREADY_TAKEN` | "Laporan sudah diambil..." | Conflict - orang lain sudah accept |
| 422 | `STATUS_INVALID` | "Laporan tidak bisa di-accept" | Status bukan pending |
| 404 | - | "Laporan tidak ditemukan" | Report ID salah |

---

## 📜 Changelog

### v6.0 (Mei 2026) - Reliability & Scalability
- ✅ Pessimistic locking untuk accept (race condition prevention)
- ✅ Queue + Retry untuk FCM (retry 3x dengan backoff)
- ✅ Auto-escalation reminder (tiap 2/5/10 menit)
- ✅ Audit log untuk semua action

### v5.0 (Mei 2026) - Staff Mobile Page
- ✅ Halaman `/panic-staff` untuk accept dari web
- ✅ WebSocket real-time untuk panic baru
- ✅ Alarm suara saat panic masuk

### v4.0 (Mei 2026) - SEMUA BISA MENJADI PENOLONG
- ✅ Hapus auto-assign
- ✅ Broadcast ke SEMUA staff
- ✅ Accept endpoint untuk siapa saja

### v3.0 (Mei 2026)
- ✅ Auto-assign logic
- ✅ Quick call + alarm sound

### v2.0 (Mei 2026)
- ✅ Status arrived + destination
- ✅ Command Center Dashboard

### v1.0 (Februari 2026)
- Initial release