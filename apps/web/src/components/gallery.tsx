'use client';
import { useEffect, useRef, useState } from 'react';
import type { Media } from '../lib/types';
export function Gallery({ photos, labels }: { photos: Media[]; labels: Record<string,string> }) {
 const [selected, setSelected] = useState(0); const dialog = useRef<HTMLDialogElement>(null);
 const show = (index: number) => { setSelected(index); dialog.current?.showModal(); };
 const move = (step: number) => setSelected(index => (index + step + photos.length) % photos.length);
 useEffect(() => { const handler = (event: KeyboardEvent) => { if (!dialog.current?.open) return; if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [photos.length]);
 return <><div className="gallery">{photos.map((photo, i) => <button key={photo.url} className="photo" onClick={()=>show(i)} aria-label={`${labels.openPhoto} ${i+1}`}><img src={photo.url} alt={photo.alternativeText || ''} loading="lazy" /></button>)}</div><dialog ref={dialog} className="lightbox" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} aria-label={labels.photos}><button className="close" onClick={()=>dialog.current?.close()}>{labels.close} ×</button>{photos[selected] && <figure><img src={photos[selected].url} alt={photos[selected].alternativeText || ''} /><figcaption>{photos[selected].alternativeText} · {selected+1} / {photos.length}</figcaption></figure>}<div className="viewer-controls"><button onClick={()=>move(-1)}>{labels.previousPhoto}</button><button onClick={()=>move(1)}>{labels.nextPhoto}</button></div></dialog></>;
}
