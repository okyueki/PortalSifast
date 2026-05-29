<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardNotification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'description', 'target_type', 'target_id', 'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
