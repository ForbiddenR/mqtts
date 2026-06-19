import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, description, error, children }: FormFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="[&>*]:w-full">{children}</div>
      {description && !error && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export function Input({ label, description, error, ...props }: InputProps) {
  const id = useId();

  return (
    <FormField label={label} description={description} error={error}>
      <input
        id={id}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        {...props}
      />
    </FormField>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  description?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, description, error, options, ...props }: SelectProps) {
  const id = useId();

  return (
    <FormField label={label} description={description} error={error}>
      <select
        id={id}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
}

export function Textarea({ label, description, error, ...props }: TextareaProps) {
  const id = useId();

  return (
    <FormField label={label} description={description} error={error}>
      <textarea
        id={id}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        {...props}
      />
    </FormField>
  );
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, ...props }: CheckboxProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
        {...props}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
}
