"use client";

import { useState, type ReactNode } from "react";
import type { MenuGroupSection } from "@/lib/dashboard-groups";
import { DashboardMenuGrid } from "@/components/DashboardMenuGrid";

type Tab = "ringkasan" | "menu";

export function OwnerDashboardShell({
  summary,
  menuSections,
  hideMenuTab = false
}: {
  summary: ReactNode;
  menuSections: MenuGroupSection[];
  hideMenuTab?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [activeSection, setActiveSection] = useState(menuSections[0]?.group ?? "");

  if (hideMenuTab) {
    return <div className="min-h-[320px]">{summary}</div>;
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Tampilan dashboard"
        className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ringkasan"}
          onClick={() => setTab("ringkasan")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
            tab === "ringkasan"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-slate-600 hover:text-navy-800"
          }`}
        >
          Ringkasan Hari Ini
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "menu"}
          onClick={() => setTab("menu")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
            tab === "menu"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-slate-600 hover:text-navy-800"
          }`}
        >
          Menu & Modul
        </button>
      </div>

      {tab === "ringkasan" && (
        <div role="tabpanel" className="min-h-[320px]">
          {summary}
        </div>
      )}

      {tab === "menu" && (
        <div role="tabpanel" className="min-h-[320px]">
          <nav
            aria-label="Loncat ke bagian menu"
            className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
          >
            {menuSections.map((section) => (
              <button
                key={section.group}
                type="button"
                onClick={() => {
                  setActiveSection(section.group);
                  document.getElementById(`menu-${section.group}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }}
                className={`shrink-0 px-3 py-1.5 transition ${
                  activeSection === section.group
                    ? "nf3-chip-active"
                    : "nf3-chip hover:bg-slate-200"
                }`}
              >
                {section.label.replace(/ &.*/, "")}
              </button>
            ))}
          </nav>

          {menuSections.map((section) => (
            <div
              key={section.group}
              id={`menu-${section.group}`}
              className="mb-10 scroll-mt-4"
            >
              <h2 className="dashboard-section-title">{section.label}</h2>
              <div className="mt-4">
                <DashboardMenuGrid items={section.items} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
