const { api, prisma, resetDb, makeUser, makeStore, login, bearer } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('role-based access control', () => {
  test('no token -> 401 on every protected area', async () => {
    for (const path of ['/api/admin/dashboard', '/api/stores', '/api/owner/dashboard']) {
      expect((await api().get(path)).status).toBe(401);
    }
  });

  test('normal user cannot use admin endpoints; "My store" says there is no store yet', async () => {
    const t = await login(await makeUser('USER'));
    expect((await api().get('/api/admin/dashboard').set(bearer(t))).status).toBe(403);
    expect((await api().get('/api/admin/users').set(bearer(t))).status).toBe(403);
    expect((await api().post('/api/admin/stores').set(bearer(t)).send({})).status).toBe(403);
    expect((await api().get('/api/owner/dashboard').set(bearer(t))).status).toBe(404);
  });

  test('store owner cannot use admin endpoints but can still browse stores', async () => {
    const t = await login(await makeUser('OWNER'));
    expect((await api().get('/api/admin/users').set(bearer(t))).status).toBe(403);
    expect((await api().get('/api/stores').set(bearer(t))).status).toBe(200);
  });

  test('admin has no "My store" area', async () => {
    const t = await login(await makeUser('ADMIN'));
    expect((await api().get('/api/owner/dashboard').set(bearer(t))).status).toBe(403);
    expect((await api().post('/api/owner/store').set(bearer(t)).send({})).status).toBe(403);
  });

  test('admin cannot rate stores; user and owner cannot reach admin user creation', async () => {
    const admin = await makeUser('ADMIN');
    const store = await makeStore(null);
    const t = await login(admin);
    expect((await api().post(`/api/admin/users`).set(bearer(t)).send({})).status).toBe(422);
    expect((await api().post(`/api/stores/${store.id}/ratings`).set(bearer(t)).send({ rating: 3 })).status).toBe(403);
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('malformed JSON returns 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('CORS', () => {
  test('a request from an unknown origin gets a clean 403 JSON error', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://evil.example');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
  test('the configured frontend origin is allowed', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
  });
});
