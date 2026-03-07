<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketSparepartItem extends Model
{
    protected $fillable = [
        'ticket_id',
        'nama_item',
        'qty',
        'harga_satuan',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'harga_satuan' => 'decimal:2',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Total = qty * harga_satuan
     */
    public function getTotalAttribute(): float
    {
        return (float) (($this->qty ?? 0) * ($this->harga_satuan ?? 0));
    }
}
