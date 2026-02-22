<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOfficerLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'report_id' => ['required', 'string', 'max:32'],
            'speed_kmh' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'heading' => ['nullable', 'integer', 'min:0', 'max:360'],
        ];
    }
}
