<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketStatus;
use Illuminate\Console\Command;

class AutoCloseTicketsCommand extends Command
{
    protected $signature = 'tickets:auto-close';

    protected $description = 'Auto-close tickets that have been in "Menunggu Konfirmasi" for 3+ days';

    public function handle(): int
    {
        $waitingStatus = TicketStatus::where('slug', TicketStatus::SLUG_WAITING_CONFIRMATION)->first();

        if (! $waitingStatus) {
            $this->warn('Status "Menunggu Konfirmasi" tidak ditemukan.');

            return self::FAILURE;
        }

        $closedStatus = TicketStatus::where('slug', TicketStatus::SLUG_CLOSED)->first();

        if (! $closedStatus) {
            $this->warn('Status "Ditutup" tidak ditemukan.');

            return self::FAILURE;
        }

        $cutoff = now()->subDays(3);

        $tickets = Ticket::query()
            ->where('ticket_status_id', $waitingStatus->id)
            ->where('resolved_at', '<=', $cutoff)
            ->get();

        $count = $tickets->count();

        foreach ($tickets as $ticket) {
            $ticket->ticket_status_id = $closedStatus->id;
            $ticket->closed_at = now();
            $ticket->save();

            $ticket->logActivity(
                TicketActivity::ACTION_AUTO_CLOSED,
                $waitingStatus->name,
                $closedStatus->name,
                'Auto-close setelah 3 hari tidak ada respons pemohon',
                null
            );
        }

        if ($count > 0) {
            $this->info("{$count} tiket berhasil ditutup otomatis.");
        }

        return self::SUCCESS;
    }
}
