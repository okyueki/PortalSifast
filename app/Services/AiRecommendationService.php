<?php

namespace App\Services;

use App\Models\Ticket;
use App\Support\AiConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI-powered recommendation service.
 * Gives concrete steps to solve/handle a ticket based on its title, category, and history.
 */
class AiRecommendationService
{
    /**
     * Generate AI recommendation for how to handle this ticket.
     */
    public function generate(Ticket $ticket): string
    {
        $ticket->loadMissing([
            'category',
            'priority',
            'assignee',
            'requester',
            'comments.user',
            'sparepartItems',
            'vendorCosts',
            'issues',
        ]);

        if (AiConfig::hasApiKey()) {
            return $this->generateWithAi($ticket);
        }

        return $this->generateFallback($ticket);
    }

    /**
     * Call OpenRouter deepseek-v4-flash for recommendation.
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
                    'model' => 'deepseek/deepseek-v4-flash:free',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 1200,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenRouter recommendation error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $this->generateFallback($ticket);
            }

            $data = $response->json();

            return trim($data['choices'][0]['message']['content'] ?? '') ?: $this->generateFallback($ticket);

        } catch (\Throwable $e) {
            Log::error('OpenRouter recommendation exception', ['message' => $e->getMessage()]);

            return $this->generateFallback($ticket);
        }
    }

    /**
     * Build the recommendation prompt.
     */
    private function buildPrompt(Ticket $ticket): string
    {
        $category = $ticket->category?->name ?? '-';
        $type = $ticket->type?->name ?? '-';
        $priority = $ticket->priority?->name ?? '-';
        $assignee = $ticket->assignee?->name ?? 'belum ditugaskan';
        $title = $ticket->title;
        $description = $ticket->description ?? '-';
        $creator = $ticket->requester?->name ?? '-';
        $dep = $ticket->dep_id ?? '-';

        // Collect previous comments for context
        $commentContext = '';
        if ($ticket->comments && $ticket->comments->count() > 0) {
            $recent = $ticket->comments->sortByDesc('created_at')->take(5)->values();
            $lines = [];
            foreach ($recent as $c) {
                $role = $c->is_internal ? '[Internal]' : '[Public]';
                $lines[] = "- {$role} {$c->user->name}: ".mb_substr($c->body, 0, 200);
            }
            $commentContext = "\n\nKomentar sebelumnya:\n".implode("\n", $lines);
        }

        return <<<PROMPT
Kamu adalah asisten IT Support berpengalaman di rumah sakit. Tiket berikut butuh penanganan:

═══════════════════════════════════════
TIKET: {$ticket->ticket_number}
═══════════════════════════════════════
Judul    : {$title}
Kategori : {$category}
Tipe     : {$type}
Prioritas: {$priority}
Dept     : {$dep}
Pelapor  : {$creator}
Ditugaskan ke: {$assignee}

Deskripsi Awal:
{$description}
{$commentContext}
═══════════════════════════════════════

TUGAS:
Buatkan ANALISIS + LANGKAH-LANGKAH KONKRET untuk menangani tiket ini.

Gunakan format ini ( Bahasa Indonesia ):

**🔍 Analisis Awal**
[Paragraf singkat — 2-3 kalimat — memahami masalah inti]

**📋 Langkah yang Disarankan**
[Langkah 1]
[Langkah 2]
[Langkah 3]
[Langkah 4]
[Langkah 5]
(Sesuaikan jumlah langkah dengan kompleksitas tiket. Minimal 3, maksimal 8 langkah.)

**⏱️ Estimasi Waktu**
[Ringkas estimasi: cepat 1-2 jam, sedang half day 1 hari, besar 2-5 hari]

**⚠️ Hal yang Perlu Diperhatikan**
[Catatan penting, risiko, atau dependensi — kalau ada]

KOMIT untuk mengikuti format di atas. Jangan keluar dari format. Jawab langsung dengan analisanya, tidak perlu menyapa.
PROMPT;
    }

    /**
     * Fallback recommendation if no API key.
     */
    private function generateFallback(Ticket $ticket): string
    {
        $category = $ticket->category?->name ?? '';
        $title = $ticket->title;

        $lines = [];
        $lines[] = '**🔍 Analisis Awal**';
        $lines[] = "Tiket ini masuk kategori **{$category}** dengan judul \"{$title}\".";
        $lines[] = '';

        $lines[] = '**📋 Langkah yang Disarankan**';
        $lines[] = '1. Pahami requirement/detail dari judul tiket';
        $lines[] = '2. Identifikasi stakeholder yang terlibat';
        $lines[] = '3. Buat planning + estimasi waktu';
        $lines[] = '4. Eksekusi sesuai planning';
        $lines[] = '5. Dokumentasikan progress & hasil';
        $lines[] = '';

        $lines[] = '**⏱️ Estimasi Waktu**';
        $lines[] = 'Half day – 1 hari (sesuaikan setelah analisis)';
        $lines[] = '';

        $lines[] = '**⚠️ Hal yang Perlu Diperhatikan**';
        $lines[] = '- Koordinasikan dengan tim terkait sebelum eksekusi';
        $lines[] = '- Catat semua perubahan yang dilakukan';

        return implode("\n", $lines);
    }
}
