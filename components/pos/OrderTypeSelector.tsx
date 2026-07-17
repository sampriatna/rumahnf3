import type { SalesChannel } from "@/lib/channel-service";
import {
  POS_PRIMARY_CHANNEL_KINDS,
  channelLabelIndonesia
} from "@/lib/pos-channel-labels";
import type { PosOutletConfig } from "@/lib/pos-outlet-config";

export function OrderTypeSelector({
  channels,
  defaultChannel,
  name = "channel"
}: {
  channels: SalesChannel[];
  defaultChannel: string;
  name?: string;
}) {
  const primary = channels.filter((c) => POS_PRIMARY_CHANNEL_KINDS.includes(c.kind));
  const options = primary.length > 0 ? primary : channels;

  return (
    <div>
      <label htmlFor={name} className="nf3-field-label">
        Tipe Pesanan
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultChannel}
        className="nf3-select mt-1 font-semibold"
      >
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {channelLabelIndonesia(c.id, c.name, c.kind)}
          </option>
        ))}
      </select>
      {primary.length < POS_PRIMARY_CHANNEL_KINDS.length && (
        <p className="nf3-subtle mt-1">
          Beberapa tipe pesanan belum dikonfigurasi di outlet ini.
        </p>
      )}
    </div>
  );
}

export function channelRequiresTable(
  channels: SalesChannel[],
  channelId: string,
  posCfg: PosOutletConfig
): boolean {
  const ch = channels.find((c) => c.id === channelId);
  return ch?.requiresTable ?? posCfg.requireTable;
}

/** @deprecated gunakan TableSelector */
export function TableInput({
  posCfg,
  defaultValue,
  name = "tableLabel",
  required
}: {
  posCfg: PosOutletConfig;
  defaultValue?: string;
  name?: string;
  required?: boolean;
}) {
  const isRequired = required ?? posCfg.requireTable;
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
    </div>
  );
}
