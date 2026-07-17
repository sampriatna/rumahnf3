"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  id,
  name,
  placeholder = "••••••••",
  autoComplete = "current-password",
  inputMode,
  className = "",
  centerText,
  required = true
}: {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  className?: string;
  centerText?: boolean;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/10 ${
          centerText ? "text-center text-2xl tracking-[0.4em]" : ""
        } ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy-800"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
