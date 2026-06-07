# Panduan Slip Gaji — Mobile App (Frontend)

Dokumen ini menjelaskan cara menampilkan slip gaji di **mobile app** agar **persis selaras** dengan tampilan web PortalSifast (`/payroll/{id}` dan `/payroll/{id}/print`).

> **Prinsip utama:** Backend sudah menghitung total dan menyusun struktur slip. Mobile **hanya render**, jangan hitung ulang angka di frontend.

---

## 1. Endpoint API

| Aksi | Method | URL |
|------|--------|-----|
| Daftar gaji | `GET` | `/api/sifast/payroll?nik={nik}&page=1&per_page=12` |
| Detail slip | `GET` | `/api/sifast/payroll/{id}` |

**Header wajib:**
```
Authorization: Bearer {token}
Accept: application/json
```

**NIK pegawai** (sama pola dengan modul tiket):
- Query: `?nik=76.01.08.2012` atau `?simrs_nik=...`
- Atau header: `X-Sifast-Nik: 76.01.08.2012`

**Catatan publish:** Hanya data dengan `status: "published"` yang muncul di API. Data `draft` mengembalikan `403`.

Integrasi lengkap: lihat [api-documentation.md](./api-documentation.md) bagian Payroll.

---

## 2. Response — Apa yang Dipakai Mobile

### 2.1 Halaman daftar (list)

Gunakan field ringkasan dari setiap item di `data[]`:

```json
{
  "id": 123,
  "period_label": "April 2026",
  "employee_name": "Nama Pegawai",
  "unit": "IT",
  "jumlah_gaji": 15293330,
  "jumlah_tunjangan": 13534281,
  "jumlah_potongan": 1219815,
  "gaji_bersih": 6335123,
  "status": "published"
}
```

**Tampilan kartu list (saran):**
- Judul: `{period_label}`
- Subtitle: `{unit}`
- Angka utama: **`gaji_bersih`** (Gaji Diterima)
- Opsional: `jumlah_gaji` sebagai info sekunder

---

### 2.2 Halaman detail slip

Response utama ada di `data`:

```json
{
  "data": {
    "id": 123,
    "period_label": "April 2026",
    "employee_name": "Nama Pegawai",
    "simrs_nik": "76.01.08.2012",
    "unit": "IT",
    "npwp": "...",
    "ref_no": 14,
    "terbilang": "Enam Juta ... Rupiah",

    "totals": {
      "kehadiran": 1759050,
      "subtotal_tunjangan": 12294262,
      "subtotal_lain_lain": 1240019,
      "jumlah_tunjangan": 13534281,
      "jumlah_gaji": 15293330,
      "jumlah_potongan": 1219815,
      "gaji_bersih": 6335123,
      "from_csv": {
        "jumlah_tunjangan": false,
        "jumlah_gaji": true,
        "jumlah_potongan": true,
        "gaji_bersih": true
      }
    },

    "slip_sections": [
      {
        "number": "1",
        "title": "Kehadiran",
        "lines": [
          { "key": "gaji_pokok", "label": "Kehadiran", "amount": 1759050 }
        ]
      },
      {
        "number": "2",
        "title": "Tunjangan",
        "lines": [
          { "key": "keluarga", "label": "Keluarga", "amount": 263858 },
          { "key": "tunj_masa_kerja", "label": "Masa Kerja", "amount": 1197489 }
        ]
      },
      {
        "number": "3",
        "title": "Lain-Lain",
        "lines": [
          { "key": "jkn", "label": "Remunerasi JKN Maret 2026", "amount": 853882 }
        ]
      },
      {
        "number": "4",
        "title": "Potongan-Potongan",
        "lines": [
          { "key": "zakat", "label": "Zakat", "amount": 0 },
          { "key": "pajak", "label": "Pajak", "amount": 288550 }
        ]
      }
    ],

    "components": {
      "gaji_pokok": "1759050.00",
      "keluarga": "263858.00"
    }
  }
}
```

| Field | Kegunaan |
|-------|----------|
| **`slip_sections`** | **Utama** — render baris slip (label + amount sudah final) |
| **`totals`** | **Utama** — baris total (Jumlah Tunjangan, Jumlah Gaji, dll.) |
| `terbilang` | Teks terbilang gaji bersih |
| `components` | Opsional / backward compat — **jangan** dipakai untuk hitung total |
| ~~`raw_row`~~ | **Tidak lagi** dikirim di API detail — jangan dipakai mobile |

---

## 3. Layout Slip — Urutan Persis seperti Web

Ikuti urutan berikut **tepat**:

```
┌─────────────────────────────────────────┐
│  HEADER                                  │
│  RS Aisyiyah Siti Fatimah Tulangan       │
│  SLIP GAJI — {period_label}              │
│  No. {ref_no}                            │
├─────────────────────────────────────────┤
│  INFO PEGAWAI                            │
│  Nama, NIK, NPWP, Unit                   │
├─────────────────────────────────────────┤
│  PENDAPATAN                              │
│                                          │
│  1. Kehadiran          ← slip_sections[0]│
│     Kehadiran          Rp ...            │
│                                          │
│  2. Tunjangan          ← slip_sections[1]│
│     Keluarga           Rp ...            │
│     Masa Kerja         Rp ...            │
│     ... (semua baris, tampilkan semua)   │
│                                          │
│  3. Lain-Lain          ← slip_sections[2]│
│     Lembur             Rp ...            │
│     Remunerasi JKN ... Rp ...            │
│     ...                                  │
│                                          │
│  ── Jumlah Tunjangan   ← totals.jumlah_tunjangan
│  ── Jumlah Gaji        ← totals.jumlah_gaji
│                                          │
│  4. Potongan-Potongan  ← slip_sections[3]│
│     Zakat              Rp ...            │
│     Pajak              Rp ...            │
│     ...                                  │
│                                          │
│  ── Jumlah Potongan    ← totals.jumlah_potongan
│  ══ GAJI BERSIH        ← totals.gaji_bersih
│                                          │
│  Terbilang: {terbilang}                  │
└─────────────────────────────────────────┘
```

### Penting — definisi total

| Label | Rumus (sudah di backend) | **Jangan** |
|-------|--------------------------|------------|
| **Jumlah Tunjangan** | Section 2 + Section 3 | Jangan hanya section 2 |
| **Jumlah Gaji** | Kehadiran + Jumlah Tunjangan | Jangan tambah lain-lain lagi (sudah termasuk) |
| **Jumlah Potongan** | Total section 4 | Jangan hitung manual |
| **Gaji Bersih** | Jumlah Gaji − Jumlah Potongan | Jangan pakai `penerimaan` langsung kecuali fallback |

Contoh verifikasi (NIK `76.01.08.2012`):

```
Subtotal Tunjangan (section 2)  = Rp 12.294.262
Subtotal Lain-Lain (section 3)  = Rp  1.240.019
Jumlah Tunjangan                = Rp 13.534.281  ✅

Kehadiran                       = Rp  1.759.050
Jumlah Gaji                     = Rp 15.293.330  ✅
```

---

## 4. Aturan Render Baris

### 4.1 Tampilkan semua baris (termasuk Rp 0)

Web menampilkan **semua komponen** meski nilainya `0`. Mobile sebaiknya sama agar slip identik:

```typescript
function formatRupiah(amount: number): string {
  if (amount === 0) return 'Rp -';
  return 'Rp ' + amount.toLocaleString('id-ID');
}
```

### 4.2 Label baris

Pakai **`line.label`** dari API — jangan hardcode label remunerasi:

```typescript
// ✅ Benar — label dinamis dari backend
line.label  // "Remunerasi JKN Maret 2026"

// ❌ Salah — hardcode bulan
"Remunerasi JKN Feb 2026"
```

### 4.3 Indentasi

| Section | Indent baris |
|---------|--------------|
| 1. Kehadiran | Tanpa indent |
| 2. Tunjangan | Indent (pl-4 / paddingLeft 16) |
| 3. Lain-Lain | Indent |
| 4. Potongan | Indent |

Header section: **`{number}. {title}`** — contoh `2. Tunjangan`

---

## 5. Contoh Implementasi (React Native / Flutter)

### React Native (TypeScript)

```typescript
type SlipLine = { key: string; label: string; amount: number };
type SlipSection = { number: string; title: string; lines: SlipLine[] };
type SlipTotals = {
  jumlah_tunjangan: number;
  jumlah_gaji: number;
  jumlah_potongan: number;
  gaji_bersih: number;
};

function PayrollSlipScreen({ data }: { data: ApiPayrollDetail }) {
  const pendapatan = data.slip_sections.filter((s) => ['1', '2', '3'].includes(s.number));
  const potongan = data.slip_sections.find((s) => s.number === '4');
  const { totals, terbilang } = data;

  return (
    <ScrollView>
      <SlipHeader period={data.period_label} refNo={data.ref_no} />
      <EmployeeInfo name={data.employee_name} nik={data.simrs_nik} unit={data.unit} />

      <SectionTitle>PENDAPATAN</SectionTitle>

      {pendapatan.map((section) => (
        <View key={section.number}>
          <SectionHeader title={`${section.number}. ${section.title}`} />
          {section.lines.map((line) => (
            <SlipRow key={line.key} label={line.label} value={formatRupiah(line.amount)} indent />
          ))}
        </View>
      ))}

      <TotalRow label="Jumlah Tunjangan" value={formatRupiah(totals.jumlah_tunjangan)} variant="blue" />
      <TotalRow label="Jumlah Gaji" value={formatRupiah(totals.jumlah_gaji)} variant="green" />

      {potongan && (
        <>
          <SectionHeader title={`${potongan.number}. ${potongan.title}`} />
          {potongan.lines.map((line) => (
            <SlipRow key={line.key} label={line.label} value={formatRupiah(line.amount)} indent />
          ))}
        </>
      )}

      <TotalRow label="Jumlah Potongan" value={formatRupiah(totals.jumlah_potongan)} variant="red" />
      <TotalRow label="Jumlah Gaji Bersih" value={formatRupiah(totals.gaji_bersih)} variant="dark" highlight />

      <Terbilang text={terbilang} />
    </ScrollView>
  );
}
```

### Flutter (pseudocode)

```dart
// Fetch
final res = await dio.get('/api/sifast/payroll/$id', options: authOptions);
final data = res.data['data'];

// Render
for (final section in data['slip_sections'].where((s) => s['number'] != '4')) {
  buildSectionHeader('${section['number']}. ${section['title']}');
  for (final line in section['lines']) {
    buildRow(line['label'], formatRupiah(line['amount']));
  }
}
buildTotalRow('Jumlah Tunjangan', data['totals']['jumlah_tunjangan']);
buildTotalRow('Jumlah Gaji', data['totals']['jumlah_gaji']);

final potongan = data['slip_sections'].firstWhere((s) => s['number'] == '4');
// ... render potongan + totals
```

---

## 6. React Query / Cache

```typescript
useQuery({
  queryKey: ['payroll', nik, page],
  queryFn: () => fetchPayrollList(nik, page),
});

useQuery({
  queryKey: ['payroll', 'detail', id],
  queryFn: () => fetchPayrollDetail(id),
});
```

**Wajib** sertakan `nik` di `queryKey` agar cache antar pegawai tidak tertukar.

---

## 7. Migrasi dari API Lama

| API lama | API baru |
|----------|----------|
| `data.gaji_pokok` (root) | `data.components.gaji_pokok` atau `slip_sections` |
| `data.jumlah_tunjangan` (string CSV) | `data.totals.jumlah_tunjangan` (number, sudah benar) |
| `data.jumlah` | `data.totals.jumlah_gaji` |
| `data.jumlah_pot` | `data.totals.jumlah_potongan` |
| `data.raw_row` | **Dihapus** — jangan dipakai |
| Hitung total di frontend | **`data.totals`** |

---

## 8. Checklist QA — Cocok dengan Web?

Sebelum release, bandingkan satu pegawai (contoh NIK `76.01.08.2012`) antara mobile vs web print:

- [ ] Semua 4 section muncul dengan urutan benar
- [ ] Label remunerasi dinamis (bulan/tahun) sama
- [ ] **Jumlah Tunjangan** = section 2 + section 3 (bukan hanya section 2)
- [ ] **Jumlah Gaji** = Kehadiran + Jumlah Tunjangan
- [ ] **Gaji Bersih** = Jumlah Gaji − Jumlah Potongan
- [ ] Baris bernilai 0 tampil `Rp -`
- [ ] Terbilang sama dengan web

---

## 9. Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| API `403` | Data belum publish | Minta staff approve di `/payroll/import-history` |
| API `422` | NIK tidak dikirim | Tambahkan `?nik=` pada request |
| Jumlah Tunjangan beda dengan web | Mobile hitung manual | Pakai `totals.jumlah_tunjangan` |
| Komponen kosong | Import lama | Staff jalankan `php artisan payroll:reprocess-from-raw` |
| `from_csv.jumlah_tunjangan: false` | Normal — CSV tidak punya kolom | Backend hitung dari komponen (sama dengan web) |

---

## 10. Referensi Kode Backend (untuk tim dev)

| File | Isi |
|------|-----|
| `app/Support/PayrollSlipStructure.php` | Struktur section + rumus total (API) |
| `resources/js/pages/payroll/payroll-slip-structure.ts` | Struktur section + rumus total (Web) |
| `app/Http/Controllers/Api/EmployeeSalaryController.php` | Formatter response API |
| `resources/js/pages/payroll/print.tsx` | Referensi UI print web |

Kedua platform (web & API) **harus** menghasilkan angka identik karena memakai definisi section dan rumus total yang sama.
