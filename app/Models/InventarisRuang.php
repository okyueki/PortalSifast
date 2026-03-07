<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventarisRuang extends Model
{
    use HasFactory;

    protected $connection = 'dbsimrs';

    protected $table = 'inventaris_ruang';

    protected $primaryKey = 'id_ruang';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_ruang', 'nama_ruang',
    ];
}
