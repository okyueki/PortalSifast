<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_user')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->latest();
    }

    /**
     * Nama untuk tampilan (1-1: nama user lain; group: bisa dikembangkan).
     */
    public function displayNameFor(User $user): string
    {
        $others = $this->participants->reject(fn (User $p) => $p->id === $user->id);

        return $others->pluck('name')->join(', ') ?: 'Chat';
    }

    /**
     * User lain di percakapan (untuk 1-1).
     */
    public function otherParticipant(User $user): ?User
    {
        return $this->participants->first(fn (User $p) => $p->id !== $user->id);
    }

    /**
     * Cari atau buat percakapan 1-1 antara dua user.
     */
    public static function firstOrCreateBetween(User $userA, User $userB): self
    {
        $candidates = self::query()
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userA->id))
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userB->id))
            ->with('participants')
            ->get();
        $conversation = $candidates->first(fn (Conversation $c) => $c->participants->count() === 2);
        if ($conversation) {
            return $conversation;
        }
        $conversation = self::create();
        $conversation->participants()->attach([$userA->id, $userB->id]);

        return $conversation->load('participants');
    }
}
