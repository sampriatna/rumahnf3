import bcrypt from "bcryptjs";

const ROUNDS = 10;

/** Hash PIN (4–8 digit) untuk simpan di Supabase. */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin.trim(), ROUNDS);
}

/** Verifikasi PIN terhadap hash bcrypt. */
export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  if (!pinHash) return false;
  try {
    return await bcrypt.compare(pin.trim(), pinHash);
  } catch {
    return false;
  }
}
