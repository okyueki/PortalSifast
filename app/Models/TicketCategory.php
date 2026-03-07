<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'dep_id',
        'ticket_type_id',
        'is_development',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_development' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    /** Alias for ticketType (digunakan di Master Tiket settings) */
    public function type(): BelongsTo
    {
        return $this->belongsTo(TicketType::class, 'ticket_type_id');
    }

    public function subcategories(): HasMany
    {
        return $this->hasMany(TicketSubcategory::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function slaRules(): HasMany
    {
        return $this->hasMany(TicketSlaRule::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDepartment($query, string $depId)
    {
        return $query->where('dep_id', $depId);
    }

    public function scopeDevelopment($query)
    {
        return $query->where('is_development', true);
    }

    public function scopeNonDevelopment($query)
    {
        return $query->where('is_development', false);
    }
}
