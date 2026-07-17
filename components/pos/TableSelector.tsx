import type { FloorTable } from "@/lib/pos-floor";
import type { PosOutletConfig } from "@/lib/pos-outlet-config";

export function TableSelector({
  tables,
  posCfg,
  defaultValue,
  required,
  name = "tableLabel"
}: {
  tables: FloorTable[];
  posCfg: PosOutletConfig;
  defaultValue?: string;
  required?: boolean;
  name?: string;
}) {
  const isRequired = required ?? posCfg.requireTable;

  if (tables.length > 0) {
    return (
      <div>
        <label htmlFor={name} className="nf3-field-label">
          {isRequired ? "Pilih Meja" : "Meja (opsional)"}
        </label>
        <select
          id={name}
          name={name}
          required={isRequired}
          defaultValue={defaultValue ?? ""}
          className="nf3-select mt-1 font-semibold"
        >
          <option value="">{isRequired ? "— Pilih meja —" : "Tanpa meja"}</option>
          {tables.map((t) => (
            <option key={t.id} value={t.label}>
              {t.label}
              {t.seats ? ` (${t.seats} kursi)` : ""}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} className="nf3-field-label">
        {isRequired ? "Nomor Meja" : "Meja / Catatan"}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={isRequired}
        defaultValue={defaultValue ?? ""}
        placeholder={isRequired ? "No. meja (wajib)" : "Meja / catatan (opsional)"}
        className="nf3-input mt-1 font-semibold"
      />
      {isRequired && (
        <p className="nf3-subtle mt-1">Makan di tempat wajib memilih atau mengisi meja.</p>
      )}
    </div>
  );
}
