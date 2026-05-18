<?php

namespace App\Exceptions;

use Exception;

class PanicAlreadyTakenException extends Exception
{
    public function __construct(string $message = 'Laporan sudah diambil oleh petugas lain', int $code = 409)
    {
        parent::__construct($message, $code);
    }
}