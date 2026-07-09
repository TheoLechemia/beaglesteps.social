import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

const fieldClassName =
  'w-full rounded-lg border-[0.5px] border-line bg-surface-1 p-2.5 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none';

export function FormInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className ? `${fieldClassName} ${className}` : fieldClassName} {...props} />;
}

export function FormSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={className ? `${fieldClassName} ${className}` : fieldClassName} {...props} />;
}
