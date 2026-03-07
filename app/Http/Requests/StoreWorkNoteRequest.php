<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:10'],
            'content' => ['nullable', 'array'],
            'content.*.id' => ['nullable', 'string'],
            'content.*.type' => ['nullable', 'string', 'in:text,h1,h2,h3,bulleted-list,numbered-list,todo-list,toggle-list,callout,table'],
            'content.*.content' => ['nullable', 'string'],
            'content.*.checked' => ['nullable', 'boolean'],
            'content.*.expanded' => ['nullable', 'boolean'],
            'content.*.children' => ['nullable', 'string'],
            'content.*.tableData' => ['nullable', 'array'],
        ];
    }
}
