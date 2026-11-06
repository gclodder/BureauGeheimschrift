export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const METHODS = ['caesar','pigpen','substitution','vigenere'] as const;
export const METHOD_NAMES: Record<string,string> = {caesar:'Caesar',pigpen:'Rozenkruisers',substitution:'Substitutie',vigenere:'Vigenère'};
export const PRACTICE_SENTENCES: Record<string,string> = {caesar:'DE SLEUTEL LIGT ONDER DE TAFEL',pigpen:'ONTMOET MIJ BIJ DE OUDE TOREN',substitution:'HET GEHEIME DOSSIER IS VERDWENEN',vigenere:'DE SPION WACHT BIJ HET STATION'};
export const SECURITY_KEYS = [
 {key:'WORM',question:'Hoe heet malware die zich zelfstandig via het netwerk verspreidt? Hint: hij wurmt zich overal doorheen.'},
 {key:'HASH',question:'Hoe heet de digitale vingerafdruk die een functie uit gegevens berekent? Vier letters.'},
 {key:'SPAM',question:'Hoe heet ongewenste mail die in grote aantallen wordt verstuurd?'},
 {key:'VPN',question:'Welke afkorting gebruiken we voor een virtueel privénetwerk?'},
 {key:'PIN',question:'Welke afkorting hoort bij de persoonlijke cijfercode waarmee je bijvoorbeeld je betaalpas beveiligt?'},
 {key:'VIRUS',question:'Welke malware hecht zich aan een bestand of programma en verspreidt zich als dat wordt uitgevoerd?'},
 {key:'BOT',question:'Hoe heet een computer in een botnet die op afstand opdrachten van een aanvaller uitvoert? Drie letters.'},
 {key:'HTTPS',question:'Welke variant van HTTP gebruikt TLS om de verbinding met een website te beveiligen? Vijf letters.'}
];
export function securityRiddle(key:string){return SECURITY_KEYS.find(item=>item.key===key)?.question;}
export const RESERVE = ['DE KOERIER WACHT BIJ DE BRUG', 'DE BRIEF ZIT IN DE GROENE MAP', 'DE TREIN VERTREKT OM MIDDERNACHT', 'DE AGENT DRAAGT EEN GRIJZE HOED', 'HET PAKKET LIGT ACHTER DE KAST', 'VOLG DE MAN MET DE ZWARTE JAS', 'DE CODE STAAT OP HET TWEEDE BLAD', 'DE DEUR GAAT OPEN NA DRIE KLOPPEN', 'HET SPOOR LEIDT NAAR DE HAVEN', 'DE KAART ZIT ONDER HET BUREAU', 'DE WACHTER SLAAPT BIJ DE POORT', 'HET HORLOGE STAAT VIER MINUTEN ACHTER', 'DE FOTO TOONT EEN VERLATEN HUIS', 'DE GETUIGE WACHT IN HET CAFE', 'DE AUTO STAAT NAAST HET STATION', 'ZOEK DE RODE BOEKEN IN DE KAST', 'DE ZENDER ZIT OP DE BOVENSTE ETAGE', 'DE BOOT VAART LANGS DE OUDE KADE', 'HET SEIN KOMT UIT DE KERKTOREN', 'DE KLUIZENAAR KENT HET WACHTWOORD', 'LEG DE ENVELOP OP DE VENSTERBANK', 'DE TAS HANGT AAN DE KAPSTOK', 'DE LAMP KNIPPERT DRIE KEER KORT', 'DE SLEUTEL PAST OP DE KELDERDEUR', 'DE ZAKLAMP LIGT IN DE LADENKAST', 'DE KAART TOONT EEN GEHEIME ROUTE', 'DE SPION HEEFT EEN VALSE NAAM', 'ONTMOET DE INSPECTEUR BIJ HET PARK', 'DE WITTE FIETS STAAT BIJ DE MOLEN', 'DE RADIO ZWIJGT TOT DE AVOND', 'BEWAAR DE NOTITIE IN JE BINNENZAK', 'DE KIST BEVAT EEN OUDE RADIO', 'DE OPDRACHT BEGINT BIJ ZONSOPGANG', 'DE SCHOENAFDRUK WIJST NAAR HET BOS', 'DE REGEN HEEFT DE SPOREN GEWIST', 'DE DOKTER HERKENT HET HANDSCHRIFT', 'HET BEWIJS LIGT IN DE ARCHIEFKAST', 'DE TELEFOON RINKELT OM NEGEN UUR', 'DE SCHOONMAKER VOND EEN GEHEIME BRIEF', 'DE NACHTWACHT HOORDE VOETSTAPPEN', 'DE VLUCHTWEG LOOPT LANGS HET KANAAL', 'DE MAN UIT DE TREIN IS VERDWENEN', 'DE GROENE AUTO HEEFT GEEN NUMMERPLAAT', 'DE VINGERAFDRUK STAAT OP HET GLAS', 'DE HOTELKAMER HEEFT EEN DUBBELE BODEM', 'DE KRANT VERBERGT EEN NIEUWE AANWIJZING', 'DE KLOK IN DE HAL LOOPT NIET MEER', 'WACHT OP HET SEIN VAN DE KOERIER'];
export function randomReserve(exclude:string[]=[]){const available=RESERVE.filter(text=>!exclude.includes(text));const pool=available.length?available:RESERVE;return shuffle(pool)[0];}
export function reserveFor(game:Game){return randomReserve(game.rounds.flatMap(round=>round.groups.map(group=>group.plaintext||'')));}
export type Role = 'Alice'|'Bob'|'Eve';
export type Cipher = string | number[];
export type Player = {id:string; name:string; tokenHash:string; returnHash:string};
export type Group = {id:string; alice:string; bob:string; eves:string[]; key:string; shift:number; plaintext?:string; cipher?:Cipher; sentAt?:number; fallback?:boolean; errors:number;autoEncrypted?:boolean};
export type KeyHint = {plain:string;cipher:string|number};
export type Answer = {text:string; tries:number; correct:boolean; hint:number; discoveries:number;keyHints?:KeyHint[];hintPenalty?:number;riddleRequested?:boolean;keywordSolved?:boolean;keywordTries?:number};
export const HINT_COST=0.5;
export function grantKeyHint(r:Round,g:Group,a:Answer){if(r.method==='vigenere')throw new Error('Gebruik voor Vigenère de gratis raadselhint.');if(a.correct)throw new Error("Je hebt het bericht al opgelost.");if(a.hint>=3)throw new Error("Je hebt alle drie hints gebruikt.");const known=a.keyHints||[];const choices=[...new Set(letters(g.plaintext||""))].filter(letter=>!known.some(h=>h.plain===letter));if(!choices.length)throw new Error("Er zijn geen nieuwe letterkoppelingen meer.");const plain=shuffle(choices)[0];const cipher=encode(plain,r.method,g.key,g.shift);return {...a,hint:a.hint+1,keyHints:[...known,{plain,cipher:Array.isArray(cipher)?cipher[0]:cipher}],hintPenalty:(a.hintPenalty||0)+HINT_COST};}
export type Round = {method:string; groups:Group[]; answers:Record<string,Answer>; index:number; end:number; remaining:number;sendDeadline:number;sendRemaining?:number};
export type Game = {name:string; adminHash:string; owner:string; code:string; created:number; players:Player[]; roster:string[]; state:'lobby'|'active'|'paused'|'review'|'finished'; index:number; rounds:Round[]; minutes:number; hints:boolean; ranking:boolean; plan:string[]};
export function shuffle<T>(items:T[]):T[] {const a=[...items];for(let i=a.length-1;i>0;i--){const b=new Uint32Array(1);crypto.getRandomValues(b);const j=b[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function clean(s:string) {return s.toUpperCase().replace(/\s+/g,' ').trim();}
export function letters(s:string) {return clean(s).replace(/ /g,'');}
export function encode(text:string,method:string,key:string,shift:number):Cipher {
  if(method==='vigenere'){let position=0;return [...clean(text)].map(ch=>ch===' '?' ':ABC[(ABC.indexOf(ch)+ABC.indexOf(key[position++%key.length]))%26]).join('');}
  if(method==='pigpen')return [...clean(text)].map(ch=>ch===' '?-1:key.indexOf(ch));
  const map=method==='caesar'?ABC.slice(shift)+ABC.slice(0,shift):key;
  return [...clean(text)].map(ch=>ch===' '?' ':map[ABC.indexOf(ch)]).join('');
}
export function cipherEqual(a:Cipher,b:Cipher) {return Array.isArray(a)&&Array.isArray(b)?JSON.stringify(a.filter(x=>x!==-1))===JSON.stringify(b.filter(x=>x!==-1)):typeof a==='string'&&typeof b==='string'&&letters(a)===letters(b);}
export function roleFor(g:Group,id:string):Role {return g.alice===id?'Alice':g.bob===id?'Bob':'Eve';}
export function currentGroup(game:Game,id:string){return game.rounds[game.index]?.groups.find(g=>g.alice===id||g.bob===id||g.eves.includes(id));}
export function roleStats(game:Game,id:string){const out={Alice:0,Bob:0,Eve:0};for(const r of game.rounds){const g=r.groups.find(g=>g.alice===id||g.bob===id||g.eves.includes(id));if(g)out[roleFor(g,id)]++;}return out;}
export function createRound(game:Game):Round {
  const n=game.roster.length, count=Math.floor(n/3); if(count<1)throw new Error('Er zijn minimaal drie leerlingen nodig.');
  // Rotating contiguous blocks guarantees all three roles within six rounds for 23 players.
  const offset=(game.index*count)%n;
  const ordered=game.roster.slice(offset).concat(game.roster.slice(0,offset));
  const as=ordered.slice(0,count),bs=ordered.slice(count,2*count),es=ordered.slice(2*count);
  const pairs=new Map<string,number>();
  const pair=(a:string,b:string)=>[a,b].sort().join(':');
  for(const r of game.rounds)for(const g of r.groups){const ids=[g.alice,g.bob,...g.eves];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const k=pair(ids[i],ids[j]);pairs.set(k,(pairs.get(k)||0)+1);}}
  let best:string[][]=[],score=Infinity;
  for(let attempt=0;attempt<100;attempt++){
    const aa=shuffle(as),bb=shuffle(bs),ee=shuffle(es);const groups=aa.map((a,i)=>[a,bb[i],ee[i]]);
    for(let j=count;j<ee.length;j++)groups[(j-count)%count].push(ee[j]);
    let value=0;for(const ids of groups)for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)value+=(pairs.get(pair(ids[i],ids[j]))||0);
    if(value<score){best=groups;score=value;if(value===0)break;}
  }
  return {index:game.index,method:game.plan[game.index],end:Date.now()+game.minutes*60000,remaining:game.minutes*60000,sendDeadline:Date.now()+180000,answers:{},groups:best.map((ids,i)=>{const shift=1+Math.floor(Math.random()*25);const pg=1+Math.floor(Math.random()*25);return{id:'G'+(i+1),alice:ids[0],bob:ids[1],eves:ids.slice(2),shift,key:game.plan[game.index]==='vigenere'?shuffle(SECURITY_KEYS)[0].key:game.plan[game.index]==='pigpen'?ABC.slice(pg)+ABC.slice(0,pg):shuffle([...ABC]).join(''),errors:0};})};
}
export function advanceTime(game:Game,now=Date.now()){
 if(game.state!=='active')return false;const r=game.rounds[game.index];let changed=false;
 if(now>=r.sendDeadline){for(const g of r.groups){if(!g.sentAt){g.plaintext=reserveFor(game);g.cipher=encode(g.plaintext,r.method,g.key,g.shift);g.sentAt=now;g.fallback=true;changed=true;}}}
 if(now>=r.end){game.state='review';changed=true;}
 return changed;
}
export function result(game:Game,r:Round,g:Group,id:string){
 const role=roleFor(g,id),a=r.answers[id];
 if(role==='Alice')return {role,points:g.sentAt&&!g.fallback?(g.autoEncrypted||g.errors===0?2:1):0,max:2,correct:!!g.sentAt&&!g.fallback,attempts:g.errors+1,hint:0};
 if(role==='Bob')return {role,points:a?.correct?2:0,max:2,correct:!!a?.correct,attempts:a?.tries||0,hint:a?.hint||0};
 return {role,points:Math.max(0,(a?.discoveries?1:0)+(a?.correct?1:0)-(a?.hintPenalty||0)),max:2,correct:!!a?.correct,attempts:a?.tries||0,hint:a?.hint||0};
}
export function view(game:Game,id:string,teacher=false){
 const name=(pid:string)=>game.players.find(p=>p.id===pid)?.name||'Leerling';
 const r=game.rounds[game.index];const g=currentGroup(game,id);const role=g?roleFor(g,id):null;
 const history=game.rounds.filter(rr=>rr.index<game.index||game.state==='review'||game.state==='finished').map(rr=>{const gg=rr.groups.find(gr=>gr.alice===id||gr.bob===id||gr.eves.includes(id));return gg?{index:rr.index,method:rr.method,...result(game,rr,gg,id)}:null;}).filter(Boolean);
 const completed=game.rounds.filter(rr=>rr.index<game.index||game.state==='review'||game.state==='finished');
 const leaderboard=game.ranking?game.players.map(p=>({name:p.name,id:p.id,points:completed.reduce((sum,rr)=>{const gg=rr.groups.find(x=>x.alice===p.id||x.bob===p.id||x.eves.includes(p.id));return sum+(gg?result(game,rr,gg,p.id).points:0);},0)})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)):[];
 const hint=r?.answers[id]?.hint===2&&g?.plaintext?'Het eerste woord is: '+g.plaintext.split(' ')[0]:r?.answers[id]?.hint===1?(r.method==='caesar'?'De verschuiving is voor alle letters hetzelfde. Test een kort woord.':'Gelijke tekens zijn gelijke letters. Kijk naar korte woorden en herhalingen.'):undefined;
 const shared={code:game.code,name:game.name,state:game.state,index:game.index,minutes:game.minutes,hints:game.hints,ranking:game.ranking,plan:game.rounds.map(round=>round.method),players:game.players.map(p=>({id:p.id,name:p.name})),method:r?.method,end:r?.end,remaining:r?.remaining,sendDeadline:r?.sendDeadline,sendRemaining:r?.sendRemaining,history,roleStats:roleStats(game,id),self:id,leaderboard};
 if(teacher)return {...shared,groups:r?.groups.map(gg=>({...gg,aliceName:name(gg.alice),bobName:name(gg.bob),eveNames:gg.eves.map(name),answers:Object.fromEntries([gg.bob,...gg.eves].map(pid=>[pid,{...r.answers[pid],name:name(pid)}]))})),progress:game.players.map(p=>({id:p.id,name:p.name,roles:roleStats(game,p.id),results:game.rounds.map(rr=>{const gg=rr.groups.find(x=>x.alice===p.id||x.bob===p.id||x.eves.includes(p.id));return gg?{index:rr.index,method:rr.method,...result(game,rr,gg,p.id)}:null;}).filter(Boolean)}))};
 const reveal=game.state==='review'||game.state==='finished';
 return {...shared,role,riddle:role==='Eve'&&r?.method==='vigenere'&&r.answers[id]?.riddleRequested?securityRiddle(g?.key||''):undefined,hintText:role==='Eve'&&!r?.answers[id]?.keyHints?hint:undefined,group:g?{id:g.id,aliceName:name(g.alice),bobName:name(g.bob),eveNames:g.eves.map(name),sent:!!g.sentAt,fallback:!!g.fallback,cipher:g.sentAt?g.cipher:undefined,key:role==='Alice'||role==='Bob'||reveal||(r?.method==='vigenere'&&r.answers[id]?.keywordSolved)?g.key:undefined,shift:role==='Alice'||role==='Bob'||reveal?g.shift:undefined,plaintext:role==='Alice'||reveal?g.plaintext:undefined,errors:role==='Alice'?g.errors:undefined}:null,answer:r?.answers[id],outcome:g&&r&&reveal?result(game,r,g,id):null};
}
