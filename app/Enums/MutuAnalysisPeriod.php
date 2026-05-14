<?php

namespace App\Enums;

enum MutuAnalysisPeriod: string
{
    case Monthly = 'monthly';
    case Quarterly = 'quarterly';
    case Yearly = 'yearly';
}
