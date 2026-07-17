function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return fallback;
}

/**
 * Feature flags untuk rollout incremental PHASE 0.
 * Default dibuat konservatif agar aman untuk produksi.
 */
export const PHASE0_FLAGS = {
  canonicalOutletIdentity: parseBool(process.env.NF3_FF_CANONICAL_OUTLET_IDENTITY, true),
  authorizationPipeline: parseBool(process.env.NF3_FF_AUTHORIZATION_PIPELINE, false),
  kdsCanonicalBoardWriter: parseBool(process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER, true),
  dualWriteEnabled: parseBool(process.env.NF3_FF_DUAL_WRITE_ENABLED, false),
  dualWriteStrict: parseBool(process.env.NF3_FF_DUAL_WRITE_STRICT, false),
  persistenceMismatchLog: parseBool(
    process.env.NF3_FF_PERSISTENCE_MISMATCH_LOG ?? process.env.FF_PERSISTENCE_MISMATCH_LOG_V1,
    false
  ),
  auditLogFoundation: parseBool(
    process.env.NF3_FF_AUDIT_LOG_FOUNDATION ?? process.env.FF_AUDIT_LOG_FOUNDATION_V1,
    true
  )
} as const;

export function dualWriteRollbackActive() {
  return !PHASE0_FLAGS.dualWriteEnabled;
}
