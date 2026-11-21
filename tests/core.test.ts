import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { progress, safeUrl } from '../apps/web/src/lib/format.ts';
test('money is summed in cents, extra proceeds once, and bar is capped',()=>{
 assert.deepEqual(progress([0.1,0.2,'12.34'], 2.01,10),{total:14.65,percent:100});
 assert.deepEqual(progress([25], 5,100),{total:30,percent:30});
 assert.deepEqual(progress([],0,0),{total:0,percent:0});
});
test('unconfigured and executable donation URLs never become links',()=>{
 for(const value of ['', 'javascript:alert(1)', 'http://example.com','/bad'])assert.equal(safeUrl(value),undefined);
 assert.equal(safeUrl('https://example.com/action'),'https://example.com/action');
});
