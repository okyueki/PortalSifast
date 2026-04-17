<?php

use App\Support\TicketResolutionDuration;
use Carbon\Carbon;

it('returns null when created or closed is missing', function () {
    $created = Carbon::parse('2024-01-01 10:00:00');

    expect(TicketResolutionDuration::format(null, $created))->toBeNull();
    expect(TicketResolutionDuration::format($created, null))->toBeNull();
});

it('returns null when closed is before created', function () {
    $created = Carbon::parse('2024-01-02 10:00:00');
    $closed = Carbon::parse('2024-01-01 10:00:00');

    expect(TicketResolutionDuration::format($created, $closed))->toBeNull();
});

it('formats under one minute', function () {
    $created = Carbon::parse('2024-01-01 10:00:00');
    $closed = Carbon::parse('2024-01-01 10:00:30');

    expect(TicketResolutionDuration::format($created, $closed))->toBe('< 1 menit');
});

it('formats days and hours', function () {
    $created = Carbon::parse('2024-04-08 13:19:00');
    $closed = Carbon::parse('2024-04-10 18:19:00');

    expect(TicketResolutionDuration::format($created, $closed))->toBe('2 hari 5 jam');
});

it('formats hours and minutes when under one day', function () {
    $created = Carbon::parse('2024-01-01 10:00:00');
    $closed = Carbon::parse('2024-01-01 12:45:00');

    expect(TicketResolutionDuration::format($created, $closed))->toBe('2 jam 45 menit');
});

it('formats minutes only when under one hour', function () {
    $created = Carbon::parse('2024-01-01 10:00:00');
    $closed = Carbon::parse('2024-01-01 10:33:00');

    expect(TicketResolutionDuration::format($created, $closed))->toBe('33 menit');
});
