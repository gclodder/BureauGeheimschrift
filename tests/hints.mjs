import assert from 'node:assert/strict';
import {ABC,encode,grantKeyHint,result,view,createRound} from '../lib/game.ts';
for(const method of ['caesar','pigpen','substitution']){
 const game={code:'TEST',name:'test',players:['a','b','e','f'].map(id=>({id,name:id})),roster:['a','b','e','f'],index:0,rounds:[],minutes:7,hints:true,ranking:true,state:'active',plan:[method]};
 const r=createRound(game);game.rounds.push(r);const g=r.groups[0];g.plaintext='DE GEHEIME BRIEF LIGT IN DE MAP';g.cipher=encode(g.plaintext,method,g.key,g.shift);g.sentAt=1;
 const eve=g.eves[0];let a={text:'',tries:0,correct:false,hint:0,discoveries:0};
 for(let i=1;i<=3;i++){a=grantKeyHint(r,g,a);r.answers[eve]=a;assert.equal(a.keyHints.length,i);assert.equal(a.hintPenalty,i*.5);assert.equal(new Set(a.keyHints.map(h=>h.plain)).size,i);for(const h of a.keyHints){const expected=encode(h.plain,method,g.key,g.shift);assert.equal(h.cipher,Array.isArray(expected)?expected[0]:expected);}const v=view(game,eve);assert.equal(v.group.key,undefined);assert.equal(v.group.shift,undefined);assert.equal(v.group.plaintext,undefined);assert.equal(v.answer.keyHints.length,i);assert.equal(view(game,g.eves[1]).answer,undefined);}
 assert.throws(()=>grantKeyHint(r,g,a),/drie hints/);
 a.correct=true;a.discoveries=5;r.answers[eve]=a;assert.equal(result(game,r,g,eve).points,.5);
 a.correct=false;a.discoveries=1;assert.equal(result(game,r,g,eve).points,0);
 r.answers[eve]={text:'',tries:1,correct:true,hint:2,discoveries:5};assert.equal(result(game,r,g,eve).points,2,'Existing scores retain their original hint rules');
}
console.log('PASS: three methods, unique key fragments, three-hint cap, per-Eve privacy, fractional penalties, score floor and legacy scores.');
