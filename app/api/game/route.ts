import {db} from '../../../lib/storage.mjs';
import {teacherOwner} from '../../../lib/auth.mjs';
import {METHODS,securityRiddle,reserveFor,grantKeyHint,clean,letters,encode,createRound,currentGroup,roleFor,shuffle,view,advanceTime,type Game,type Answer} from '../../../lib/game.ts';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function secret(len=32){const bytes=new Uint8Array(len);crypto.getRandomValues(bytes);return [...bytes].map(x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');}
function fail(s:string):never{throw new Error(s);}
async function read(code:string){const row=await db.prepare('SELECT data,version FROM sessions WHERE code=?').get(code) as {data:string,version:number}|undefined;if(!row)fail('Deze sessiecode bestaat niet.');return {row,game:JSON.parse(row.data) as Game};}
async function change(code:string,fn:(game:Game)=>Promise<unknown>){for(let i=0;i<30;i++){const{row,game}=await read(code);const value=await fn(game);const result=await db.prepare('UPDATE sessions SET data=?,version=version+1 WHERE code=? AND version=?').run(JSON.stringify(game),code,row.version);if(Number(result.changes)===1)return value;await new Promise(resolve=>setTimeout(resolve,20+Math.random()*80));}fail('Het is druk. Probeer het nog een keer.');}
async function identify(game:Game,token:string,req:Request){const h=await hash(token);if(h===game.adminHash){if(teacherOwner(req)!==game.owner)fail('Log eerst in als docent.');return {teacher:true,id:'teacher'};}const p=game.players.find(p=>p.tokenHash===h);if(!p)fail('Meld je opnieuw aan met je terugkeercode.');return {teacher:false,id:p.id};}
export async function GET(req:Request){try{const u=new URL(req.url),code=(u.searchParams.get('code')||'').toUpperCase(),token=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';const {game}=await read(code);const who=await identify(game,token,req);if(advanceTime(game)){return json(await change(code,async g=>{advanceTime(g);return view(g,who.id,who.teacher);}));}return json(view(game,who.id,who.teacher));}catch(e){return json({error:(e as Error).message},400);}}
export async function POST(req:Request){try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Open het spel via de eigen spelpagina.'},403);
 const raw=await req.text();if(raw.length>12000)return json({error:'Dit bericht is te groot.'},413);const b=JSON.parse(raw);const action=b.action;
 if(action==='create'){
  const owner=teacherOwner(req);if(!owner)return json({error:'Log eerst in als docent.',signin:true},401);
  const token=secret(),code=secret(6);const game:Game={code,name:String(b.name||'HV5 - Geheime dienst').slice(0,60),owner,adminHash:await hash(token),created:Date.now(),players:[],roster:[],state:'lobby',index:-1,rounds:[],minutes:Math.min(15,Math.max(5,Number(b.minutes)||7)),hints:b.hints!==false,ranking:b.ranking!==false,plan:[]};
  await db.prepare('INSERT INTO sessions(code,data,version) VALUES(?,?,0)').run(code,JSON.stringify(game));return json({token,view:view(game,'teacher',true)});
 }
 const code=String(b.code||'').toUpperCase();
 if(action==='reopen')return json(await change(code,async game=>{const owner=teacherOwner(req);if(!owner||owner!==game.owner)fail('Log in met het docentaccount waarmee dit dossier is gemaakt.');const token=secret();game.adminHash=await hash(token);return {token,teacher:true,view:view(game,'teacher',true)};}));
 if(action==='join')return json(await change(code,async game=>{if(game.state!=='lobby')fail('De sessie is al begonnen. Gebruik je terugkeercode als je eerder deelnam.');if(game.players.length>=40)fail('Deze sessie is vol.');const name=String(b.name||'').trim().slice(0,30);if(!name)fail('Vul je detectivenaam in.');if(game.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))fail('Deze detectivenaam is al in gebruik. Kies een andere detectivenaam.');const token=secret(),returnCode=secret(8),id=crypto.randomUUID();game.players.push({id,name,tokenHash:await hash(token),returnHash:await hash(returnCode)});return{token,returnCode,view:view(game,id)};}));
 if(action==='resume')return json(await change(code,async game=>{const rh=await hash(String(b.returnCode||'').toUpperCase().replace(/[\s-]/g,''));const p=game.players.find(p=>p.returnHash===rh);if(!p)fail('De terugkeercode klopt niet.');const token=secret();p.tokenHash=await hash(token);return {token,view:view(game,p.id)};}));
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
 return json(await change(code,async game=>{
  const who=await identify(game,token,req);const r=game.rounds[game.index];const g=currentGroup(game,who.id);
  if(who.teacher){
   if(action==='start'||action==='next'){
    if(!['lobby','review','finished'].includes(game.state))fail('Sluit eerst de huidige ronde af.');
    if(!METHODS.includes(b.method))fail('Kies Caesar, Rozenkruisers, substitutie of Vigenère voor deze ronde.');
    if(game.state==='lobby'){if(game.players.length<3)fail('Er zijn minimaal drie leerlingen nodig.');game.roster=shuffle(game.players.map(p=>p.id));}
    game.plan=game.rounds.map(round=>round.method);game.plan.push(b.method);
    game.index=game.rounds.length;game.rounds.push(createRound(game));game.state='active';

   }else if(action==='pause'){
    if(game.state!=='active')fail('Er loopt geen ronde.');r.remaining=Math.max(0,r.end-Date.now());r.sendRemaining=Math.max(0,r.sendDeadline-Date.now());game.state='paused';
   }else if(action==='continue'){
    if(game.state!=='paused')fail('De ronde is niet gepauzeerd.');r.end=Date.now()+r.remaining;r.sendDeadline=Date.now()+(r.sendRemaining||0);game.state='active';
   }else if(action==='end'){
    if(!['active','paused'].includes(game.state))fail('Er loopt geen ronde.');game.state='review';
   }else if(action==='finish'){
    if(game.state!=='review')fail('Sluit eerst de ronde af.');game.state='finished';
   }else if(action==='fallback'){
    if(game.state!=='active')fail('Start of hervat eerst de ronde.');const gg=r.groups.find(x=>x.id===b.group);if(!gg||gg.sentAt)fail('Dit groepje heeft al een bericht.');gg.plaintext=reserveFor(game);gg.cipher=encode(gg.plaintext,r.method,gg.key,gg.shift);gg.sentAt=Date.now();gg.fallback=true;
   }else if(action==='remove'){
    if(game.state!=='lobby')fail('Leerlingen verwijderen kan alleen voor de start.');game.players=game.players.filter(p=>p.id!==b.player);
   }else if(action==='settings'){
    game.hints=b.hints!==false;game.minutes=Math.min(15,Math.max(5,Number(b.minutes)||7));game.ranking=b.ranking===true;
   }else if(action==='recoverPlayer'){
    const p=game.players.find(p=>p.id===b.player);if(!p)fail('Leerling niet gevonden.');const returnCode=secret(8);p.returnHash=await hash(returnCode);return{...view(game,who.id,true),recovered:{name:p.name,returnCode}};
   }else fail('Deze docentactie bestaat niet.');
   return view(game,who.id,true);
  }
  if(game.state!=='active')fail('De ronde is niet actief.');if(Date.now()>=r.end)fail('De tijd is om. Wacht op de nabespreking.');if(!g)fail('Je bent niet ingedeeld.');const role=roleFor(g,who.id);advanceTime(game);
  if(action==='send'){
   if(role!=='Alice')fail('Alleen Alice kan versturen.');if(g.fallback)return {...view(game,who.id),notice:'De schrijftijd is voorbij. Er is een reservebericht ingezet voor Bob en Eve.'};if(g.sentAt)fail('Het bericht is al verstuurd.');
   const plaintext=clean(String(b.plaintext||''));if(!/^[A-Z ]+$/.test(plaintext)||letters(plaintext).length<10||letters(plaintext).length>50)fail('Gebruik 10-50 letters (A-Z) en spaties.');
   const cipher=encode(plaintext,r.method,g.key,g.shift);g.autoEncrypted=true;
   g.plaintext=plaintext;g.cipher=cipher;g.sentAt=Date.now();return {...view(game,who.id),notice:'Verstuurd. Bob en Eve kunnen aan de slag.'};
  }
  if(action==='answer'){
   if(role==='Alice'||!g.sentAt)fail('Je kunt nog geen antwoord indienen.');const text=clean(String(b.text||''));if(!/^[A-Z ?]*$/.test(text)||text.length>100)fail('Gebruik letters, spaties en eventueel vraagtekens.');
   const old=r.answers[who.id];if(old?.correct)fail('Je hebt het bericht al opgelost.');if((old?.tries||0)>=20)fail('Je hebt het maximum van twintig pogingen bereikt.');
   const guess=letters(text),target=letters(g.plaintext!);let discoveries=0;
   const first=letters(g.plaintext!.split(' ')[0]);const skip=!old?.keyHints&&(old?.hint||0)>=2?first.length:0;const revealed=new Set((old?.keyHints||[]).map(h=>h.plain));
   if(guess.length===target.length)for(let i=skip;i<guess.length;i++)if(guess[i]===target[i]&&!revealed.has(target[i]))discoveries++;
   discoveries=Math.max(discoveries,old?.discoveries||0);
   const a:Answer={...old,text,tries:(old?.tries||0)+1,correct:guess===target,hint:old?.hint||0,discoveries,keyHints:old?.keyHints,hintPenalty:old?.hintPenalty};r.answers[who.id]=a;
   return {...view(game,who.id),notice:a.correct?'Goed ontcijferd. Bewaar je aanpak voor de nabespreking.':role==='Eve'?'Poging bewaard. Werk verder aan je hypothese.':'Nog niet helemaal juist. Controleer je sleutel en probeer opnieuw.'};
  }
  if(action==='riddle'||action==='solveKeyword'){
   if(role!=='Eve'||r.method!=='vigenere'||!securityRiddle(g.key))fail('Deze raadselhint is alleen voor Eve bij Vigenère.');
   const a=r.answers[who.id]||{text:'',tries:0,correct:false,hint:0,discoveries:0};
   if(action==='riddle'){a.riddleRequested=true;r.answers[who.id]=a;return view(game,who.id);}
   if(!a.riddleRequested)fail('Vraag eerst de gratis raadselhint.');if(a.keywordSolved)fail('Je hebt het sleutelwoord al gevonden.');
   const guess=letters(String(b.keyword||''));if(!/^[A-Z]{1,20}$/.test(guess))fail('Vul je antwoord op het raadsel in met letters A-Z.');
   a.keywordTries=(a.keywordTries||0)+1;a.keywordSolved=guess===g.key;r.answers[who.id]=a;
   return {...view(game,who.id),notice:a.keywordSolved?'Sleutelwoord gevonden! Gebruik het om het bericht te ontsleutelen.':'Dit is nog niet het sleutelwoord. Lees het raadsel nog eens.'};
  }
  if(action==='hint'){
   if(role!=='Eve'||!g.sentAt||!game.hints)fail('Er is nu geen hint beschikbaar.');const a=r.answers[who.id]||{text:'',tries:0,correct:false,hint:0,discoveries:0};r.answers[who.id]=grantKeyHint(r,g,a);return view(game,who.id);
  }
  fail('Deze actie bestaat niet.');
 }));
 }catch(e){return json({error:(e as Error).message},400);}}
