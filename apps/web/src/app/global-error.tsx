'use client';
export default function GlobalError({reset}:{reset:()=>void}){return <html lang="nl"><body style={{fontFamily:'sans-serif',padding:40}}><h1>Even geen verbinding</h1><p>De website is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.</p><button onClick={reset}>Opnieuw proberen</button></body></html>;}
