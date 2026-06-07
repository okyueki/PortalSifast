<?php

namespace App\Services;

use App\Models\Ticket;

/**
 * Generates structured work documentation from ticket data.
 * Produces a "resolution note" comment template that IT staff can review
 * and post directly from the ticket page.
 */
class TicketDocumentationService
{
    /**
     * Generate documentation text from a ticket.
     * Returns structured markdown-ready text.
     */
    public function generate(Ticket $ticket): string
    {
        $lines = [];

        // ── Header ──────────────────────────────────────────
        $lines[] = '📋 **LAPORAN PENGERJAAN**';
        $lines[] = '';

        // ── Info Dasar ────────────────────────────────────
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

        // ── Deskripsi Awal ────────────────────────────────
        if ($ticket->description) {
            $lines[] = '**Keluhan Awal**';
            $lines[] = $this->quoteText($ticket->description);
            $lines[] = '';
        }

        // ── Analisis / Diagnosis ───────────────────────────
        $diagnosisLines = $this->extractDiagnosis($ticket);
        if ($diagnosisLines) {
            $lines[] = '**Analisis / Diagnosis**';
            foreach ($diagnosisLines as $line) {
                $lines[] = $line;
            }
            $lines[] = '';
        }

        // ── Langkah Pengerjaan ────────────────────────────
        $stepsLines = $this->extractSteps($ticket);
        if ($stepsLines) {
            $lines[] = '**Langkah Pengerjaan**';
            foreach ($stepsLines as $i => $step) {
                $lines[] = ($i + 1).'. '.$step;
            }
            $lines[] = '';
        }

        // ── sparepart ────────────────────────────────────
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

        // ── Biaya Vendor ─────────────────────────────────
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

        // ── Hasil ────────────────────────────────────────
        $lines[] = '**Hasil**';
        $lines[] = '✅ Berhasil diperbaiki / diselesaikan';
        $lines[] = '';

        // ── Waktu ────────────────────────────────────────
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

        // ── Footer ──────────────────────────────────────
        $lines[] = '---';
        $lines[] = '_Generated by Portal Sifast · '.date('d M Y H:i').'_';

        return implode("\n", $lines);
    }

    /**
     * Extract diagnosis from previous comments (internal or regular).
     */
    private function extractDiagnosis(Ticket $ticket): array
    {
        $lines = [];

        $comments = $ticket->comments ?? collect();

        // Look for comments that seem diagnostic
        foreach ($comments as $comment) {
            $body = mb_strtolower($comment->body ?? '');
            if (str_contains($body, 'diagnosa') || str_contains($body, 'penyebab') ||
                str_contains($body, 'analisis') || str_contains($body, 'diduga') ||
                str_contains($body, 'kerusakan') || str_contains($body, 'masalah')) {
                // First meaningful sentence
                $text = trim($comment->body ?? '');
                $text = mb_substr($text, 0, 300); // cap at 300 chars
                $lines[] = "- [{$comment->user->name}]: ".$this->quoteText($text);
                if (count($lines) >= 3) {
                    break;
                } // max 3 diagnostic notes
            }
        }

        return $lines;
    }

    /**
     * Extract steps from comments that look like action steps.
     */
    private function extractSteps(Ticket $ticket): array
    {
        $lines = [];

        $comments = $ticket->comments ?? collect();

        foreach ($comments as $comment) {
            $body = mb_strtolower($comment->body ?? '');
            // Skip resolution notes
            if ($comment->is_resolution) {
                continue;
            }

            // Look for action-oriented text
            $text = trim($comment->body ?? '');
            $hasAction = preg_match('/^(langkah|tahap|step|urutan|proses|activity|aksi|melakukan|mengecek|mengganti|memperbaiki|menginstal)/i', $text);

            if ($hasAction || str_contains($body, 'selesai di') || str_contains($body, 'sudah di')) {
                $text = mb_substr($text, 0, 200);
                if (mb_strlen($text) > 10) {
                    $lines[] = $text;
                }
                if (count($lines) >= 5) {
                    break;
                }
            }
        }

        return $lines;
    }

    /**
     * Format a block of text as a quoted paragraph.
     */
    private function quoteText(string $text): string
    {
        // Wrap at ~80 chars for readability
        $text = wordwrap($text, 80, "\n", true);
        $text = trim($text);

        return implode("\n  ", explode("\n", $text));
    }

    /**
     * Calculate difference between two timestamps as human-readable duration.
     */
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
