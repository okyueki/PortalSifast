<?php

namespace App\Enums;

enum MutuObligationProfile: string
{
    case Inm = 'inm';
    case ImpRs = 'imp_rs';
    case ImpUnit = 'imp_unit';
    case Ikp = 'ikp';
    case Skp = 'skp';
    case Other = 'other';
}
