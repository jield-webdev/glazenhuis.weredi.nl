import type { Metadata } from 'next';
import Link from 'next/link';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/titillium-web/600.css';
import '@fontsource/titillium-web/700.css';
import './globals.css';
import { getSite, origin } from '../lib/content';
import { JsonLd } from '../lib/seo';
import { MobileNav } from '../components/mobile-nav';
import { Donate } from '../components/ui';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> { const { settings: s }=await getSite(); return {
 metadataBase: new URL(origin), title: { default: s.siteTitle, template: `%s | ${s.siteTitle}` }, description: s.description,
 alternates: { canonical: '/' }, openGraph: { title: s.siteTitle, description: s.description, siteName:s.siteTitle, locale:'nl_NL', type:'website', images:['/opengraph-image'] }, twitter: { card:'summary_large_image' }, robots: { index:true, follow:true },
 }; }
export default async function Layout({ children }: { children: React.ReactNode }) { const site=await getSite(); const s=site.settings,l=s.labels;
 const navigation=<><Link href="/nieuws">{l.news}</Link><Link href="/acties">{l.actions}</Link><Link href="/fotos">{l.photos}</Link><Link href="/over-het-glazen-huis">{l.about}</Link></>;
 return <html lang="nl"><body><a className="skip" href="#main">{l.skip}</a><div className="topbar"><div className="container"><span>{l.campaign}</span><a href="https://weredi.nl/">weredi.nl ↗</a></div></div><header className="header"><div className="container header-inner"><Link href="/" className="brand" aria-label={`${s.siteTitle} – ${l.home}`}><img src="/images/weredi-logo.svg" width="180" height="36" alt="Were Di"/><span>GLAZEN HUIS</span></Link><nav className="desktop-nav" aria-label="Hoofdnavigatie">{navigation}</nav><div className="header-action"><Donate site={site}/></div><MobileNav label={l.menu}>{navigation}<Donate site={site}/></MobileNav></div></header><main id="main">{children}</main><footer><div className="container footer-grid"><div><Link href="/" className="brand"><img src="/images/weredi-logo.svg" alt="Were Di" width="180" height="36"/><span>GLAZEN HUIS</span></Link><p>{s.footerText}</p><p className="muted">{l.organizer}</p></div><nav aria-label="Footernavigatie">{navigation}</nav><div><a href={s.seriousRequestUrl?.startsWith('https://') ? s.seriousRequestUrl : undefined}>3FM Serious Request ↗</a><Link href="/privacy">{l.privacy}</Link><a href={process.env.CMS_ADMIN_URL || '/cms/admin'}>{l.admin}</a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Were Di</span><span>{s.location}</span></div></footer><JsonLd value={{'@context':'https://schema.org','@type':'WebSite',name:s.siteTitle,url:origin,inLanguage:'nl-NL',publisher:{'@type':'EducationalOrganization',name:'Scholengemeenschap Were Di',url:'https://weredi.nl/'}}}/></body></html>;
}
