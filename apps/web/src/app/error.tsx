'use client';
export default function Error({reset}:{reset:()=>void}){return <section className="container section"><h1>Even geen verbinding</h1><p>We kunnen de informatie op dit moment niet ophalen.</p><button className="button pink" onClick={reset}>Opnieuw proberen</button></section>;}
