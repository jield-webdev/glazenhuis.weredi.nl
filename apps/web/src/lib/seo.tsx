import type { Metadata } from 'next';
import { origin } from './content';
import type { Entry } from './types';
export const pageMeta = (page: Entry | undefined, path: string): Metadata => ({ title: page?.seoTitle || page?.title, description: page?.seoDescription || page?.intro, alternates: { canonical: path }, openGraph: { title: page?.seoTitle || page?.title, description: page?.seoDescription || page?.intro, url: path, locale: 'nl_NL', type: 'website' } });
export function JsonLd({ value }: { value: unknown }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, '\u003c') }} />; }
export const breadcrumb = (title: string, path: string) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin }, { '@type': 'ListItem', position: 2, name: title, item: origin + path }] });
