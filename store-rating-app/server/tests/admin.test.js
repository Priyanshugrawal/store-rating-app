const { api, prisma, resetDb, makeUser, makeStore, login, bearer, PASSWORD } = require('./helpers');

let admin; let token;
beforeEach(async () => {
  await resetDb();
  admin = await makeUser('ADMIN');
  token = await login(admin);
});
afterAll(() => prisma.$disconnect());

const newUser = (over = {}) => ({
  name: 'Created By The Administrator',
  email: 'created@example.com',
  address: '5 Admin Road',
  password: 'Secret#12',
  role: 'USER',
  ...over,
});

describe('admin: dashboard', () => {
  test('counts come from the database', async () => {
    const owner = await makeUser('OWNER');
    const user = await makeUser('USER');
    const store = await makeStore(owner);
    await prisma.rating.create({ data: { userId: user.id, storeId: store.id, rating: 4 } });
    const res = await api().get('/api/admin/dashboard').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ totalUsers: 3, totalStores: 1, totalRatings: 1, averageRating: 4 });
    expect(res.body.data.usersByRole).toEqual({ ADMIN: 1, USER: 1, OWNER: 1 });
    expect(res.body.data.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 });
    expect(res.body.data.ratingsPerDay).toHaveLength(14);
    expect(res.body.data.ratingsPerDay[13].count).toBe(1);
    expect(res.body.data.topStores[0]).toMatchObject({ id: store.id, averageRating: 4, ratingCount: 1 });
    expect(res.body.data.recentRatings[0]).toMatchObject({ rating: 4, store: { id: store.id }, user: { id: user.id } });
  });

  test('empty database shows zeros for stores and ratings', async () => {
    const res = await api().get('/api/admin/dashboard').set(bearer(token));
    expect(res.body.data).toMatchObject({ totalUsers: 1, totalStores: 0, totalRatings: 0, averageRating: null });
    expect(res.body.data.topStores).toEqual([]);
    expect(res.body.data.recentRatings).toEqual([]);
    expect(res.body.data.ratingsPerDay.every((d) => d.count === 0)).toBe(true);
  });
});

describe('admin: users', () => {
  test.each(['ADMIN', 'USER', 'OWNER'])('creates a %s', async (role) => {
    const res = await api().post('/api/admin/users').set(bearer(token)).send(newUser({ role }));
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe(role);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  test('validates input and rejects duplicate emails and bad roles', async () => {
    expect((await api().post('/api/admin/users').set(bearer(token)).send(newUser({ name: '' }))).status).toBe(422);
    expect((await api().post('/api/admin/users').set(bearer(token)).send(newUser({ role: 'GOD' }))).status).toBe(422);
    await api().post('/api/admin/users').set(bearer(token)).send(newUser());
    const dup = await api().post('/api/admin/users').set(bearer(token)).send(newUser());
    expect(dup.status).toBe(409);
  });

  test('filters, sorts (asc/desc) and paginates', async () => {
    await makeUser('USER', { name: 'Aaaaaaaaaaaaaaaaaaaa User', email: 'a@example.com', address: 'Mumbai Road' });
    await makeUser('USER', { name: 'Zzzzzzzzzzzzzzzzzzzz User', email: 'z@example.com', address: 'Delhi Road' });
    await makeUser('OWNER', { name: 'Mmmmmmmmmmmmmmmmmmmm Owner', email: 'm@example.com', address: 'Pune Road' });

    const owners = await api().get('/api/admin/users?role=OWNER').set(bearer(token));
    expect(owners.body.data).toHaveLength(1);
    expect(owners.body.data[0].email).toBe('m@example.com');

    const byAddress = await api().get('/api/admin/users?address=delhi').set(bearer(token));
    expect(byAddress.body.data.map((u) => u.email)).toEqual(['z@example.com']);

    const byEmail = await api().get('/api/admin/users?email=A@EXAMPLE').set(bearer(token));
    expect(byEmail.body.data.map((u) => u.email)).toContain('a@example.com');

    const asc = await api().get('/api/admin/users?sortBy=name&order=asc').set(bearer(token));
    const desc = await api().get('/api/admin/users?sortBy=name&order=desc').set(bearer(token));
    const ascNames = asc.body.data.map((u) => u.name);
    expect(ascNames).toEqual([...ascNames].sort((x, y) => x.localeCompare(y)));
    expect(desc.body.data[0].name).toBe(ascNames[ascNames.length - 1]);

    const page = await api().get('/api/admin/users?limit=2&page=2&sortBy=email').set(bearer(token));
    expect(page.body.data).toHaveLength(2);
    expect(page.body.meta).toMatchObject({ page: 2, limit: 2, total: 4, totalPages: 2 });
  });

  test('a "%" in a filter is matched literally (no wildcard abuse)', async () => {
    const res = await api().get('/api/admin/users?name=%25').set(bearer(token));
    expect(res.body.data).toHaveLength(0);
  });

  test('rejects an invalid sort column instead of passing it to the database', async () => {
    const res = await api().get('/api/admin/users?sortBy=passwordHash;DROP TABLE users').set(bearer(token));
    expect(res.status).toBe(422);
  });

  test('user details include the owner\'s store average rating', async () => {
    const owner = await makeUser('OWNER');
    const store = await makeStore(owner);
    const u1 = await makeUser('USER'); const u2 = await makeUser('USER');
    await prisma.rating.createMany({ data: [{ userId: u1.id, storeId: store.id, rating: 5 }, { userId: u2.id, storeId: store.id, rating: 2 }] });
    const res = await api().get(`/api/admin/users/${owner.id}`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.store.averageRating).toBe(3.5);
    expect(res.body.data.store.ratingCount).toBe(2);
    const list = await api().get('/api/admin/users?role=OWNER').set(bearer(token));
    expect(list.body.data[0].storeRating).toBe(3.5);
    expect((await api().get('/api/admin/users/999999').set(bearer(token))).status).toBe(404);
    expect((await api().get('/api/admin/users/abc').set(bearer(token))).status).toBe(422);
  });
});

describe('admin: stores', () => {
  test('creates a store for an owner; owner can only have one store', async () => {
    const owner = await makeUser('OWNER');
    const body = { name: 'Fresh Fruit Corner Market', email: 'fruit@example.com', address: '7 Fruit Lane', ownerId: owner.id };
    const res = await api().post('/api/admin/stores').set(bearer(token)).send(body);
    expect(res.status).toBe(201);
    const again = await api().post('/api/admin/stores').set(bearer(token)).send({ ...body, email: 'fruit2@example.com' });
    expect(again.status).toBe(409);
  });

  test('giving a store to a normal member makes them its Store Owner', async () => {
    const normal = await makeUser('USER');
    const body = { name: 'Fresh Fruit Corner Market', email: 'fruit@example.com', address: '7 Fruit Lane', ownerId: normal.id };
    expect((await api().post('/api/admin/stores').set(bearer(token)).send(body)).status).toBe(201);
    expect((await prisma.user.findUnique({ where: { id: normal.id } })).role).toBe('OWNER');
  });

  test('rejects an administrator as owner, or an owner that does not exist', async () => {
    const otherAdmin = await makeUser('ADMIN');
    const body = { name: 'Fresh Fruit Corner Market', email: 'fruit@example.com', address: '7 Fruit Lane' };
    expect((await api().post('/api/admin/stores').set(bearer(token)).send({ ...body, ownerId: otherAdmin.id })).status).toBe(400);
    expect((await api().post('/api/admin/stores').set(bearer(token)).send({ ...body, ownerId: 99999 })).status).toBe(400);
    expect((await api().post('/api/admin/stores').set(bearer(token)).send({ ...body })).status).toBe(422);
  });

  test('database trigger blocks a non-owner from owning a store', async () => {
    const normal = await makeUser('USER');
    await expect(makeStore(normal)).rejects.toBeTruthy();
  });

  test('lists stores with average rating, supports search, sort and filters', async () => {
    const o1 = await makeUser('OWNER'); const o2 = await makeUser('OWNER');
    const s1 = await makeStore(o1, { name: 'Alpha Grocery And General Store', address: 'Pune Main Road' });
    const s2 = await makeStore(o2, { name: 'Zeta Electronics Mega Shop Ltd', address: 'Delhi Ring Road' });
    const u = await makeUser('USER'); const u2 = await makeUser('USER');
    await prisma.rating.createMany({ data: [
      { userId: u.id, storeId: s1.id, rating: 2 }, { userId: u2.id, storeId: s1.id, rating: 3 },
      { userId: u.id, storeId: s2.id, rating: 5 }] });

    const all = await api().get('/api/admin/stores?sortBy=rating&order=desc').set(bearer(token));
    expect(all.body.data.map((s) => s.name)).toEqual([s2.name, s1.name]);
    expect(all.body.data[0].averageRating).toBe(5);
    expect(all.body.data[1].averageRating).toBe(2.5);

    const byAddr = await api().get('/api/admin/stores?address=delhi').set(bearer(token));
    expect(byAddr.body.data).toHaveLength(1);
    const search = await api().get('/api/admin/stores?search=grocery').set(bearer(token));
    expect(search.body.data).toHaveLength(1);
    const desc = await api().get('/api/admin/stores?sortBy=name&order=desc').set(bearer(token));
    expect(desc.body.data[0].name).toBe(s2.name);
  });

  test('empty list returns an empty array', async () => {
    const res = await api().get('/api/admin/stores').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('available owners endpoint lists member accounts without a store (never admins)', async () => {
    const free = await makeUser('OWNER', { name: 'Aaa Free Owner' }); const taken = await makeUser('OWNER');
    const member = await makeUser('USER', { name: 'Bbb Member' });
    await makeStore(taken);
    const res = await api().get('/api/admin/owners/available').set(bearer(token));
    expect(res.body.data.map((o) => o.id)).toEqual([free.id, member.id]);
  });
});
