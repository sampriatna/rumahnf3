"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { KdsSoundSettings } from "@/types/kds";
import { DEFAULT_KDS_SOUND } from "@/types/kds";
import { loadKdsSoundSettings, saveKdsSoundSettings, playKdsAlert } from "@/lib/kds-sound";

export function KdsSoundSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<KdsSoundSettings>(DEFAULT_KDS_SOUND);

  useEffect(() => {
    setSettings(loadKdsSoundSettings());
  }, []);

  const update = (patch: Partial<KdsSoundSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveKdsSoundSettings(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-navy-700"
        aria-expanded={open}
      >
        {settings.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        Suara
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-navy-700 bg-navy-900 p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gold-400">Notifikasi Suara</h3>

          <label className="mb-3 flex cursor-pointer items-center justify-between text-sm">
            <span>Suara aktif</span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="h-5 w-5 rounded"
            />
          </label>

          <label className="mb-1 block text-xs font-bold text-slate-400">
            Volume ({Math.round(settings.volume * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="mb-4 w-full"
          />

          <label className="mb-1 block text-xs font-bold text-slate-400">
            Ulang alert (detik) — order BARU belum diproses
          </label>
          <select
            value={settings.repeatIntervalSec}
            onChange={(e) => update({ repeatIntervalSec: Number(e.target.value) })}
            className="mb-4 w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm"
          >
            <option value={30}>30 detik</option>
            <option value={60}>60 detik (default)</option>
            <option value={90}>90 detik</option>
            <option value={120}>2 menit</option>
          </select>

          <button
            type="button"
            onClick={() => playKdsAlert(settings.volume)}
            className="w-full rounded-xl bg-gold-400 py-3 text-sm font-black text-navy-900 hover:bg-gold-500"
          >
            Test Suara
          </button>
        </div>
      )}
    </div>
  );
}
