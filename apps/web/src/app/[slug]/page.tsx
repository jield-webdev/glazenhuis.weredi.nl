import { notFound } from 'next/navigation';
import { getSite } from '../../lib/content';
import { pageMeta, JsonLd, breadcrumb } from '../../lib/seo';
import { safeUrl } from '../../lib/format';
import { Markdown } from '../../components/markdown';
import { Cards, Progress, Donate } from '../../components/ui';
type Props = { params: Promise<{slug:string}> };
export async function generateMetadata({params}: Props) {const {slug}=await params;const site=await getSite();return pageMeta(site.pages.find(p=>p.slug===slug) || (slug==='steun-ons'?{title:site.settings.labels.donate,slug}:undefined),`/${slug}`);}
export default async function Page({params}:Props) { const {slug}=await params;const site=await getSite();const s=site.settings,l=s.labels;const page=site.pages.find(p=>p.slug===slug);const kind=({nieuws:'news',acties:'actions',fotos:'albums'} as const)[slug as 'nieuws'|'acties'|'fotos'];
 if(slug==='steun-ons')return <section className="container section narrow"><span className="eyebrow">{l.campaign}</span><h1>{l.donate}</h1><p className="lead">{safeUrl(s.actionUrl)?s.description:l.donationPending}</p>{safeUrl(s.actionUrl)?<Donate site={site}/>:<a className="button pink" href={safeUrl(s.seriousRequestUrl)}>{l.srLabel}</a>}<Progress site={site}/></section>;
 if(!page || slug==='home')notFound();
 return <section className="container section"><div className="page-heading"><span className="eyebrow">{s.siteTitle}</span><h1>{page.title}</h1><p className="lead">{page.intro}</p></div>{slug==='acties'&&<Progress site={site}/>}<Markdown>{page.body}</Markdown>{kind&&<Cards entries={site[kind]} kind={kind} site={site}/>}<JsonLd value={breadcrumb(page.title,`/${slug}`)}/></section>;
}
