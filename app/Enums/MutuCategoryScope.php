<?php

namespace App\Enums;

enum MutuCategoryScope: string
{
    case Internal = 'internal';
    case Nasional = 'nasional';
    case Unit = 'unit';
    case Global = 'global';
}
