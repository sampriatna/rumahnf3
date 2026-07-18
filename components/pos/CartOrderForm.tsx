"use client";

import { useMemo, useState } from "react";
import type { SalesChannel } from "@/lib/channel-service";
import type { PosOutletConfig } from "@/lib/pos-outlet-config";
import type { FloorTable } from "@/lib/pos-floor";
import { channelLabelIndonesia } from "@/lib/pos-channel-labels";
import { POS_PRIMARY_CHANNEL_KINDS } from "@/lib/pos-channel-labels";
import { addToOpenBillAction, createOrderAction } from "@/app/pos-actions";
import { TableSelector } from "./TableSelector";
import { WaiterSelector } from "./WaiterSelector";
import { OrderNote } from "./OrderNote";
import { PlaceOrderButton, PaymentButton } from "./PosActionButtons";
import { DiscountSection } from "./DiscountSection";
import type { PosWaiterOption } from "@/lib/pos-waiter-service";

export function CustomerSelector({
  visible,
  defaultValue
}: {
  visible: boolean;
  defaultValue?: string;
}) {
  if (!visible) return null;

  return (
    <div>
      <label htmlFor="customerName" className="nf3-field-label">
        Nama Pelanggan (opsional)
      </label>
      <input
        id="customerName"
        name="customerName"
        type="text"
        defaultValue={defaultValue ?? ""}
        placeholder="Nama untuk struk / panggilan"
        className="nf3-input mt-1 font-semibold"
      />
    </div>
  );
}

export function MemberCodeField() {
  return (
    <div>
      <label htmlFor="memberCode" className="nf3-field-label">
        Kode Member (opsional)
      </label>
      <input
        id="memberCode"
        name="memberCode"
        type="text"
        placeholder="Mis. KBU001"
        className="nf3-input mt-1 font-semibold uppercase"
      />
      <p className="mt-1 text-[11px] text-slate-500">
        Jika valid, member otomatis terlampir saat checkout dibuka.
      </p>
    </div>
  );
}

export function CartOrderForm({
  outletId,
  shiftId,
  channels,
  posCfg,
  floorTables,
  defaultTable,
  openBillMode,
  waiters = []
}: {
  outletId: string;
  shiftId: string;
  channels: SalesChannel[];
  posCfg: PosOutletConfig;
  floorTables: FloorTable[];
  defaultTable?: string;
  openBillMode: boolean;
  waiters?: PosWaiterOption[];
}) {
  const primary = useMemo(
    () => channels.filter((c) => POS_PRIMARY_CHANNEL_KINDS.includes(c.kind)),
    [channels]
  );
  const options = primary.length > 0 ? primary : channels;
  const [channelId, setChannelId] = useState(posCfg.defaultChannel);

  const channelMeta = options.find((c) => c.id === channelId);
  const tableRequired = channelMeta?.requiresTable ?? posCfg.requireTable;
  const showCustomer =
    channelMeta?.kind === "takeaway" ||
    channelMeta?.kind === "delivery_own" ||
    channelMeta?.kind === "platform";

  return (
    <form
      action={openBillMode ? addToOpenBillAction : createOrderAction}
      className="grid gap-2"
    >
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="shiftId" value={shiftId} />

      <div>
        <label htmlFor="channel" className="nf3-field-label">
          Tipe Pesanan
        </label>
        <select
          id="channel"
          name="channel"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="nf3-select mt-1 font-semibold"
        >
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {channelLabelIndonesia(c.id, c.name, c.kind)}
            </option>
          ))}
        </select>
      </div>

      <TableSelector
        tables={floorTables}
        posCfg={posCfg}
        defaultValue={defaultTable}
        required={tableRequired}
      />

      <CustomerSelector visible={showCustomer} />
      <MemberCodeField />
      <WaiterSelector waiters={waiters} />
      <DiscountSection outletId={outletId} />

      {openBillMode && <OrderNote />}
      {openBillMode ? (
        <PlaceOrderButton label="Simpan ke Bill" />
      ) : (
        <PaymentButton />
      )}
    </form>
  );
}
