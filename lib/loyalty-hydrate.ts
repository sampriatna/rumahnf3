import { isSupabaseConfigured } from "./supabase";
import { pullLoyalty, pushLoyalty } from "./db/loyalty-repo";
import { store } from "./store";
import {
  seedCustomers,
  seedLoyaltyPrograms,
  seedTiers
} from "./loyalty";

let loyaltyHydrated = false;

function applyLoyaltySnapshot(snap: Awaited<ReturnType<typeof pullLoyalty>>) {
  if (!snap) return;
  const s = store();
  s.customers = snap.customers;
  s.membershipTiers = snap.membershipTiers;
  s.loyaltyPrograms = snap.loyaltyPrograms;
  s.loyaltyTxns = snap.loyaltyTxns;
  s.vouchers = snap.vouchers;
  s.rewardRedemptions = snap.rewardRedemptions;
  s.loyaltySeeded = true;
}

function seedDemoLoyalty() {
  const s = store();
  if (!s.loyaltySeeded) {
    s.loyaltyPrograms = seedLoyaltyPrograms();
    s.membershipTiers = seedTiers();
    s.customers = seedCustomers();
    s.loyaltyTxns = [];
    s.vouchers = [];
    s.rewardRedemptions = [];
    s.loyaltySeeded = true;
  }
  if (s.membershipTiers.length === 0) s.membershipTiers = seedTiers();
}

/**
 * Muat Member/Loyalty dari Supabase (sumber kebenaran P3).
 * Jika tabel kosong, seed demo lalu push ke Supabase.
 */
export async function hydrateLoyaltyFromSupabase(): Promise<void> {
  if (loyaltyHydrated) return;
  loyaltyHydrated = true;

  if (!isSupabaseConfigured()) {
    seedDemoLoyalty();
    return;
  }

  try {
    const snap = await pullLoyalty();
    if (snap && snap.customers.length > 0) {
      applyLoyaltySnapshot(snap);
      return;
    }

    seedDemoLoyalty();
    const s = store();
    await pushLoyalty({
      customers: s.customers,
      membershipTiers: s.membershipTiers,
      loyaltyPrograms: s.loyaltyPrograms,
      loyaltyTxns: s.loyaltyTxns,
      vouchers: s.vouchers,
      rewardRedemptions: s.rewardRedemptions
    });
  } catch {
    seedDemoLoyalty();
  }
}
