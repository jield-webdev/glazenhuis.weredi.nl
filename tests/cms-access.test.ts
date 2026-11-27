import assert from 'node:assert/strict';
import test from 'node:test';
import productionAccess from '../apps/cms/src/middlewares/production-access';

test('production blocks first-admin registration while allowing login and invitations', async t => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  });
  for (const path of ['/admin/register-admin', '/admin/register-admin/', '/admin/login', '/admin/register', '/uploads/photo.png']) {
    const headers = new Map<string, string>();
    const ctx = { path, status: 200, set: (key: string, value: string) => { headers.set(key, value); } };
    let continued = false;
    await productionAccess()(ctx, async () => { continued = true; });
    const blocked = path.replace(/\/+$/, '') === '/admin/register-admin';
    assert.equal(ctx.status, blocked ? 403 : 200);
    assert.equal(continued, !blocked);
    assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});
