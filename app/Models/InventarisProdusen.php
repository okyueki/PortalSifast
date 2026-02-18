<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventarisProdusen extends Model
{
    use HasFactory;

    protected $connection = 'dbsimrs';

    protected $table = 'inventaris_produsen';

    protected $fillable = [
        'kode_produsen', 'nama_produsen', 'alamat_produsen', 'no_telp', 'email', 'website_produsen',
    ];

    protected $primaryKey = 'kode_produsen';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;
}
