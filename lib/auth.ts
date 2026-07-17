import { USERS } from "./mock-data";
import { isRole, type Role } from "./types";

// Autentikasi fase skeleton: cek terhadap data mock (phone + PIN).
// Akan diganti query Supabase (nf3.users, verifikasi bcrypt pin_hash) di fase berikutnya.

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
  outletId?: string;
  email?: string;
  phone?: string;
  isSuperAdmin?: boolean;
  capabilities?: import("./types").StaffCapability[];
};

export function authenticate(phone: string, pin: string): AuthUser | null {
  const cleanPhone = phone.trim();
  const cleanPin = pin.trim();

  const user = USERS.find((u) => u.phone === cleanPhone);
  if (!user || user.pin !== cleanPin) return null;
  if (!isRole(user.role)) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    outletId: user.outletId,
    phone: user.phone,
    capabilities: user.capabilities
  };
}
