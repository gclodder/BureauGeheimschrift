import assert from 'node:assert/strict';
import {spawn, execFile} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {randomBytes} from 'node:crypto';

const directory=await mkdtemp(join(tmpdir(),'hv5-test-'));
const password=randomBytes(24).toString('hex');
const env={...process.env,HOST:'127.0.0.1',PORT:'0',TEACHER_PASSWORD:password,DATABASE_PATH:join(directory,'sessions.sqlite'),PUBLIC_ORIGIN:''};
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
  const form=(password)=>({method:'POST',redirect:'manual',body:new URLSearchParams({password})});
  assert.equal((await fetch(origin+'/docent/login',form('fout'))).status,401);
  const login=await fetch(origin+'/docent/login',form(password));
  assert.equal(login.status,303);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(origin+'/api/sessions',{headers:{'oai-authenticated-user-id':'teacher'}})).status,401);
  assert.equal((await fetch(origin+'/api/sessions',{headers:{Cookie:cookie+'x'}})).status,401);
  assert.equal((await fetch(origin+'/api/sessions',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await fetch(origin+'/docent/login',{...form(password),headers:{Origin:'https://example.org'}})).status,403);
  const home=await fetch(origin+'/');
  assert.equal(home.status,200);
  const asset=(await home.text()).match(/src="(\/assets\/[^"]+)"/)?.[1];
  assert.ok(asset);assert.equal((await fetch(origin+asset)).status,200);
  assert.equal((await fetch(origin+'/.env')).status,404);
  const result=await promisify(execFile)(process.execPath,['tests/session.mjs'],{env:{...env,GAME_ORIGIN:origin},timeout:120_000});
  process.stdout.write(result.stdout);
  await stop();
  origin=await start();
  const saved=await fetch(origin+'/api/sessions',{headers:{Cookie:cookie}});
  assert.equal(saved.status,200);
  assert.ok((await saved.json()).sessions.some(s=>s.name==='TEST - 23 fictieve leerlingen'&&s.state==='finished'));
  console.log('PASS: login, server assets, session access and SQLite persistence after restart.');
}finally{await stop();await rm(directory,{recursive:true,force:true});}
