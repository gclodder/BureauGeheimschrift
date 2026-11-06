import assert from 'node:assert/strict';
import {ABC,RESERVE,randomReserve,reserveFor,PRACTICE_SENTENCES,encode,cipherEqual,createRound,roleStats,view,shuffle,advanceTime} from '../lib/game.ts';
const build=(n)=>({code:'TEST',name:'test',owner:'owner',adminHash:'secret',created:1,players:Array.from({length:n},(_,i)=>({id:String(i),name:'Agent '+i,tokenHash:'token'+i,returnHash:'return'+i})),roster:shuffle(Array.from({length:n},(_,i)=>String(i))),state:'active',index:0,rounds:[],minutes:7,hints:true,ranking:true,lesson:1,plan:['caesar','caesar','caesar','pigpen','pigpen','substitution']});
for(let repetition=0;repetition<10;repetition++)for(let n=3;n<=40;n++){
 const game=build(n);
 for(let i=0;i<6;i++){
  game.index=i;const r=createRound(game);game.rounds.push(r);
  const ids=r.groups.flatMap(g=>[g.alice,g.bob,...g.eves]);assert.equal(ids.length,n);assert.equal(new Set(ids).size,n);
  if(n===23){assert.equal(r.groups.length,7);assert.equal(r.groups.filter(g=>g.eves.length===1).length,5);assert.equal(r.groups.filter(g=>g.eves.length===2).length,2);}
  for(const g of r.groups){
   assert.equal(new Set(g.key).size,26);g.plaintext='DE SLEUTEL LIGT ONDER DE TAFEL';g.cipher=encode(g.plaintext,r.method,g.key,g.shift);g.sentAt=Date.now();
   const eve=view(game,g.eves[0]);assert.equal(eve.group.key,undefined);assert.equal(eve.group.shift,undefined);assert.equal(eve.group.plaintext,undefined);assert.deepEqual(eve.group.cipher,g.cipher);
   const bob=view(game,g.bob);assert.equal(bob.group.key,g.key);assert.equal(bob.group.plaintext,undefined);
   assert.equal(JSON.stringify(eve).includes('tokenHash'),false);assert.equal(JSON.stringify(eve).includes('returnHash'),false);assert.equal(JSON.stringify(eve).includes('adminHash'),false);
   game.state='review';assert.equal(view(game,g.eves[0]).group.plaintext,g.plaintext);game.state='active';
  }
 }
 for(const p of game.players){const counts=roleStats(game,p.id);assert.ok(counts.Alice>=1&&counts.Bob>=1&&counts.Eve>=1,JSON.stringify({n,counts}));}
}
assert.equal(encode('XYZ ABC','caesar',ABC,3),'ABC DEF');
assert.deepEqual(encode('AZ A','pigpen',ABC,0),[0,25,-1,0]);
assert.equal(cipherEqual('ABC DEF','A BCDEF'),true);
assert.equal(cipherEqual([0,25,-1,0],[0,25,0]),true);
assert.equal(cipherEqual([0,25],[25,0]),false);
const timed=build(23);timed.rounds.push(createRound(timed));const deadline=timed.rounds[0].sendDeadline;
assert.equal(advanceTime(timed,deadline-1),false);assert.equal(timed.rounds[0].groups.some(g=>g.sentAt),false);
timed.state='paused';assert.equal(advanceTime(timed,deadline+100000),false);timed.state='active';
assert.equal(advanceTime(timed,deadline),true);assert.ok(timed.rounds[0].groups.every(g=>g.sentAt&&g.fallback));
assert.equal(advanceTime(timed,timed.rounds[0].end),true);assert.equal(timed.state,'review');
const legacy=build(3);legacy.rounds.push(createRound(legacy));assert.deepEqual(view(legacy,'0').plan,['caesar']);
assert.equal(new Set(Object.values(PRACTICE_SENTENCES)).size,4);
for(const method of Object.keys(PRACTICE_SENTENCES)){const target=PRACTICE_SENTENCES[method];const cipher=encode(target,method,ABC,5);for(const other of Object.keys(PRACTICE_SENTENCES).filter(m=>m!==method))assert.equal(cipherEqual(cipher,encode(PRACTICE_SENTENCES[other],method,ABC,5)),false);}
assert.equal(RESERVE.length,48);assert.equal(new Set(RESERVE).size,48);assert.ok(RESERVE.every(s=>/^[A-Z ]+$/.test(s)&&s.replace(/ /g,'').length<=50&&s.replace(/ /g,'').length>=10));
const drawn=[];for(let i=0;i<RESERVE.length;i++){const s=randomReserve(drawn);assert.ok(!drawn.includes(s));drawn.push(s);}assert.ok(RESERVE.includes(randomReserve(drawn)));
assert.equal(new Set(timed.rounds[0].groups.map(g=>g.plaintext)).size,7);assert.ok(!timed.rounds[0].groups.some(g=>g.plaintext===reserveFor(timed)));
console.log('PASS: 380 class simulations, all six rounds, balanced roles, 23-player groups, Eve access boundaries and cipher checks.');
