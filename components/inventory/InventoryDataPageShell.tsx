import { InventoryDataNav, type InventoryDataNavKey } from "./InventoryDataNav";
import { InventoryPageHeader } from "./InventoryPageHeader";

export function InventoryDataPageShell({
  title,
  subtitle,
  active,
  maxWidth = "max-w-5xl",
  children
}: {
  title: string;
  subtitle?: string;
  active: InventoryDataNavKey;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={maxWidth}>
      <InventoryPageHeader title={title} subtitle={subtitle} />
      <InventoryDataNav active={active} />
      {children}
    </div>
  );
}
