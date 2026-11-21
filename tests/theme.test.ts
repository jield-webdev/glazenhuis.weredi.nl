import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { themeScript } from '../apps/web/src/lib/theme.ts';

function initialTheme(saved: string | null, systemDark: boolean, storageBlocked = false) {
 const root = { dataset: { theme: '' } };
 runInNewContext(themeScript, {
  document: { documentElement: root },
  localStorage: { getItem() { if (storageBlocked) throw new Error('Storage blocked'); return saved; } },
  window: { matchMedia: () => ({ matches: systemDark }) },
 });
 return root.dataset.theme;
}

test('theme follows the device until the visitor chooses a preference', () => {
 assert.equal(initialTheme(null, true), 'dark');
 assert.equal(initialTheme(null, false), 'light');
 assert.equal(initialTheme('light', true), 'light');
 assert.equal(initialTheme('dark', false), 'dark');
});

test('theme still initializes with unavailable or invalid browser storage', () => {
 assert.equal(initialTheme(null, true, true), 'dark');
 assert.equal(initialTheme(null, false, true), 'light');
 assert.equal(initialTheme('invalid', true), 'dark');
 assert.equal(initialTheme('invalid', false), 'light');
});
