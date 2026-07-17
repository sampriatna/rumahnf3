export function OrderNote({ name = "sendKitchen" }: { name?: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <input type="checkbox" name={name} className="rounded" />
      Langsung kirim ke dapur setelah disimpan
    </label>
  );
}
