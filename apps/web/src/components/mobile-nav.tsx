'use client';
import type { ReactNode } from 'react';
export function MobileNav({ label, children }: { label: string; children: ReactNode }) {
 return <details className="mobile-nav" onClick={event=>{ if ((event.target as HTMLElement).closest('a')) event.currentTarget.removeAttribute('open'); }}><summary>{label}</summary><nav aria-label="Mobiele navigatie">{children}</nav></details>;
}
