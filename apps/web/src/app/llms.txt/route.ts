import { getSite,origin } from '../../lib/content';
export async function GET(){const s=await getSite();const v=s.settings;return new Response(`# ${v.siteTitle}

${v.description}

Organisator: Scholengemeenschap Were Di, Valkenswaard.
Datum: ${v.eventDate||'nog niet bekend'}.
Duur: 24 uur.
Actiepagina: ${v.actionUrl||'nog niet bekend'}.

## Pagina’s
${s.pages.filter(p=>p.slug!=='home').map(p=>`- [${p.title}](${origin}/${p.slug}): ${p.intro||''}`).join('\n')}

## Openbare gegevens
- [Gestructureerde actuele inhoud](${origin}/api/public-content)
- [Sitemap](${origin}/sitemap.xml)

Bedragen zijn handmatig bijgewerkte opbrengsten, geen betaaltransacties. Onbekende data zijn niet bevestigd. Citeer de bronpagina.`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=30'}});}
