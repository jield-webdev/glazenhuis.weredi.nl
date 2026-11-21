import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSite, imageUrl, origin } from '../../../lib/content';
import { pageMeta, JsonLd, breadcrumb } from '../../../lib/seo';
import { date, money } from '../../../lib/format';
import { Markdown } from '../../../components/markdown';
import { Gallery } from '../../../components/gallery';
import type { Site } from '../../../lib/types';
type Props={params:Promise<{slug:string;item:string}>};
const collection = (site:Site,slug:string) => slug==='nieuws'?site.news:slug==='acties'?site.actions:slug==='fotos'?site.albums:[];
export async function generateMetadata({params}:Props){const {slug,item}=await params;const site=await getSite();return pageMeta(collection(site,slug).find(x=>x.slug===item),`/${slug}/${item}`);}
export default async function Detail({params}:Props){const {slug,item}=await params;const site=await getSite();const entry=collection(site,slug).find(x=>x.slug===item);if(!entry)notFound();const l=site.settings.labels;return <article className="container section narrow"><Link className="text-link" href={`/${slug}`}>{l.back}</Link><div className="page-heading">{entry.date&&<time dateTime={entry.date}>{date(entry.date)}</time>}<h1>{entry.title}</h1><p className="lead">{entry.intro}</p></div>{entry.image&&<img className="article-image" src={imageUrl(entry.image)} alt={entry.imageAlt||entry.image.alternativeText||''}/ >}{slug==='acties'&&<div className="action-total"><span>{l.actionAmount}</span><strong>{money(Number(entry.amount)||0)}</strong></div>}<Markdown>{entry.body}</Markdown>{slug==='fotos'&&<Gallery photos={(entry.photos||[]).map(photo=>({...photo,url:imageUrl(photo)!}))} labels={l}/>}<JsonLd value={breadcrumb(entry.title,`/${slug}/${item}`)}/>{slug==='nieuws'&&<JsonLd value={{'@context':'https://schema.org','@type':'NewsArticle',headline:entry.title,description:entry.intro,datePublished:entry.date,dateModified:entry.updatedAt,inLanguage:'nl-NL',mainEntityOfPage:origin+`/${slug}/${item}`,author:{'@type':'Organization',name:'Were Di'},...(entry.image?{image:imageUrl(entry.image)}:{})}}/>}</article>;}
