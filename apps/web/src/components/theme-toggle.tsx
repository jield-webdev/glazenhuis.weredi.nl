'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const storageKey = 'weredi-theme';
type Theme = 'light' | 'dark';

export function ThemeToggle() {
 const [theme, setTheme] = useState<Theme>('light');

 useEffect(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const sync = () => {
   let saved: string | null = null;
   try { saved = localStorage.getItem(storageKey); } catch { /* Device preference works without storage. */ }
   const next = saved === 'light' || saved === 'dark' ? saved : media.matches ? 'dark' : 'light';
   document.documentElement.dataset.theme = next;
   setTheme(next);
  };
  sync();
  media.addEventListener('change', sync);
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) sync(); };
  window.addEventListener('storage', onStorage);
  return () => {
   media.removeEventListener('change', sync);
   window.removeEventListener('storage', onStorage);
  };
 }, []);

 function toggle() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  setTheme(next);
  try { localStorage.setItem(storageKey, next); } catch { /* Keep the current page usable when storage is blocked. */ }
 }

 return <button type="button" className="theme-toggle" onClick={toggle} aria-label="Donkere modus" aria-pressed={theme === 'dark'} title="Donkere modus aan/uit">
  <Moon className="theme-moon" size={20} aria-hidden="true" />
  <Sun className="theme-sun" size={20} aria-hidden="true" />
 </button>;
}
