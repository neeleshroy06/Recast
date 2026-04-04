"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "recast-theme";

function applyTheme(mode: "light" | "dark") {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function subscribe(onChange: () => void) {
  const el = document.documentElement;
  const observer = new MutationObserver(() => onChange());
  observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("storage", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot() {
  return "light";
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    applyTheme(mode === "dark" ? "light" : "dark");
  }, [mode]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mounted
          ? mode === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle color theme"
      }
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--recast-border)] bg-[var(--recast-surface-elevated)] text-[var(--recast-text)] shadow-sm transition hover:border-[var(--recast-accent)] hover:text-[var(--recast-accent)]"
    >
      {mounted ? (
        mode === "dark" ? (
          <Sun className="h-5 w-5 text-[var(--recast-accent)]" />
        ) : (
          <Moon className="h-5 w-5 text-[var(--recast-text-muted)]" />
        )
      ) : (
        <span className="inline-block h-5 w-5 shrink-0" aria-hidden />
      )}
    </button>
  );
}
