import type { NextConfig } from 'next';
import { execFileSync } from 'node:child_process';

function buildHash() {
 if (process.env.BUILD_SHA || process.env.GITHUB_SHA) return process.env.BUILD_SHA || process.env.GITHUB_SHA;
 try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
 catch { return 'unknown'; }
}

const config: NextConfig = { poweredByHeader: false, env: {
 BUILD_HASH: buildHash(),
 BUILD_DATE: new Date().toISOString(),
}, async headers() { return [{ source: '/:path*', headers: [
 { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
 { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
 { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://localhost:3006; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'" }
 ] }]; } };
export default config;
