<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventarisMerk extends Model
{
    use HasFactory;

    protected $connection = 'dbsimrs';

    protected $table = 'inventaris_merk';

    protected $primaryKey = 'id_merk';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id_merk', 'nama_merk',
    ];
}
