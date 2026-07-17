"use client";

import { useCallback } from "react";
import type { KdsSoundSettings } from "@/types/kds";
import { DEFAULT_KDS_SOUND } from "@/types/kds";

const STORAGE_KEY = "kds-sound-settings";

export function loadKdsSoundSettings(): KdsSoundSettings {
  if (typeof window === "undefined") return DEFAULT_KDS_SOUND;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KDS_SOUND;
    return { ...DEFAULT_KDS_SOUND, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_KDS_SOUND;
  }
}

export function saveKdsSoundSettings(settings: KdsSoundSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Chime keras untuk dapur — Web Audio API, tanpa file eksternal. */
export function playKdsAlert(volume = 0.85) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = Math.min(1, Math.max(0, volume));
    gain.connect(ctx.destination);

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    playTone(880, 0, 0.12);
    playTone(1100, 0.14, 0.12);
    playTone(1320, 0.28, 0.18);

    setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore — autoplay policy */
  }
}

export function useKdsSoundPlayer() {
  return useCallback((volume?: number) => {
    const s = loadKdsSoundSettings();
    if (!s.enabled) return;
    playKdsAlert(volume ?? s.volume);
  }, []);
}
