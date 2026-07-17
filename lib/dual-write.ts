import { PHASE0_FLAGS } from "./phase0-flags";

export type DualWriteDomain = "kds" | "pos" | "inventory" | "finance";

function configuredDomains(): Set<DualWriteDomain> | null {
  const raw = process.env.NF3_FF_DUAL_WRITE_DOMAINS?.trim();
  if (!raw) return null;
  const allowed: DualWriteDomain[] = ["kds", "pos", "inventory", "finance"];
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter((v): v is DualWriteDomain => allowed.includes(v as DualWriteDomain))
  );
}

export function isDualWriteEnabledFor(domain: DualWriteDomain): boolean {
  if (!PHASE0_FLAGS.dualWriteEnabled) return false;
  const domains = configuredDomains();
  if (!domains || domains.size === 0) return true;
  return domains.has(domain);
}

export function isDualWriteStrict(): boolean {
  return PHASE0_FLAGS.dualWriteStrict;
}
