// Tests that don't need a database: routing, validation, and auth guards.
// Run with: npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const app = require('../app');

let server, base;
before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

const call = (path, opts = {}) =>
  fetch(base + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, body: opts.body && JSON.stringify(opts.body) });

test('health check responds', async () => {
  const res = await call('/health');
  assert.equal(res.status, 200);
});

test('protected routes reject requests without a token', async () => {
  for (const path of ['/profile', '/leaves/me', '/attendance/today', '/employees']) {
    assert.equal((await call(path)).status, 401, path);
  }
});

test('a garbage token is rejected', async () => {
  const res = await call('/profile', { headers: { Authorization: 'Bearer nope' } });
  assert.equal(res.status, 401);
});

test('login validates input before touching the database', async () => {
  const res = await call('/auth/login', { method: 'POST', body: { email: 'not-an-email', password: '' } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).message, /valid email/i);
});

test('register requires a 6+ character password', async () => {
  const res = await call('/auth/register', { method: 'POST', body: { name: 'A', email: 'a@b.co', password: '123' } });
  assert.equal(res.status, 400);
});

test('unknown routes return 404 JSON', async () => {
  const res = await fetch(base.replace('/api', '') + '/nothing-here');
  assert.equal(res.status, 404);
  assert.match((await res.json()).message, /not found/i);
});

test('a token signed with the wrong secret is rejected', async () => {
  const bad = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'other-secret');
  const res = await call('/profile', { headers: { Authorization: `Bearer ${bad}` } });
  assert.equal(res.status, 401);
});
