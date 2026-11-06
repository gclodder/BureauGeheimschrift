import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
const password = process.env.TEACHER_PASSWORD || '';
if (password.length < 16) throw new Error('Stel TEACHER_PASSWORD in met minstens 16 tekens (zie .env.example).');
const ttl = 12 * 60 * 60;
const hash = value => createHash('sha256').update(value).digest();
const equal = (a,b) => timingSafeEqual(hash(a),hash(b));
const sign = expires => createHmac('sha256',password).update('hv5-docent:' + expires).digest('base64url');
export function passwordMatches(value){ return equal(String(value ?? ''),password); }
export function teacherOwner(req){
  const cookie = req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('hv5_teacher='));
  const match = cookie?.match(/^hv5_teacher=(\d+)\.([A-Za-z0-9_-]{43})$/);
  if(!match || Number(match[1]) <= Math.floor(Date.now()/1000) || !equal(match[2],sign(match[1]))) return null;
  return 'local-teacher';
}
export function teacherCookie(secure,logout=false){
  const expiry = String(Math.floor(Date.now()/1000)+ttl);
  return 'hv5_teacher='+(logout?'':expiry+'.'+sign(expiry))+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(logout?0:ttl)+(secure?'; Secure':'');
}
