import type { SessionPayload } from "./session";
import type { AccountId } from "./finance";

type Identity = {
  name?: string;
  email?: string;
  phone?: string;
};

function normalize(v?: string) {
  return (v ?? "").trim().toLowerCase();
}

function isAbdulKhafidIdentity(identity: Identity) {
  const name = normalize(identity.name);
  const email = normalize(identity.email);
  const phone = normalize(identity.phone);
  return (
    name === "abdul khafid" ||
    email === "abdulkhafid0910@gmail.com" ||
    phone === "085715337677" ||
    phone === "6285715337677"
  );
}

export function workUnitForIdentity(identity: Identity): string | undefined {
  return isAbdulKhafidIdentity(identity) ? "Jagasatru" : undefined;
}

export function isJagasatruPurchasingIdentity(identity: Identity) {
  return isAbdulKhafidIdentity(identity);
}

export type FinanceAccess = {
  canOpenFinance: boolean;
  viewAccounts: AccountId[];
  inputAccounts: AccountId[];
  canTransfer: boolean;
  canVerify: boolean;
  canManageWalletSettings: boolean;
  areaUnit?: string;
};

export function financeAccessForSession(session: SessionPayload | null): FinanceAccess {
  if (!session) {
    return {
      canOpenFinance: false,
      viewAccounts: [],
      inputAccounts: [],
      canTransfer: false,
      canVerify: false,
      canManageWalletSettings: false
    };
  }

  const isOwnerAdmin =
    session.isSuperAdmin === true || session.role === "owner" || session.role === "admin";

  if (isOwnerAdmin) {
    const all: AccountId[] = [
      "cash_physical",
      "bank",
      "jagasatru_wallet",
      "purchasing_kecil_wallet",
      "qris_pending",
      "gofood_pending",
      "marketplace_pending"
    ];
    return {
      canOpenFinance: true,
      viewAccounts: all,
      inputAccounts: all,
      canTransfer: true,
      canVerify: true,
      canManageWalletSettings: true
    };
  }

  if (
    isJagasatruPurchasingIdentity({
      name: session.name,
      email: session.email,
      phone: session.phone
    })
  ) {
    return {
      canOpenFinance: true,
      viewAccounts: ["jagasatru_wallet", "bank"],
      inputAccounts: ["jagasatru_wallet", "bank"],
      canTransfer: false,
      canVerify: false,
      canManageWalletSettings: false,
      areaUnit: "Jagasatru"
    };
  }

  return {
    canOpenFinance: false,
    viewAccounts: [],
    inputAccounts: [],
    canTransfer: false,
    canVerify: false,
    canManageWalletSettings: false
  };
}

export function canViewFinanceAccount(session: SessionPayload | null, accountId: AccountId) {
  return financeAccessForSession(session).viewAccounts.includes(accountId);
}

export function canInputFinanceAccount(session: SessionPayload | null, accountId: AccountId) {
  return financeAccessForSession(session).inputAccounts.includes(accountId);
}

export function canViewPurchasingKecil(session: SessionPayload | null) {
  return canViewFinanceAccount(session, "purchasing_kecil_wallet");
}

export function canAccessPurchasingFeature(session: SessionPayload | null) {
  if (!session) return false;
  if (session.isSuperAdmin === true || session.role === "owner" || session.role === "admin") return true;
  if (session.role === "leader") return true;
  return isJagasatruPurchasingIdentity({ name: session.name, email: session.email });
}
