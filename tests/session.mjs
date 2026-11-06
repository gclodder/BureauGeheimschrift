import assert from 'node:assert/strict';
import {encode} from '../lib/game.ts';
const origin=process.env.GAME_ORIGIN||'http://127.0.0.1:5173';
const login=await fetch(origin+'/docent/login',{method:'POST',redirect:'manual',body:new URLSearchParams({password:process.env.TEACHER_PASSWORD})});
assert.equal(login.status,303);
const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
let code='',admin='';
async function post(action,extra={},token=admin,expect=200){const res=await fetch(origin+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',Cookie:token===admin?cookie:'',Authorization:'Bearer '+token},body:JSON.stringify({action,code,...extra}),signal:AbortSignal.timeout(60000)});const body=await res.json();assert.equal(res.status,expect,JSON.stringify(body));return body;}
async function get(token=admin){const res=await fetch(origin+'/api/game?code='+code,{headers:{Cookie:token===admin?cookie:'',Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});const body=await res.json();assert.equal(res.status,200,JSON.stringify(body));return body;}
const anon=await fetch(origin+'/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create'})});assert.equal(anon.status,401);
const created=await post('create',{name:'TEST - 23 fictieve leerlingen',ranking:true});code=created.view.code;admin=created.token;
const pupils=await Promise.all(Array.from({length:23},(_,i)=>post('join',{name:'Testagent '+String(i+1).padStart(2,'0')},'')));
const byId=new Map(pupils.map(p=>[p.view.self,p]));
assert.equal((await get()).players.length,23);
const dup=await post('join',{name:'Testagent 01'},'',400);assert.match(dup.error,/in gebruik/);
await post('start',{method:'invalid'},admin,400);assert.equal((await get()).index,-1);
const methods=['substitution','caesar','pigpen','vigenere','caesar','pigpen','vigenere','caesar'];
await post('start',{method:methods[0]});
for(let round=0;round<methods.length;round++){
 const teacher=await get();assert.equal(teacher.index,round);assert.equal(teacher.method,methods[round]);assert.deepEqual(teacher.plan,methods.slice(0,round+1));assert.equal(teacher.groups.length,7);
 assert.equal(teacher.groups.filter(g=>g.eves.length===2).length,2);
 if(round===0){await post('pause');const p=await get(byId.get(teacher.groups[0].alice).token);assert.equal(p.state,'paused');await post('send',{plaintext:'DE GEHEIME BRIEF',cipher:'BAD'},byId.get(teacher.groups[0].alice).token,400);await post('continue');}
 await Promise.all(teacher.groups.map(async(g,i)=>{
  const alice=byId.get(g.alice),bob=byId.get(g.bob),text='DE GEHEIME BRIEF LIGT IN DE MAP';
  if(round===0&&i===0){const wrong=await post('send',{plaintext:'ABC!',cipher:'XXXXXXXXXX'},alice.token,400);assert.match(wrong.error,/10-50/);assert.equal((await get(alice.token)).group.sent,false);}
  const cipher=encode(text,teacher.method,g.key,g.shift);await post('send',{plaintext:text,cipher:'INCORRECT CLIENT CIPHER'},alice.token);
  const bv=await get(bob.token);assert.equal(bv.group.key,g.key);assert.equal(bv.group.plaintext,undefined);assert.deepEqual(bv.group.cipher,cipher);
  await post('send',{plaintext:text,cipher},bob.token,400);
  await post('answer',{text},bob.token);
  for(const eid of g.eves){const eve=byId.get(eid);const ev=await get(eve.token);assert.equal(ev.group.key,undefined);assert.equal(ev.group.shift,undefined);assert.equal(ev.group.plaintext,undefined);assert.deepEqual(ev.group.cipher,cipher);if(teacher.method==='vigenere'){await post('solveKeyword',{keyword:g.key},eve.token,400);const hinted=await post('riddle',{},eve.token);assert.ok(hinted.riddle);assert.equal(hinted.answer.hint,0);assert.equal(hinted.group.key,undefined);const wrong=await post('solveKeyword',{keyword:'FOUT'},eve.token);assert.equal(wrong.group.key,undefined);const solved=await post('solveKeyword',{keyword:g.key},eve.token);assert.equal(solved.group.key,g.key);assert.equal(solved.group.plaintext,undefined);assert.equal(solved.answer.hintPenalty,undefined);for(const other of g.eves.filter(x=>x!==eid)){if(!(await get(byId.get(other).token)).answer?.keywordSolved)assert.equal((await get(byId.get(other).token)).group.key,undefined);}await post('hint',{},eve.token,400);}else{for(let h=1;h<=3;h++){const hinted=await post('hint',{},eve.token);assert.equal(hinted.answer.keyHints.length,h);assert.equal(hinted.answer.hintPenalty,h*.5);assert.equal(hinted.group.key,undefined);}await post('hint',{},eve.token,400);}await post('answer',{text},eve.token);}
 }));
 await post('end');
 const reviewed=await get();assert.equal(reviewed.leaderboard.length,23);assert.ok(reviewed.groups.every(g=>g.plaintext));
 if(round<methods.length-1){if(round===2){await post('finish');assert.equal((await get()).state,'finished');}await post('next',{method:'invalid'},admin,400);assert.equal((await get()).index,round);await post('next',{method:methods[round+1]});}
}
await post('finish');const final=await get();assert.equal(final.state,'finished');
for(const p of final.progress){assert.ok(p.roles.Alice>=1&&p.roles.Bob>=1&&p.roles.Eve>=1);assert.equal(p.results.length,methods.length);for(const r of p.results){assert.equal(r.points,r.role==='Eve'&&r.method!=='vigenere'?.5:2);}}
const first=pupils[0];const resumed=await post('resume',{returnCode:first.returnCode.slice(0,4)+'-'+first.returnCode.slice(4)},'');assert.equal(resumed.view.self,first.view.self);
const recovered=await post('recoverPlayer',{player:first.view.self});assert.equal(recovered.recovered.returnCode.length,8);
const resumed2=await post('resume',{returnCode:recovered.recovered.returnCode},'');assert.equal(resumed2.view.self,first.view.self);
const listed=await fetch(origin+'/api/sessions',{headers:{Cookie:cookie}});assert.equal(listed.status,200);assert.ok((await listed.json()).sessions.some(s=>s.code===code));
const reopened=await post('reopen',{code});assert.equal(reopened.teacher,true);admin=reopened.token;
assert.equal((await get()).state,'finished');
console.log('PASS: real API session, 23 parallel joins, eight freely chosen rounds, continuing a finished dossier, all roles, four ciphers, server-side automatic encryption, free security riddles, validation, pause, separate Eve views, hints, scores, returning pupils and teacher recovery.');
console.log('Local test session: '+code+' (fictitious pupils only).');

