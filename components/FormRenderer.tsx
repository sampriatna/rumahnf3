import { Send } from "lucide-react";
import type { FormDef } from "@/lib/forms";
import { submitForm } from "@/app/form-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-400/10";

export function FormRenderer({
  def,
  prefill,
  outletId
}: {
  def: FormDef;
  prefill: Record<string, string>;
  outletId?: string;
}) {
  return (
    <form action={submitForm} className="panel flex flex-col gap-4 p-6">
      <input type="hidden" name="__formType" value={def.type} />
      {outletId && <input type="hidden" name="__outlet" value={outletId} />}

      {def.fields.map((field) => {
        const value = prefill[field.name] ?? "";
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="text-sm font-bold text-slate-700">
              {field.label}
              {field.required && <span className="text-rose-500"> *</span>}
            </label>

            {field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={value}
                className={inputClass}
              >
                <option value="" disabled>
                  Pilih…
                </option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={value}
                placeholder={field.placeholder}
                rows={3}
                className={inputClass}
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                defaultValue={value}
                placeholder={field.placeholder}
                className={inputClass}
              />
            )}
          </div>
        );
      })}

      {def.photo && (
        <div>
          <label htmlFor="foto" className="text-sm font-bold text-slate-700">
            Foto Bukti
          </label>
          <input id="foto" name="foto" type="file" accept="image/*" className="mt-1 w-full text-sm" />
          <p className="mt-1 text-xs text-slate-400">
            Fase ini hanya mencatat nama file; unggah foto ke storage menyusul.
          </p>
        </div>
      )}

      <p className="rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">{def.routeNote}</p>

      <button type="submit" className="btn-primary mt-1 text-base">
        <Send className="h-4 w-4" aria-hidden />
        Kirim
      </button>
    </form>
  );
}
