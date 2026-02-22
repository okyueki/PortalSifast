<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class OfficerLoginRequest extends FormRequest
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
            'nik' => ['required_without:badge_id', 'string', 'max:50'],
            'badge_id' => ['required_without:nik', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ];
    }
}
