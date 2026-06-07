<?php

namespace App\Services;

use App\Models\Ticket;

class TextAnalyzerService
{
    private array $categoryDict = [
        'Hardware' => ['laptop', 'komputer', 'pc', 'mouse', 'keyboard', 'monitor', 'printer', 'cpu', 'ram', 'harddisk', 'ssd', 'usb', 'webcam', 'headset', 'speaker', 'hp', 'handphone', 'tablet', 'keyboard', 'barcode', 'scanner'],
        'Jaringan' => ['wifi', 'wlan', 'lan', 'internet', 'jaringan', 'router', 'modem', 'dns', 'dhcp', 'ip', 'connection', 'koneksi', 'signal', 'bandwidth', 'ethernet', 'hotspot', 'access point', 'vpn'],
        'Software' => ['windows', 'linux', 'macos', 'office', 'word', 'excel', 'powerpoint', 'email', 'outlook', 'zoom', 'teams', 'chrome', 'browser', 'update', 'install', 'uninstall', 'crash', 'error', 'bug', 'app', 'aplikasi', 'program'],
        'Akun & Akses' => ['password', 'login', 'akun', 'account', 'email', 'access', 'izin', 'otentikasi', 'autentikasi', 'otentifikasi', 'otentifikasi', 'otorisasi', 'role', 'permission', 'hak akses'],
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
            $text = $this->prepareText($ticket->title.' '.($ticket->description ?? ''));

            // Detect category
            $detectedCategory = $this->detectCategory($text);
            if ($detectedCategory) {
                $categoryCounts[$detectedCategory] = ($categoryCounts[$detectedCategory] ?? 0) + 1;
            }

            // Count keywords
            $words = $this->tokenize($text);
            foreach ($words as $word) {
                if (strlen($word) >= 3 && ! in_array($word, $this->stopwords)) {
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
        return array_filter(explode(' ', $text), fn ($w) => trim($w) !== '');
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

        usort($result, fn ($a, $b) => $b['count'] <=> $a['count']);

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

        usort($result, fn ($a, $b) => $b['count'] <=> $a['count']);

        return array_slice($result, 0, $limit);
    }
}
