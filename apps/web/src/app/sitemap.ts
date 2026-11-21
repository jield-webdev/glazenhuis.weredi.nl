import type { MetadataRoute } from 'next';
import { getSite,origin } from '../lib/content';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const site=await getSite();return [{url:origin,priority:1},...site.pages.filter(x=>x.slug!=='home').map(p=>({url:`${origin}/${p.slug}`,lastModified:p.updatedAt})),...(['news','actions','albums'] as const).flatMap((kind)=>site[kind].map(p=>({url:`${origin}/${{news:'nieuws',actions:'acties',albums:'fotos'}[kind]}/${p.slug}`,lastModified:p.updatedAt})))];}
export const dynamic='force-dynamic';
