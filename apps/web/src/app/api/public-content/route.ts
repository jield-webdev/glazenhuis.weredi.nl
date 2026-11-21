import { getSite } from '../../../lib/content';
import { progress } from '../../../lib/format';
export async function GET(){const site=await getSite();return Response.json({...site,progress:progress(site.actions.map(a=>a.amount),site.settings.additionalAmount,site.settings.targetAmount)},{headers:{'Cache-Control':'public, max-age=30','X-Robots-Tag':'noindex'}});}
