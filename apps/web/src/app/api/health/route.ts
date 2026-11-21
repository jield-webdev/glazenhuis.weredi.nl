import { getSite } from '../../../lib/content';
export async function GET(){try{await getSite();return Response.json({status:'ok'});}catch{return Response.json({status:'unavailable'},{status:503});}}
