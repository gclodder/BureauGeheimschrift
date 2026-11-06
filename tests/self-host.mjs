import assert from 'node:assert/strict';
import {spawn, execFile} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {DatabaseSync} from 'node:sqlite';

const directory=await mkdtemp(join(tmpdir(),'hv5-test-'));
const env={...process.env,HOST:'127.0.0.1',PORT:'0',DATABASE_PATH:join(directory,'sessions.sqlite'),PUBLIC_ORIGIN:''};
delete env.TEACHER_PASSWORD;
const oldDb=new DatabaseSync(env.DATABASE_PATH);
oldDb.exec('CREATE TABLE sessions(code TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER DEFAULT 0 NOT NULL)');
oldDb.close();
let child;
async function start(){
  child=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','inherit']});
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('De testserver start niet.')),10_000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('exit',code=>{clearTimeout(timer);reject(new Error('De testserver stopte: '+code));});
    child.stdout.on('data',data=>{
      const match=String(data).match(/poort (\d+)/);
      if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1]);}
    });
  });
}
async function stop(){if(child?.exitCode===null&&child.signalCode===null){const ended=once(child,'exit');child.kill();await ended;}child=null;}
try{
  let origin=await start();
  const post=(action,extra={},token,headers={})=>fetch(origin+'/api/game',{
    method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:JSON.stringify({action,...extra}),
  });
  const create=async()=>{const res=await post('create');assert.equal(res.status,200);return res.json();};
  const denied=await post('create',{},null,{Origin:'https://example.org'});
  assert.equal(denied.status,403);assert.match((await denied.json()).error,/PUBLIC_ORIGIN/);
  assert.equal((await fetch(origin+'/api/sessions')).status,404);
  const legacy=await fetch(origin+'/docent/login',{redirect:'manual'});
  assert.equal(legacy.status,303);assert.equal(legacy.headers.get('location'),'/?teacher=1');
  const a=await create(), b=await create(), expired=await create();
  const code=a.view.code;
  const pupil=await (await post('join',{code,name:'Agent'})).json();
  for(const key of [undefined,code,pupil.token,b.token]){
    assert.equal((await post('reopen',{code},key)).status,400);
    assert.equal((await post('deleteSession',{code},key)).status,400);
  }
  assert.equal((await post('reopen',{code},a.token)).status,200);
  assert.equal((await post('deleteSession',{code:b.view.code},b.token)).status,200);
  assert.equal((await post('reopen',{code:b.view.code},b.token)).status,404);
  const home=await fetch(origin+'/');
  assert.equal(home.status,200);
  const asset=(await home.text()).match(/src="(\/assets\/[^"]+)"/)?.[1];
  assert.ok(asset);assert.equal((await fetch(origin+asset)).status,200);
  assert.equal((await fetch(origin+'/.env')).status,404);
  const result=await promisify(execFile)(process.execPath,['tests/session.mjs'],{env:{...env,GAME_ORIGIN:origin},timeout:120_000});
  process.stdout.write(result.stdout);
  const db=new DatabaseSync(env.DATABASE_PATH);
  const earlier=Date.now()-60_000;
  db.prepare('UPDATE sessions SET last_activity=? WHERE code=?').run(earlier,code);
  const get=({view,token})=>fetch(origin+'/api/game?code='+view.code,{headers:{Authorization:'Bearer '+token}});
  assert.equal((await get(a)).status,200);
  assert.equal(db.prepare('SELECT last_activity FROM sessions WHERE code=?').get(code).last_activity,earlier);
  db.prepare('UPDATE sessions SET last_activity=? WHERE code=?').run(Date.now()-8*86_400_000,expired.view.code);
  assert.equal((await get(expired)).status,404);
  db.close();
  await stop();
  origin=await start();
  assert.equal((await get(a)).status,200);
  assert.equal((await get(expired)).status,404);
  const after=new DatabaseSync(env.DATABASE_PATH);
  assert.equal(after.prepare('SELECT code FROM sessions WHERE code=?').get(expired.view.code),undefined);
  assert.ok(after.prepare("SELECT code FROM sessions WHERE json_extract(data,'$.state')='finished'").get());
  assert.notEqual(JSON.parse(after.prepare('SELECT data FROM sessions WHERE code=?').get(code).data).adminHash,a.token);
  after.close();
  for(let i=0;i<30;i++)await create();
  assert.equal((await post('create')).status,429);
  console.log('PASS: no-login access, cross-dossier isolation, expiry, deletion, creation limits and SQLite persistence.');
}finally{await stop();await rm(directory,{recursive:true,force:true});}
