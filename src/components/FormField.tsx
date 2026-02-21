import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseFieldProps = {
  label: string;
  helper?: string;
  error?: string;
};

type InputProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    type?: "text" | "email" | "password" | "number";
  };

type SelectProps = BaseFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
    options: { value: string; label: string }[];
  };

type TextareaProps = BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

function fieldWrapperClass(error?: string): string {
  return "form-field";
}

function controlClass(error?: string): string {
  return error ? "form-field--error" : "";
}

export function FormFieldInput({ label, helper, error, ...inputProps }: InputProps) {
  const id = inputProps.id ?? `input-${label.replace(/\s/g, "-").toLowerCase()}`;
  return (
    <div className={fieldWrapperClass(error)}>
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className={controlClass(error)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
      />
      {helper && !error ? (
        <span className="form-field__helper" id={`${id}-helper`}>
          {helper}
        </span>
      ) : null}
      {error ? (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function FormFieldSelect({
  label,
  helper,
  error,
  options,
  ...selectProps
}: SelectProps) {
  const id = selectProps.id ?? `select-${label.replace(/\s/g, "-").toLowerCase()}`;
  return (
    <div className={fieldWrapperClass(error)}>
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <select
        {...selectProps}
        id={id}
        className={controlClass(error)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helper && !error ? (
        <span className="form-field__helper" id={`${id}-helper`}>
          {helper}
        </span>
      ) : null}
      {error ? (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function FormFieldTextarea({ label, helper, error, ...textareaProps }: TextareaProps) {
  const id = textareaProps.id ?? `textarea-${label.replace(/\s/g, "-").toLowerCase()}`;
  return (
    <div className={fieldWrapperClass(error)}>
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        {...textareaProps}
        id={id}
        className={controlClass(error)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
      />
      {helper && !error ? (
        <span className="form-field__helper" id={`${id}-helper`}>
          {helper}
        </span>
      ) : null}
      {error ? (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
