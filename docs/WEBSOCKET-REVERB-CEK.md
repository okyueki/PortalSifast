# WebSocket vs Laravel Reverb & Cara Cek Aktif/Tidak

## WebSocket dan Laravel Reverb itu sama?

**Tidak persis sama.**

| | WebSocket | Laravel Reverb |
|---|-----------|----------------|
| **Apa itu** | **Protokol** (teknologi) untuk koneksi real-time dua arah antara browser dan server | **Server WebSocket** resmi Laravel — salah satu *implementasi* WebSocket |
| **Analogi** | Seperti "HTTP" (aturan komunikasi) | Seperti "Apache/Nginx" (server yang menjalankan aturan itu) |

Jadi: **WebSocket** = cara komunikasinya; **Laravel Reverb** = server yang menyediakan WebSocket untuk aplikasi Laravel. Reverb adalah *bagian dari* ekosistem WebSocket di Laravel.

Di project ini, **real-time (user presence, dll.) pakai Reverb** sebagai server WebSocket. Kalau Reverb tidak jalan, koneksi WebSocket tidak akan nyambung.

---

## Cara tau WebSocket (Reverb) aktif atau tidak

### 1. Cek dari server (Reverb harus jalan)

Reverb harus dijalankan sebagai proses terpisah:

```bash
php artisan reverb:start --host=0.0.0.0 --port=8080
```

**Cek apakah proses Reverb jalan:**

- **Windows (PowerShell):**
  ```powershell
  Get-Process -Name php -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*reverb*" }
  ```
  Atau buka Task Manager → cek ada proses `php` yang menjalankan `reverb:start`.

- **Port 8080 sedang dipakai (Windows):**
  ```powershell
  netstat -ano | findstr :8080
  ```
  Kalau ada baris `LISTENING` di port 8080, kemungkinan Reverb (atau app lain) sedang pakai port itu.

- **Langsung tes koneksi ke port (PowerShell):**
  ```powershell
  Test-NetConnection -ComputerName 127.0.0.1 -Port 8080
  ```
  `TcpTestSucceeded : True` → port 8080 terbuka (biasanya Reverb).

### 2. Cek dari browser (frontend)

Frontend pakai **Laravel Echo** + **Pusher JS** yang connect ke Reverb. Kalau Reverb mati, di console browser biasanya muncul error koneksi WebSocket (seperti yang kamu lihat: `WebSocket connection to 'ws://...' failed`).

**Cara cek di kode (opsional):**  
Setelah Echo connect, state koneksi bisa dipantau lewat Pusher (Echo pakai Pusher protocol). Contoh di `resources/js/echo.js` atau di komponen yang pakai Echo:

```javascript
// Setelah Echo connect, kita bisa cek state (Pusher)
if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
    const pusher = window.Echo.connector.pusher;
    console.log('WebSocket state:', pusher.connection.state); // connected, disconnected, connecting, unavailable
    pusher.connection.bind('state_change', (states) => {
        console.log('Reverb/WebSocket:', states.current);
    });
}
```

- **`connected`** → WebSocket (Reverb) aktif.
- **`disconnected` / `unavailable` / `failed`** → WebSocket tidak aktif (Reverb mati atau tidak terjangkau).

### 3. Ringkasan checklist

| Cek | Cara |
|-----|------|
| Reverb proses jalan | Terminal: jalankan `php artisan reverb:start` dan biarkan jalan; atau cek proses `php` + port 8080 |
| Port 8080 listen | `netstat -ano \| findstr :8080` (Windows) atau `ss -tlnp \| grep 8080` (Linux) |
| Env & config | `.env`: `BROADCAST_CONNECTION=reverb`. Frontend: `VITE_REVERB_APP_HOST`, `VITE_REVERB_APP_PORT` (default 8080) |
| Di browser | Console: error WebSocket = biasanya Reverb mati atau salah host/port. State Echo/Pusher = `connected` artinya aktif |

Kalau **Reverb tidak dijalankan** (`php artisan reverb:start` tidak jalan), WebSocket **tidak akan pernah aktif**, meskipun config sudah benar.

---

## Error umum di console

### 1. `WebSocket connection to 'ws://192.168.10.57:8080/...' failed`

**Penyebab:** Browser mencoba koneksi ke server Reverb di port 8080, tapi tidak ada yang listen (Reverb tidak jalan atau tidak terjangkau).

**Solusi:**

- **Pakai fitur real-time (presence, chat live):** jalankan Reverb di terminal dan biarkan jalan:
  ```bash
  php artisan reverb:start --host=0.0.0.0 --port=8080
  ```
- **Tidak pakai real-time:** error ini tidak memengaruhi fitur lain. Bisa diabaikan, atau nonaktifkan broadcast ke Reverb dengan mengubah `.env`:
  ```env
  BROADCAST_CONNECTION=log
  ```
  Lalu build ulang (`npm run build`). Halaman yang pakai Echo akan fallback (tanpa update real-time).

### 2. `api/work-notes` (atau API lain) → **401 Unauthorized**

**Penyebab:** Request dari SPA (mis. `http://192.168.10.57:8000`) ke `/api/...` tidak dianggap “stateful” oleh Sanctum, sehingga session cookie tidak dipakai dan user dianggap belum login.

**Solusi:**

- Pastikan **host yang dipakai buka aplikasi** masuk daftar stateful Sanctum. Jika akses pakai IP (mis. `http://192.168.10.57:8000`), set di `.env`:
  ```env
  APP_URL=http://192.168.10.57:8000
  ```
  Config `config/sanctum.php` akan otomatis menambah host (dan host:port) dari `APP_URL` ke stateful domains jika `SANCTUM_STATEFUL_DOMAINS` tidak diset.
- Atau set manual:
  ```env
  SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,192.168.10.57,192.168.10.57:8000
  ```
- Setelah ubah `.env`, restart server PHP (`php artisan serve` atau web server).
