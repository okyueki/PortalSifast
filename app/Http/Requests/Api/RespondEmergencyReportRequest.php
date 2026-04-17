<?php

namespace App\Http\Requests\Api;

use App\Models\EmergencyReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RespondEmergencyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([
                EmergencyReport::STATUS_RESPONDED,
                EmergencyReport::STATUS_IN_PROGRESS,
                EmergencyReport::STATUS_ARRIVED,
                EmergencyReport::STATUS_RESOLVED,
            ])],
            'notes' => ['nullable', 'string', 'max:5000'],
            'assigned_team' => ['nullable', 'string', 'max:255'],
            'destination_type' => ['nullable', 'string', Rule::in([
                EmergencyReport::DESTINATION_RS_KITA,
                EmergencyReport::DESTINATION_RUJUK,
            ])],
            'destination_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
