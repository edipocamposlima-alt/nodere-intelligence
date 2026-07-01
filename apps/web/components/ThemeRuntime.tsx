"use client";

import { useEffect } from "react";
import { getPublicSettings } from "@/lib/api";
import { applyThemeSettings, readAndApplyThemeSettings, readThemeSettings, writeThemeSettings } from "@/lib/theme";

export function ThemeRuntime() {
  useEffect(() => {
    try {
      readAndApplyThemeSettings();
      getPublicSettings()
        .then((payload) => {
          const local = readThemeSettings();
          const remote = payload.preferences ?? {};
          const shouldUseRemoteTheme = !local.themeUpdatedAt && Boolean(remote.theme || remote.mode);
          const settings = writeThemeSettings({
            ...remote,
            ...local,
            ...(shouldUseRemoteTheme ? { theme: remote.theme, mode: remote.mode } : {})
          });
          applyThemeSettings(settings);
        })
        .catch(() => undefined);
      window.addEventListener("storage", readAndApplyThemeSettings);
      window.addEventListener("nodere:theme-change", readAndApplyThemeSettings);
      return () => {
        window.removeEventListener("storage", readAndApplyThemeSettings);
        window.removeEventListener("nodere:theme-change", readAndApplyThemeSettings);
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}
