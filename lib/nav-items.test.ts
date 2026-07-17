import { describe, expect, it } from "vitest";
import {
  isNavItemReady,
  buildShellNav,
  buildShellShortcuts,
  canShowOutletSwitcher
} from "./nav-items";
import type { MenuItem } from "./types";

describe("isNavItemReady", () => {
  it("menyembunyikan item ready:false dan /segera", () => {
    const blocked: MenuItem[] = [
      {
        id: "a",
        label: "A",
        desc: "",
        icon: "inbox",
        href: "/segera",
        phase: 1
      },
      {
        id: "b",
        label: "B",
        desc: "",
        icon: "inbox",
        href: "/finance",
        phase: 1,
        ready: false
      }
    ];
    const allowed: MenuItem = {
      id: "c",
      label: "C",
      desc: "",
      icon: "inbox",
      href: "/finance",
      phase: 1,
      ready: true
    };
    expect(isNavItemReady(blocked[0])).toBe(false);
    expect(isNavItemReady(blocked[1])).toBe(false);
    expect(isNavItemReady(allowed)).toBe(true);
  });
});

describe("buildShellNav", () => {
  it("owner mendapat ringkasan dan tidak memuat /segera", () => {
    const nav = buildShellNav({ role: "owner" });
    expect(nav[0]?.href).toBe("/dashboard");
    expect(nav.some((n) => n.href.startsWith("/segera"))).toBe(false);
  });

  it("leader mendapat menu terbatas tanpa placeholder", () => {
    const nav = buildShellNav({ role: "leader" });
    expect(nav[0]?.label).toBe("Ringkasan Outlet");
    expect(nav.some((n) => n.href.startsWith("/segera"))).toBe(false);
  });

  it("admin mendapat ringkasan dan modul siap", () => {
    const nav = buildShellNav({ role: "admin" });
    expect(nav[0]?.href).toBe("/dashboard");
    expect(nav.length).toBeGreaterThan(1);
  });
});

describe("canShowOutletSwitcher", () => {
  it("owner dan admin global melihat outlet switcher", () => {
    expect(canShowOutletSwitcher({ role: "owner", isSuperAdmin: false })).toBe(true);
    expect(canShowOutletSwitcher({ role: "admin", isSuperAdmin: false })).toBe(true);
  });

  it("leader dan staf satu outlet tidak melihat outlet switcher", () => {
    expect(canShowOutletSwitcher({ role: "leader", isSuperAdmin: false })).toBe(false);
    expect(canShowOutletSwitcher({ role: "staff", isSuperAdmin: false })).toBe(false);
  });
});

describe("buildShellShortcuts", () => {
  it("leader dengan outlet mendapat shortcut POS dan meja", () => {
    const shortcuts = buildShellShortcuts({ role: "leader", outletId: "kbu" });
    expect(shortcuts.some((s) => s.id === "pos")).toBe(true);
    expect(shortcuts.some((s) => s.id === "meja")).toBe(true);
  });

  it("shortcut mengikuti role — staf tidak ada di daftar kasir default", () => {
    const shortcuts = buildShellShortcuts({ role: "staff", outletId: "kbu" });
    expect(shortcuts.length).toBe(0);
  });
});
