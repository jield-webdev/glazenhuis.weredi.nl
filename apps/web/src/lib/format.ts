export const money = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
export const date = (value: string) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeZone: 'Europe/Amsterdam' }).format(new Date(value));
export const safeUrl = (value?: string) => { try { const url = new URL(value || ''); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; } };
export function progress(amounts: (number | string | undefined)[], additional: number, target: number) {
 const total = amounts.reduce<number>((sum, value) => sum + Math.round(Math.max(0, Number(value) || 0) * 100), 0) + Math.round(Math.max(0, Number(additional) || 0) * 100);
 return { total: total / 100, percent: target > 0 ? Math.min(100, Math.max(0, total / target)) : 0 };
}
