import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
if (process.env.INTEGRATION_TEST !== 'true') throw new Error('Run only on an isolated test database with INTEGRATION_TEST=true');
process.chdir(resolve('apps/cms'));
process.env.PORT = '1347';
process.env.CMS_PUBLIC_URL = 'http://127.0.0.1:1347';
const require=createRequire(resolve('package.json'));
const { createStrapi }=require('@strapi/strapi');
const app=await createStrapi({appDir:process.cwd(),distDir:resolve('dist')}).load();
const created=[];let upload;let temp;let web;
try {
 await app.listen();
 const docs=(kind)=>app.documents(`api::${kind}.${kind}`);
 const site=async()=>{const response=await fetch('http://127.0.0.1:1347/api/site?status=draft&populate=*');assert.equal(response.status,200);return response.json();};
 const suffix=Date.now();
 const action=await docs('action').create({data:{title:'Integratietest',slug:`integration-${suffix}`,amount:12.34}});created.push(['action',action.documentId]);
 assert.ok(!(await site()).actions.some(a=>a.slug===action.slug),'draft action stays private');
 await docs('action').publish({documentId:action.documentId});
 assert.equal(Number((await site()).actions.find(a=>a.slug===action.slug).amount),12.34);
 await docs('action').unpublish({documentId:action.documentId});
 assert.ok(!(await site()).actions.some(a=>a.slug===action.slug),'unpublished action disappears');
 const news=await docs('news').create({data:{title:'Nieuws test',slug:`news-${suffix}`,date:'2026-11-21',body:'Test'},status:'published'});created.push(['news',news.documentId]);
 assert.ok((await site()).news.some(n=>n.slug===news.slug));
 temp=await mkdtemp(resolve(tmpdir(),'weredi-upload-'));
 const file=resolve(temp,'photo.png');
 const sharp=require('sharp');await sharp({create:{width:32,height:32,channels:3,background:'#ea3797'}}).png().toFile(file);
 const {stat}=await import('node:fs/promises');
 [upload]=await app.plugin('upload').service('upload').upload({data:{fileInfo:{name:'integration-photo.png',alternativeText:'Integratietest foto'}},files:{filepath:file,originalFilename:'photo.png',mimetype:'image/png',size:(await stat(file)).size}});
 const album=await docs('album').create({data:{title:'Foto test',slug:`photos-${suffix}`,photos:[upload.id]},status:'published'});created.push(['album',album.documentId]);
 assert.equal((await site()).albums.find(a=>a.slug===album.slug).photos[0].alternativeText,'Integratietest foto');
 const mediaResponse=await fetch('http://127.0.0.1:1347'+upload.url);assert.equal(mediaResponse.status,200);
 const denied=await fetch('http://127.0.0.1:1347/api/upload',{method:'POST'});assert.ok([401,403,405].includes(denied.status));
 const registration=await fetch('http://127.0.0.1:1347/api/auth/local/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.invalid',password:'not-used'})});assert.ok([404,405].includes(registration.status));
 // Verify the server-rendered website against the same real CMS instance.
 web=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3011'],{cwd:resolve('../web'),env:{...process.env,CONTENT_MODE:'cms',CMS_URL:'http://127.0.0.1:1347',SITE_URL:'http://127.0.0.1:3011'},stdio:'ignore'});
 let ready=false;
 for(let attempt=0;attempt<40;attempt++){try{if((await fetch('http://127.0.0.1:3011/api/health')).ok){ready=true;break;}}catch{}await delay(250);}
 assert.ok(ready,'website ready against CMS');
 for(const path of ['/','/nieuws','/acties','/fotos','/over-het-glazen-huis','/privacy','/steun-ons','/sitemap.xml','/robots.txt','/llms.txt','/api/public-content','/opengraph-image',`/nieuws/${news.slug}`,`/fotos/${album.slug}`]){
  assert.equal((await fetch('http://127.0.0.1:3011'+path)).status,200,path);
 }
 assert.equal((await fetch(`http://127.0.0.1:3011/acties/${action.slug}`)).status,404,'unpublished action has no public page');
 assert.equal((await fetch('http://127.0.0.1:3011/not-a-real-page')).status,404);
 const html=await (await fetch('http://127.0.0.1:3011/')).text();
 assert.match(html,/lang="nl"/); assert.match(html,/rel="canonical"/); assert.match(html,/application\/ld\+json/);
 const data=await site();assert.ok(!JSON.stringify(data).includes('registrationToken'));
 console.log('PASS: published reads, draft isolation, unpublish, news, image upload, album media, unauthenticated upload denied, public registration absent, all frontend routes, SEO and 404s.');
} finally {
 if(web){web.kill('SIGTERM');await new Promise(resolve=>web.once('exit',resolve));}
 for(const [kind,documentId] of created.reverse())await app.documents(`api::${kind}.${kind}`).delete({documentId});
 if(upload)await app.plugin('upload').service('upload').remove(upload);
 if(temp)await rm(temp,{recursive:true,force:true});
 await app.destroy();
}
