<?php

namespace App\Enums;

enum MutuIndicatorKind: string
{
    case Input = 'input';
    case Process = 'process';
    case Outcome = 'outcome';
    case OutcomeAndProcess = 'outcome_and_process';
}
