<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'simrs_nik',
        'phone',
        'source',
        'role',
        'dep_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    // ==================== TICKETING RELATIONSHIPS ====================

    /**
     * Tiket yang dibuat oleh user ini (sebagai pemohon)
     */
    public function requestedTickets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Ticket::class, 'requester_id');
    }

    /**
     * Tiket yang ditugaskan ke user ini (sebagai assignee)
     */
    public function assignedTickets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Ticket::class, 'assignee_id');
    }

    /**
     * Komentar tiket oleh user ini
     */
    public function ticketComments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    /**
     * Aktivitas tiket oleh user ini
     */
    public function ticketActivities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TicketActivity::class);
    }

    // ==================== ROLE HELPERS ====================

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function isPemohon(): bool
    {
        return $this->role === 'pemohon';
    }

    /**
     * Cek apakah user bisa mengakses tiket departemen tertentu
     */
    public function canAccessDepartment(string $depId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return $this->dep_id === $depId;
    }
}
