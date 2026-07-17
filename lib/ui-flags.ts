function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return fallback;
}

/** Feature flags rollout UI (incremental, default konservatif). */
export const UI_FLAGS = {
  appShell: parseBool(process.env.NF3_FF_APP_SHELL_V1, false),
  posLayoutV2: parseBool(process.env.NF3_FF_POS_LAYOUT_V2, false),
  posDrawerNavV1: parseBool(process.env.NF3_FF_POS_DRAWER_NAV_V1, false),
  posSyncV1: parseBool(process.env.NF3_FF_POS_SYNC_V1, true),
  ordersPageV1: parseBool(process.env.NF3_FF_ORDERS_PAGE_V1, false),
  checkerReadV1: parseBool(process.env.NF3_FF_CHECKER_READ_V1, false),
  kdsSummaryV1: parseBool(process.env.NF3_FF_KDS_SUMMARY_V1, false),
  uiOpsV1: parseBool(process.env.NF3_FF_UI_OPS_V1, false),
  inventoryUiV1: parseBool(process.env.NF3_FF_UI_INVENTORY_V1, false)
} as const;
