<?php

namespace App\Services;

use App\Models\Ticket;
use App\Support\AiConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Calls OpenRouter (deepseek/deepseek-v4-flash:free) to generate
 * structured work documentation from ticket data.
 *
 * Falls back to template-based if API key is not configured.
 */
class AiDocumentationService
{
    public const TEMPLATE_MODEL = 'deepseek/deepseek-v4-flash:free';

    public function generate(Ticket $ticket): string
    {
        // Load relations
        $ticket->loadMissing([
            'category',
            'priority',
            'assignee',
            'requester',
            'sparepartItems',
            'vendorCosts',
            'comments.user',
        ]);

        // Use AI if configured
        if (AiConfig::hasApiKey()) {
            return $this->generateWithAi($ticket);
        }

        // Fallback: template-based
        return (new TicketDocumentationService)->generate($ticket);
    }

    /**
     * Call OpenRouter API with structured prompt.
     */
    private function generateWithAi(Ticket $ticket): string
    {
        $prompt = $this->buildPrompt($ticket);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer '.AiConfig::apiKey(),
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => AiConfig::siteUrl() ?? 'https://portal.rsaisyiyahsitifatimah.com',
                    'X-Title' => AiConfig::siteName(),
                ])
                ->post(AiConfig::BASE_URL.'/chat/completions', [
                    'model' => self::TEMPLATE_MODEL,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'max_tokens' => 1024,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenRouter API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return (new TicketDocumentationService)->generate($ticket);
            }

            $data = $response->json();

            return $data['choices'][0]['message']['content']
                ?? (new TicketDocumentationService)->generate($ticket);

        } catch (\Throwable $e) {
            Log::error('OpenRouter API exception', [
                'message' => $e->getMessage(),
            ]);

            return (new TicketDocumentationService)->generate($ticket);
        }
    }

    /**
     * Build the prompt for the AI model.
     */
    private function buildPrompt(Ticket $ticket): string
    {
        $lines = [];

        $lines[] = 'Buatkan dokumentasi pengerjaan tiket support IT dalam Bahasa Indonesia. ';
        $lines[] = "Ikuti format di bawah ini secara ketat. Jangan tambah bagian di luar format.\n";

        // ── Basic Info ──
        $lines[] = 'Format yang HARUS diikuti:';
        $lines[] = '';
        $lines[] = '📋 **LAPORAN PENGERJAAN**';
        $lines[] = '';
        $lines[] = '**Informasi Tiket**';
        $lines[] = "- Nomor: {$ticket->ticket_number}";
        $lines[] = "- Judul: {$ticket->title}";
        if ($ticket->category) {
            $lines[] = "- Kategori: {$ticket->category->name}";
        }
        if ($ticket->priority) {
            $lines[] = "- Prioritas: {$ticket->priority->name}";
        }
        if ($ticket->assignee) {
            $lines[] = "- Petugas: {$ticket->assignee->name}";
        }
        if ($ticket->requester) {
            $lines[] = "- Pelapor: {$ticket->requester->name}";
        }
        $lines[] = '';

        // ── Initial complaint ──
        if ($ticket->description) {
            $lines[] = '**Keluhan Awal**';
            $lines[] = $this->quoteText($ticket->description);
            $lines[] = '';
        }

        // ── sparepart ──
        if ($ticket->sparepartItems && $ticket->sparepartItems->count() > 0) {
            $lines[] = '**Sparepart yang Digunakan**';
            $total = 0;
            foreach ($ticket->sparepartItems as $item) {
                $subtotal = $item->qty * $item->harga_satuan;
                $total += $subtotal;
                $lines[] = "- {$item->nama_item}";
                $lines[] = "  Qty: {$item->qty} × Rp ".number_format($item->harga_satuan, 0, ',', '.').' = Rp '.number_format($subtotal, 0, ',', '.');
                if ($item->catatan) {
                    $lines[] = "  Catatan: {$item->catatan}";
                }
            }
            $lines[] = '';
            $lines[] = '**Total Biaya Sparepart: Rp '.number_format($total, 0, ',', '.').'**';
            $lines[] = '';
        }

        // ── Vendor costs ──
        if ($ticket->vendorCosts && $ticket->vendorCosts->count() > 0) {
            $lines[] = '**Biaya Vendor**';
            $totalVendor = 0;
            foreach ($ticket->vendorCosts as $vc) {
                $lines[] = "- Vendor: {$vc->vendor_name}";
                if ($vc->estimated_cost !== null) {
                    $lines[] = '  Estimasi: Rp '.number_format($vc->estimated_cost, 0, ',', '.');
                }
                if ($vc->actual_cost !== null) {
                    $totalVendor += $vc->actual_cost;
                    $lines[] = '  Realisasi: Rp '.number_format($vc->actual_cost, 0, ',', '.');
                }
                if ($vc->work_date) {
                    $lines[] = '  Tanggal kerja: '.date('d M Y', strtotime($vc->work_date));
                }
                if ($vc->sparepart_notes) {
                    $lines[] = "  Sparepart: {$vc->sparepart_notes}";
                }
                if ($vc->vendor_notes) {
                    $lines[] = "  Catatan: {$vc->vendor_notes}";
                }
            }
            if ($totalVendor > 0) {
                $lines[] = '';
                $lines[] = '**Total Biaya Vendor: Rp '.number_format($totalVendor, 0, ',', '.').'**';
            }
            $lines[] = '';
        }

        // ── Resolution time ──
        $created = date('d M Y H:i', strtotime($ticket->created_at));
        $resolved = $ticket->resolved_at ? date('d M Y H:i', strtotime($ticket->resolved_at)) : null;
        $lines[] = '**Waktu Pengerjaan**';
        $lines[] = "- Dibuat: {$created}";
        if ($resolved) {
            $lines[] = "- Selesai: {$resolved}";
            $diff = $this->diffMinutes($ticket->created_at, $ticket->resolved_at);
            $lines[] = "- Durasi: {$diff}";
        }
        $lines[] = '';
        $lines[] = '**Hasil**: ✅ Berhasil diperbaiki / diselesaikan';
        $lines[] = '';

        // ── Footer ──
        $lines[] = '---';
        $lines[] = '_Generated by Portal Sifast · '.date('d M Y H:i').'_';

        return implode("\n", $lines);
    }

    private function quoteText(string $text): string
    {
        $text = wordwrap($text, 80, "\n", true);
        $text = trim($text);

        return implode("\n  ", explode("\n", $text));
    }

    private function diffMinutes(string $start, string $end): string
    {
        $diff = max(0, strtotime($end) - strtotime($start));
        $hours = floor($diff / 3600);
        $minutes = floor(($diff % 3600) / 60);

        if ($hours > 24) {
            $days = floor($hours / 24);
            $remainingHours = $hours % 24;

            return "{$days} hari {$remainingHours} jam";
        }
        if ($hours > 0) {
            return "{$hours} jam {$minutes} menit";
        }

        return "{$minutes} menit";
    }
}
