<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventarisJenis extends Model
{
    use HasFactory;

    protected $connection = 'dbsimrs';

    protected $table = 'inventaris_jenis';

    protected $primaryKey = 'id_jenis';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id_jenis', 'nama_jenis',
    ];
}
