<?php

namespace App\Http\Requests;

use App\Enums\MutuCategoryScope;
use App\Enums\MutuObligationProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMutuCategoryRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('short_name') === '') {
            $this->merge(['short_name' => null]);
        }
        if ($this->input('obligation_profile') === '') {
            $this->merge(['obligation_profile' => null]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->canManageMutu() ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:64'],
            'scope' => ['required', Rule::enum(MutuCategoryScope::class)],
            'description' => ['nullable', 'string'],
            'is_general_use' => ['boolean'],
            'has_mutu_benchmarking' => ['boolean'],
            'obligation_profile' => ['nullable', Rule::enum(MutuObligationProfile::class)],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'scope.required' => 'Lingkup wajib dipilih.',
        ];
    }
}
