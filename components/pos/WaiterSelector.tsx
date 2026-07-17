import type { PosWaiterOption } from "@/lib/pos-waiter-service";

export function WaiterSelector({
  waiters = [],
  disabled
}: {
  waiters?: PosWaiterOption[];
  disabled?: boolean;
}) {
  if (disabled || waiters.length === 0) return null;

  return (
    <div>
      <label htmlFor="waiterId" className="nf3-field-label">
        Pelayan (opsional)
      </label>
      <select id="waiterId" name="waiterId" className="nf3-select mt-1 font-semibold" defaultValue="">
        <option value="">— Tanpa pelayan —</option>
        {waiters.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
    </div>
  );
}
