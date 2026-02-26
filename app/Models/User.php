<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * dep_id yang dianggap sebagai petugas emergency (bisa update lokasi, login officer).
     */
    public const OFFICER_DEP_IDS = ['DRIVER', 'IGD'];

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
        'badge_id',
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

    // ==================== SESSION RELATIONSHIP ====================

    /**
     * User sessions untuk tracking online status
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(\Illuminate\Session\DatabaseSession::class, 'user_id');
    }

    /**
     * Get avatar URL attribute
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return null; // No avatar field in database
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

    // ==================== OFFICER (EMERGENCY TRACKING) ====================

    /**
     * Apakah user ini petugas emergency (bisa login officer, update lokasi GPS).
     */
    public function isOfficer(): bool
    {
        return $this->role === 'staff' && in_array($this->dep_id, self::OFFICER_DEP_IDS, true);
    }

    /**
     * Scope: hanya user yang role staff dan dep_id petugas emergency.
     */
    public function scopeOfficers($query)
    {
        return $query->where('role', 'staff')->whereIn('dep_id', self::OFFICER_DEP_IDS);
    }

    public function officerLocations(): HasMany
    {
        return $this->hasMany(OfficerLocation::class, 'officer_id');
    }

    // ==================== CHAT ====================

    public function conversations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    // ==================== CATATAN KERJA ====================

    public function workNotes(): HasMany
    {
        return $this->hasMany(WorkNote::class);
    }
}
