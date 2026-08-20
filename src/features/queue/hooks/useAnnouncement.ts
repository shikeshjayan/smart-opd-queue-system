"use client";

import { useCallback, useEffect, useState } from "react";

export type AnnouncementLanguage = "en" | "ml";

type AnnouncementPrefs = {
  enabled: boolean;
  volume: number;
  language: AnnouncementLanguage;
};

const STORAGE_KEY = "sh.display.audio";

const DEFAULT_PREFS: AnnouncementPrefs = {
  enabled: false,
  volume: 1,
  language: "en",
};

function readPrefs(): AnnouncementPrefs {
  if (typeof localStorage === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AnnouncementPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useAnnouncement() {
  const [prefs, setPrefs] = useState<AnnouncementPrefs>(readPrefs);
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
  }, [prefs]);

  const announce = useCallback(
    (text: string) => {
      if (!prefs.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = prefs.volume;
      utterance.lang = prefs.language === "ml" ? "ml-IN" : "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [prefs]
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setPrefs((prev) => ({ ...prev, enabled }));
  }, []);
  const setVolume = useCallback((volume: number) => {
    setPrefs((prev) => ({ ...prev, volume }));
  }, []);
  const setLanguage = useCallback((language: AnnouncementLanguage) => {
    setPrefs((prev) => ({ ...prev, language }));
  }, []);

  return {
    supported,
    enabled: prefs.enabled,
    volume: prefs.volume,
    language: prefs.language,
    setEnabled,
    setVolume,
    setLanguage,
    announce,
  };
}