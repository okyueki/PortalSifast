<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventarisKategori extends Model
{
    use HasFactory;

    protected $connection = 'dbsimrs';

    protected $table = 'inventaris_kategori';

    protected $primaryKey = 'id_kategori';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id_kategori', 'nama_kategori',
    ];
}
