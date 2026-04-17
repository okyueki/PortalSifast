<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slip Gaji - {{ $periodLabel }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #10b981;
            margin: 0 0 5px 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            color: #666;
            font-weight: 500;
        }
        .info-value {
            font-weight: 600;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #10b981;
        }
        .total-row {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .total-label {
            font-size: 14px;
            color: #666;
        }
        .total-value {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
        .currency {
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SLIP GAJI</h1>
            <p>Periode: {{ $periodLabel }}</p>
        </div>

        <div class="section">
            <div class="section-title">Informasi Pegawai</div>
            <div class="info-row">
                <span class="info-label">Nama</span>
                <span class="info-value">{{ $salary->employee_name ?? '-' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">NIK</span>
                <span class="info-value">{{ $salary->simrs_nik }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Unit</span>
                <span class="info-value">{{ $salary->unit ?? '-' }}</span>
            </div>
            @if($salary->npwp)
            <div class="info-row">
                <span class="info-label">NPWP</span>
                <span class="info-value">{{ $salary->npwp }}</span>
            </div>
            @endif
        </div>

        <div class="section">
            <div class="section-title">Rincian Gaji</div>
            <div class="info-row">
                <span class="info-label">Penerimaan Kotor</span>
                <span class="info-value currency">Rp {{ number_format((float)($salary->penerimaan ?? 0), 0, ',', '.') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Pajak (PPh 21)</span>
                <span class="info-value currency" style="color: #f59e0b;">- Rp {{ number_format((float)($salary->pajak ?? 0), 0, ',', '.') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Zakat</span>
                <span class="info-value currency" style="color: #3b82f6;">- Rp {{ number_format((float)($salary->zakat ?? 0), 0, ',', '.') }}</span>
            </div>
        </div>

        @php
            $penerimaan = (float)($salary->penerimaan ?? 0);
            $pajak = (float)($salary->pajak ?? 0);
            $zakat = (float)($salary->zakat ?? 0);
            $bersih = $penerimaan - $pajak - $zakat;
        @endphp

        <div class="total-row">
            <div class="total-label">Gaji Bersih (Take Home Pay)</div>
            <div class="total-value currency">Rp {{ number_format($bersih, 0, ',', '.') }}</div>
        </div>

        <div class="footer">
            <p>Email ini dikirim otomatis oleh sistem.</p>
            <p>Jika ada pertanyaan, silakan hubungi bagian HRD/Keuangan.</p>
            <p>&copy; {{ date('Y') }} RS Aisyiyah Siti Fatimah</p>
        </div>
    </div>
</body>
</html>
