# Text Analytics Dashboard — Implementation Plan

**Date:** 2026-05-30
**Status:** Approved

---

## Overview

Menambahkan tab baru "Analisa" di dashboard yang melakukan text analysis pada tiket (title, description, comments) untuk menghasilkan:
1. **Auto Kategori** — kategorisasi otomatis berdasarkan keyword
2. **Keyword Frequency** — kata paling sering muncul
3. **Urgent Flagging** — deteksi tiket yang urgent/frustrasi

**Tech Stack:** Laravel/PHP backend, React frontend, Dictionary + Fuzzy matching (tanpa AI)

---

## File Map

| Action | File |
|--------|------|
| Create | `app/Services/TextAnalyzerService.php` |
| Modify | `app/Http/Controllers/Api/DashboardAnalyticsController.php` |
| Create | `app/Http/Controllers/Api/DashboardTextAnalyticsController.php` |
| Modify | `routes/api.php` |
| Create | `resources/js/pages/dashboard/TabAnalisa.tsx` |
| Modify | `resources/js/pages/dashboard.tsx` |

---

## Task 1: Create TextAnalyzerService

**File:** `app/Services/TextAnalyzerService.php`

```php
<?php

namespace App\Services;

use App\Models\Ticket;

class TextAnalyzerService
{
    private array $categoryDict = [
        'Hardware' => ['laptop', 'komputer', 'pc', 'mouse', 'keyboard', 'monitor', 'printer', 'cpu', 'ram', 'harddisk', 'ssd', 'usb', 'webcam', 'headset', 'speaker', 'hp', 'handphone', 'tablet', 'keyboard', 'barcode', 'scanner'],
        'Jaringan' => ['wifi', 'wlan', 'lan', 'internet', 'jaringan', 'router', 'modem', 'dns', 'dhcp', 'ip', 'connection', 'koneksi', 'signal', 'bandwidth', 'ethernet', 'hotspot', 'access point', 'vpn'],
        'Software' => ['windows', 'linux', 'macos', 'office', 'word', 'excel', 'powerpoint', 'email', 'outlook', 'zoom', 'teams', 'chrome', 'browser', 'update', 'install', 'uninstall', 'crash', 'error', 'bug', 'app', 'aplikasi', 'program'],
        'Akun & Akses' => ['password', 'login', 'akun', 'account', 'email', 'access', 'izin', 'otentikasi', 'autentikasi', 'otentikasi', 'otentifikasi', 'otorisasi', 'role', 'permission', 'hak akses'],
        'Database' => ['database', 'db', 'sql', 'mysql', 'postgresql', 'data', 'corrupt', 'backup', 'restore', 'table', 'query', 'server db', 'mysql'],
        'Device' => ['printer', 'scanner', 'cctv', 'kamera', 'proyektor', 'lcd', 'infocus', 'stopkontak', 'stabilizer', 'ups', 'genset'],
        'Telepon/VOIP' => ['telepon', 'phone', 'voip', 'ext', 'extension', 'pabx', 'handphone', 'hp'],
    ];

    private array $urgentKeywords = [
        'urgent', 'darurat', 'emergency', 'critical', 'down', 'bahaya', 'kritis',
        'sistem error', 'kesalahan sistem', 'rusak', 'berhenti', 'mati total',
        'tidak bisa', 'gagal total', 'seluruh', 'semua user', 'semua orang',
        'dampak besar', 'loss', 'rugi', 'menyebabkan', 'parah', 'gawat',
        'penting banget', 'segera', 'bahkan', 'tidak bisa sama sekali',
    ];

    private array $stopwords = [
        'yang', 'dan', 'di', 'dari', 'dengan', 'untuk', 'pada', 'ke', 'ini', 'itu',
        'adalah', 'tersebut', 'tidak', 'ada', 'saya', 'kami', 'mohon', 'tolong',
        'bisa', 'akan', 'sudah', 'belum', 'lagi', 'karena', 'oleh', 'seperti',
        'jika', 'atau', 'bukan', 'agar', 'lebih', 'juga', 'serta', 'sebuah',
        'dalam', 'hal', 'tersebut', 'sedangkan', 'namun', 'tetapi', 'bahwa',
    ];

    /**
     * Analyze all tickets text content
     */
    public function analyze(int $days = 30): array
    {
        $tickets = Ticket::query()
            ->published()
            ->where('created_at', '>=', now()->subDays($days))
            ->with(['requester'])
            ->get();

        $categoryCounts = [];
        $keywordCounts = [];
        $urgentTickets = [];

        foreach ($tickets as $ticket) {
            $text = $this->prepareText($ticket->title . ' ' . ($ticket->description ?? ''));
            
            // Detect category
            $detectedCategory = $this->detectCategory($text);
            if ($detectedCategory) {
                $categoryCounts[$detectedCategory] = ($categoryCounts[$detectedCategory] ?? 0) + 1;
            }

            // Count keywords
            $words = $this->tokenize($text);
            foreach ($words as $word) {
                if (strlen($word) >= 3 && !in_array($word, $this->stopwords)) {
                    $keywordCounts[$word] = ($keywordCounts[$word] ?? 0) + 1;
                }
            }

            // Check urgent
            $detectedUrgent = $this->detectUrgent($text);
            if ($detectedUrgent) {
                $urgentTickets[] = [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'title' => $ticket->title,
                    'detected_keywords' => $detectedUrgent,
                ];
            }
        }

        // Sort and format
        $byCategory = $this->formatCategoryCounts($categoryCounts);
        $topKeywords = $this->formatTopKeywords($keywordCounts, 30);

        return [
            'by_category' => $byCategory,
            'top_keywords' => $topKeywords,
            'urgent_tickets' => $urgentTickets,
        ];
    }

    /**
     * Prepare text: lowercase, clean punctuation
     */
    private function prepareText(string $text): string
    {
        $text = mb_strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Tokenize text into words
     */
    private function tokenize(string $text): array
    {
        return array_filter(explode(' ', $text), fn($w) => trim($w) !== '');
    }

    /**
     * Detect category using dictionary matching
     */
    private function detectCategory(string $text): ?string
    {
        $words = $this->tokenize($text);
        
        foreach ($this->categoryDict as $category => $keywords) {
            foreach ($keywords as $keyword) {
                // Direct match
                if (str_contains($text, $keyword)) {
                    return $category;
                }
                
                // Fuzzy match for typos (Levenshtein distance <= 2)
                foreach ($words as $word) {
                    if (strlen($word) >= 4 && strlen($keyword) >= 4) {
                        $distance = levenshtein($word, $keyword);
                        if ($distance <= 2) {
                            return $category;
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Detect urgent keywords
     */
    private function detectUrgent(string $text): array
    {
        $detected = [];
        
        foreach ($this->urgentKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                $detected[] = $keyword;
            }
        }

        return $detected;
    }

    /**
     * Format category counts with percentage
     */
    private function formatCategoryCounts(array $counts): array
    {
        $total = array_sum($counts);
        
        $result = [];
        foreach ($counts as $category => $count) {
            $result[] = [
                'name' => $category,
                'count' => $count,
                'percentage' => $total > 0 ? round($count / $total * 100, 1) : 0,
            ];
        }

        usort($result, fn($a, $b) => $b['count'] <=> $a['count']);
        
        return $result;
    }

    /**
     * Format top keywords
     */
    private function formatTopKeywords(array $counts, int $limit = 30): array
    {
        $result = [];
        foreach ($counts as $word => $count) {
            $result[] = ['word' => $word, 'count' => $count];
        }

        usort($result, fn($a, $b) => $b['count'] <=> $a['count']);
        
        return array_slice($result, 0, $limit);
    }
}
```

---

## Task 2: Create DashboardTextAnalyticsController

**File:** `app/Http/Controllers/Api/DashboardTextAnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TextAnalyzerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardTextAnalyticsController extends Controller
{
    public function __construct(
        private TextAnalyzerService $textAnalyzer
    ) {}

    public function index(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 30);
        $days = max(7, min(365, $days)); // clamp between 7-365 days

        $results = $this->textAnalyzer->analyze($days);

        return response()->json($results);
    }
}
```

---

## Task 3: Add Route

**File:** `routes/api.php`

Add after analytics route:

```php
Route::get('dashboard/text-analytics', [DashboardTextAnalyticsController::class, 'index'])
    ->name('dashboard.text-analytics');
```

---

## Task 4: Create TabAnalisa.tsx

**File:** `resources/js/pages/dashboard/TabAnalisa.tsx`

```tsx
import { useState, useEffect } from 'react';
import { AlertTriangle, Tag, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TextAnalyticsData = {
    by_category: Array<{ name: string; count: number; percentage: number }>;
    top_keywords: Array<{ word: string; count: number }>;
    urgent_tickets: Array<{
        id: number;
        ticket_number: string;
        title: string;
        detected_keywords: string[];
    }>;
};

type Props = {};

export default function TabAnalisa({}: Props) {
    const [timeRange, setTimeRange] = useState(30);
    const [data, setData] = useState<TextAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/dashboard/text-analytics?days=${timeRange}`)
            .then((res) => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [timeRange]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-destructive">Failed to load</div>;
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
                {[7, 30, 90, 180, 365].map((days) => (
                    <button
                        key={days}
                        onClick={() => setTimeRange(days)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            timeRange === days
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {days === 365 ? '1 Year' : `${days} Days`}
                    </button>
                ))}
            </div>

            {/* Category + Keywords Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Auto Kategori */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <CardTitle>Kategori Otomatis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.by_category.length > 0 ? (
                            <div className="space-y-2">
                                {data.by_category.map((cat) => (
                                    <div key={cat.name} className="flex items-center justify-between">
                                        <span className="font-medium">{cat.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${cat.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-muted-foreground w-20 text-right">
                                                {cat.count} ({cat.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                Tidak ada data kategori
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Keyword Frequency */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle>Top Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.top_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.top_keywords.map((kw) => (
                                    <Badge
                                        key={kw.word}
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        {kw.word} ({kw.count})
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                Tidak ada keyword
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Urgent Tickets */}
            <Card className="border-destructive/50">
                <CardHeader className="flex flex-row items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Tiket Urgent Terdeteksi</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.urgent_tickets.length > 0 ? (
                        <div className="space-y-3">
                            {data.urgent_tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                                >
                                    <div>
                                        <span className="font-mono text-sm font-medium">
                                            {ticket.ticket_number}
                                        </span>
                                        <p className="mt-1 text-sm">{ticket.title}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {ticket.detected_keywords.map((kw) => (
                                            <Badge
                                                key={kw}
                                                variant="destructive"
                                                className="text-xs"
                                            >
                                                {kw}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">
                            Tidak ada tiket urgent terdeteksi
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

---

## Task 5: Add Tab to dashboard.tsx

**File:** `resources/js/pages/dashboard.tsx`

1. Import the new tab:
```tsx
import TabAnalisa from './dashboard/TabAnalisa';
```

2. Add tab trigger after Activity:
```tsx
<TabsTrigger value="analisa">Analisa</TabsTrigger>
```

3. Add tabs content:
```tsx
<TabsContent value="analisa">
    <TabAnalisa />
</TabsContent>
```

---

## Task 6: Create Services directory and ensure namespace

Ensure `app/Services` directory exists. If not:
```bash
mkdir -p app/Services
```

---

## Acceptance Criteria

- [ ] Tab "Analisa" muncul di dashboard
- [ ] Kategori otomatis terdeteksi dari teks tiket
- [ ] Top 30 keyword frequency tampil
- [ ] Tiket urgent dengan keyword terdeteksi tampil
- [ ] Time range filter berfungsi (7/30/90/180/365 days)
- [ ] Responsive layout (mobile-friendly)
- [ ] Loading state dan empty state handle correctly