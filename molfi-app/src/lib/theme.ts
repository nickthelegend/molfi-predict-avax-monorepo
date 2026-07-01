import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("lx-theme", theme);
  } catch {
    /* private mode */
  }
}

/** Subscribes to `html` class changes from the theme toggle. */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    setTheme(readTheme());
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(readTheme());
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
