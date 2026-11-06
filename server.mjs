import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {passwordMatches,teacherCookie} from './lib/auth.mjs';
import * as game from './app/api/game/route.ts';
import * as sessions from './app/api/sessions/route.ts';

const port=Number(process.env.PORT ?? 3000);
const host=process.env.HOST || '127.0.0.1';
const configuredOrigin=process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN) : null;
if(configuredOrigin && (!['http:','https:'].includes(configuredOrigin.protocol)||configuredOrigin.href!==configuredOrigin.origin+'/'))throw new Error('PUBLIC_ORIGIN moet een volledig siteadres zonder pad zijn.');
const dist=resolve('dist');
await stat(resolve(dist,'index.html'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const noStore={'Cache-Control':'no-store'};
const plain=(text,status)=>new Response(text,{status,headers:noStore});
const redirect=(location,cookie)=>new Response(null,{status:303,headers:{...noStore,Location:location,...(cookie?{'Set-Cookie':cookie}:{})}});
const login=(notice='',status=200)=>new Response(`<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Docentlogin · Bureau Geheimschrift</title><style>body{margin:0;background:#f3efe5;color:#243d36;font:16px/1.5 system-ui}main{box-sizing:border-box;max-width:450px;margin:10vh auto;padding:28px;background:#fffdf7;border:1px solid #d9d3c4}input,button{box-sizing:border-box;width:100%;padding:10px;margin:8px 0;font:inherit}button{background:#213c33;color:white;border:0}a{color:inherit}[role=alert]{color:#8e3b2f}</style><main><p>BUREAU GEHEIMSCHRIFT · HV5</p><h1>Docentlogin</h1>${notice?'<p role="alert">'+notice+'</p>':''}<form method="post" action="/docent/login"><label>Docentwachtwoord<input type="password" name="password" autocomplete="current-password" maxlength="512" required></label><button>Log in als docent</button></form><p><a href="/">Naar de leerlingingang</a></p></main></html>`,{status,headers:{...noStore,'Content-Type':types['.html']}});
let failures=0, retryAt=0;
async function route(req){
  const {pathname}=new URL(req.url);
  const {method}=req;
  if(method==='POST' && req.headers.has('origin') && req.headers.get('origin')!==new URL(req.url).origin)return plain('Open het spel via de eigen spelpagina.',403);
  if(pathname==='/healthz'&&method==='GET')return plain('OK',200);
  if(pathname==='/api/game' && (method==='GET'||method==='POST'))return game[method](req);
  if(pathname==='/api/sessions' && method==='GET')return sessions.GET(req);
  if(pathname==='/docent/login'){
    if(method==='GET')return login();
    if(method==='POST'){
      if(Date.now()>=retryAt){failures=0;retryAt=Date.now()+60_000;}
      if(failures>=12)return login('Te veel pogingen. Probeer het over een minuut opnieuw.',429);
      const password=new URLSearchParams(await req.text()).get('password');
      if(!passwordMatches(password)){failures++;return login('Het docentwachtwoord klopt niet.',401);}
      failures=0;
      return redirect('/?teacher=1',teacherCookie(req.url.startsWith('https:')));
    }
  }
  if(pathname==='/docent/logout'&&method==='POST')return redirect('/',teacherCookie(req.url.startsWith('https:'),true));
  if(method!=='GET'&&method!=='HEAD')return plain('Niet gevonden.',404);
  if(pathname!=='/'&&!pathname.startsWith('/assets/')&&pathname!=='/favicon.svg')return plain('Niet gevonden.',404);
  const file=resolve(dist,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
  if(!file.startsWith(dist+sep))return plain('Niet gevonden.',404);
  try{
    return new Response(await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});
  }catch(e){if(e.code==='ENOENT'||e.code==='EISDIR')return plain('Niet gevonden.',404);throw e;}
}

const server=createServer(async (incoming,outgoing)=>{
  const send=async response=>{
    outgoing.writeHead(response.status,{'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',...Object.fromEntries(response.headers)});
    if(!response.body||incoming.method==='HEAD')outgoing.end();
    else Readable.fromWeb(response.body).pipe(outgoing);
  };
  try{
    const target=incoming.url;
    if(!target?.startsWith('/')||target.startsWith('//')||target.includes('\\'))return await send(plain('Ongeldig adres.',400));
    const origin=configuredOrigin?.origin||'http://'+(incoming.headers.host||'localhost');
    const method=incoming.method||'GET';
    let body;
    if(method==='POST'){
      const chunks=[];let size=0;
      for await(const chunk of incoming){
        size+=chunk.length;
        if(size>16_384){
          outgoing.setHeader('Connection','close');
          await send(plain('Dit bericht is te groot.',413));
          return;
        }
        chunks.push(chunk);
      }
      body=Buffer.concat(chunks);
    }
    await send(await route(new Request(origin+target,{method,headers:incoming.headers,body})));
  }catch(error){
    if(!outgoing.headersSent){console.error(error);await send(plain('De server kon dit verzoek niet verwerken.',500));}
    else outgoing.destroy();
  }
});
server.listen(port,host,()=>console.log('Bureau Geheimschrift luistert op poort '+server.address().port));

