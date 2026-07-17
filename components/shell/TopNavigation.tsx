import Link from "next/link";
import { Menu } from "lucide-react";
import type { SessionPayload } from "@/lib/session";
import type { ShellNavItem, ShellShortcut } from "@/lib/nav-items";
import { canShowOutletSwitcher } from "@/lib/nav-items";
import type { OutletIdentity } from "@/lib/outlet-identity";
import { shellLayout } from "@/lib/design-tokens";
import { OutletSwitcher } from "./OutletSwitcher";
import { UserMenu } from "./UserMenu";

export function TopNavigation({
  session,
  pageTitle,
  shortcuts,
  outlets,
  activeOutletSlug,
  activeOutletLabel,
  onMenuClick
}: {
  session: SessionPayload;
  pageTitle: string;
  shortcuts: ShellShortcut[];
  outlets: OutletIdentity[];
  activeOutletSlug: string | null;
  activeOutletLabel: string;
  onMenuClick?: () => void;
}) {
  const showOutletSwitcher = canShowOutletSwitcher(session);

  return (
    <header
      className={`sticky top-0 z-20 flex ${shellLayout.topBarHeight} shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm lg:gap-4 lg:px-6`}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-navy-800 lg:hidden"
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-black text-navy-900 lg:flex-none lg:text-base">
        {pageTitle}
      </h1>

      {shortcuts.length > 0 && (
        <nav
          aria-label="Shortcut operasional"
          className="hidden items-center gap-1 md:flex"
        >
          {shortcuts.map((s) =>
            s.external ? (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-navy-800"
              >
                {s.label}
              </a>
            ) : (
              <Link
                key={s.id}
                href={s.href}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-navy-800"
              >
                {s.label}
              </Link>
            )
          )}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-3">
        {showOutletSwitcher && (
          <OutletSwitcher
            outlets={outlets}
            activeSlug={activeOutletSlug}
            activeLabel={activeOutletLabel}
          />
        )}
        {!showOutletSwitcher && activeOutletLabel && (
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline">
            {activeOutletLabel}
          </span>
        )}
        <UserMenu session={session} />
      </div>
    </header>
  );
}
