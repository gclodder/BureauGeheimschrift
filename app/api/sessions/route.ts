import {db} from '../../../lib/storage.mjs';
import {teacherOwner} from '../../../lib/auth.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const owner=teacherOwner(req);
 if(!owner)return Response.json({error:'Log eerst in als docent.',signin:true},{status:401});
 const rows=await db.prepare("SELECT code,json_extract(data,'$.name') AS name,json_extract(data,'$.state') AS state,json_extract(data,'$.index') AS round,json_extract(data,'$.created') AS created FROM sessions WHERE json_extract(data,'$.owner')=? ORDER BY json_extract(data,'$.created') DESC LIMIT 30").all(owner);
 return Response.json({sessions:rows},{headers:{'Cache-Control':'no-store'}});
}
