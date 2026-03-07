# Checklist WebSocket (Reverb) di Production (aaPanel)

Dokumen ini untuk **self-assessment** konfigurasi WebSocket/Laravel Reverb di lingkungan production (aaPanel, Nginx, Supervisor).

---

## 1. Yang Sudah Benar (dari informasi Anda)

| Item | Status | Keterangan |
|------|--------|------------|
| **BROADCAST_CONNECTION** | ✅ | `reverb` di .env |
| **Queue worker** | ✅ | Supervisor menjalankan `php artisan queue:work` — event broadcast (mis. `UserOnlineEvent`) diproses (RUNNING → DONE) |
| **Reverb process** | ✅ | Supervisor menjalankan `php artisan reverb:start` — log: "Starting server on 0.0.0.0:8082" |
| **REVERB_* & VITE_REVERB_*** | ✅ | Host/port/scheme untuk server (127.0.0.1:8082) dan client (domain:443, https) sudah dibedakan |
| **Config dari Laravel** | ✅ | `app.blade.php` inject `window.REVERB_CONFIG` dari `client_host` / `client_port` / `client_scheme` sehingga browser pakai domain + 443 + https |
| **Echo + auth** | ✅ | `echo.js` pakai `REVERB_CONFIG` jika ada; `authEndpoint: '/broadcasting/auth'`; `Broadcast::routes()` dengan middleware web + auth |
| **Halaman cek** | ✅ | `/settings/websocket-status` + chat untuk uji realtime |

---

## 2. Yang Wajib Dicek di Production

### 2.1 Reverse proxy WebSocket (paling sering jadi penyebab putus)

**Masalah:** Reverb listen di **127.0.0.1:8082**. Browser **tidak bisa** akses 127.0.0.1; browser hanya bisa akses lewat **domain yang sama** (mis. `wss://portalsifast.rsaisyiyahsitifatimah.com`).

**Solusi:** Nginx (atau proxy di aaPanel) harus **meneruskan** koneksi WebSocket ke `127.0.0.1:8082`.

Contoh konfigurasi Nginx untuk satu server block (HTTPS):

```nginx
server {
    listen 443 ssl;
    server_name portalsifast.rsaisyiyahsitifatimah.com;
    # ... ssl_certificate, root, php, dll ...

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Proxy WebSocket ke Reverb (wajib untuk status "Terhubung")
    location /app/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header X-Pusher-Protocol "7";
        proxy_read_timeout 86400;
        proxy_pass http://127.0.0.1:8082;
    }
}
```

- Path `/app/` dipakai oleh Pusher protocol (Reverb kompatibel). Jangan diubah kecuali Anda ubah juga di sisi Reverb.
- Setelah ubah config Nginx: `nginx -t` lalu reload (aaPanel: Nginx → Reload).

**Cek:** Buka `/settings/websocket-status`. Jika status **"Terhubung"**, proxy kemungkinan sudah benar. Jika **"Terputus" / "Server tidak tersedia"**, langkah pertama: pastikan block `location /app/` ada dan reload Nginx.

---

### 2.2 Firewall

- Port **8082** tidak perlu dibuka ke internet jika hanya Nginx yang proxy ke 127.0.0.1:8082.
- Yang harus bisa diakses dari luar: **443** (HTTPS) saja.

---

### 2.3 .env (ringkasan)

| Variabel | Pemakaian | Nilai contoh Anda |
|----------|-----------|--------------------|
| REVERB_HOST | Backend + Reverb server (koneksi Laravel → Reverb) | 127.0.0.1 |
| REVERB_PORT | Port Reverb listen | 8082 |
| REVERB_CLIENT_HOST | Host yang dipakai **browser** | portalsifast.rsaisyiyahsitifatimah.com |
| REVERB_CLIENT_PORT | Port di **browser** (biasanya 443 untuk HTTPS) | 443 |
| REVERB_CLIENT_SCHEME | Scheme di browser | https |

Setelah ubah .env: restart Supervisor (queue + reverb) dan **tidak perlu** `npm run build` untuk Reverb karena config di-inject dari Laravel lewat `REVERB_CONFIG`.

---

### 2.4 Broadcasting auth (private/presence channel)

- Route: `POST /broadcasting/auth` (middleware `web`, `auth`).
- Pastikan pengguna sudah **login** saat buka halaman yang pakai Echo (chat, presence). Kalau belum login, channel private/presence bisa 403.

---

### 2.5 CORS

- Reverb `allowed_origins` di `config/reverb.php` saat ini `['*']`. Untuk production bisa disempitkan ke domain Anda jika ingin.

---

## 3. Urutan Cek Cepat

1. **Supervisor:** queue:work dan reverb:start keduanya **Running**, log Reverb ada "Starting server on 0.0.0.0:8082".
2. **Nginx:** Ada `location /app/` yang proxy ke `http://127.0.0.1:8082` dengan header Upgrade/Connection; Nginx di-reload.
3. **Browser:** Buka `https://portalsifast.rsaisyiyahsitifatimah.com/settings/websocket-status` → status **"Terhubung"**.
4. **Chat:** Buka chat, kirim pesan dari tab lain (atau user lain) → pesan muncul realtime tanpa refresh.

---

## 4. Kesimpulan Self-Assessment

- **Backend (queue + Reverb process):** dari log yang Anda kirim, sudah berjalan.
- **Titik kritis production:** **reverse proxy Nginx** untuk path `/app/` ke `127.0.0.1:8082`. Tanpa ini, browser tidak akan pernah "Terhubung" meskipun Reverb dan queue jalan.
- Setelah proxy benar, halaman **Status WebSocket** dan **chat** bisa dipakai untuk memastikan realtime berjalan.

Jika setelah menambah proxy status tetap "Terputus", langkah selanjutnya: cek DevTools → Network (filter WS) dan Console untuk error WebSocket atau 4xx/5xx pada request ke `/app/` atau `/broadcasting/auth`.
