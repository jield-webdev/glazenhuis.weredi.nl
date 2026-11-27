import 'server-only';
import { cache } from 'react';
import type { Site, Media } from './types';
import seed from '../../../cms/src/seed-data.json';
export const origin = process.env.SITE_URL || 'https://glazenhuis.weredi.nl';
export const getSite = cache(async (): Promise<Site> => {
 if (process.env.CONTENT_MODE === 'demo') return { settings: seed.settings, pages: seed.pages, news: [], actions: [], albums: [] } as Site;
 const response = await fetch(`${process.env.CMS_URL || 'http://127.0.0.1:3006'}/api/site`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(8000) });
 if (!response.ok) throw new Error('Content service unavailable');
 return response.json();
});
export const imageUrl = (media?: Media) => media?.url ? (media.url.startsWith('/') ? `${process.env.CMS_PUBLIC_URL || process.env.NEXT_PUBLIC_CMS_URL || ''}${media.url}` : media.url) : undefined;
