<?php

namespace App\Exceptions;

use Exception;

class PanicStatusInvalidException extends Exception
{
    public function __construct(string $message = 'Status laporan tidak valid untuk accept', int $code = 422)
    {
        parent::__construct($message, $code);
    }
}