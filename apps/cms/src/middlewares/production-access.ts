// Preserve the access rule previously enforced by nginx on the public CMS.
export default () => async (ctx: {
  path: string;
  status: number;
  set(name: string, value: string): void;
}, next: () => Promise<unknown>) => {
  if (process.env.NODE_ENV === 'production') {
    ctx.set('X-Robots-Tag', 'noindex, nofollow');
    if (ctx.path.replace(/\/+$/, '') === '/admin/register-admin') {
      ctx.status = 403;
      return;
    }
  }
  await next();
};
