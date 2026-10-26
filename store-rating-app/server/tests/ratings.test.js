const { api, prisma, resetDb, makeUser, makeStore, login, bearer } = require('./helpers');

let owner; let store; let user; let token;
beforeEach(async () => {
  await resetDb();
  owner = await makeUser('OWNER');
  store = await makeStore(owner);
  user = await makeUser('USER');
  token = await login(user);
});
afterAll(() => prisma.$disconnect());

describe('normal user: store listing', () => {
  test('shows overall rating and the user\'s own rating; search and sort work', async () => {
    const other = await makeStore(await makeUser('OWNER'), { name: 'Bravo Hardware Tools And Supplies', address: 'Chennai Bypass' });
    const u2 = await makeUser('USER');
    await prisma.rating.createMany({ data: [
      { userId: user.id, storeId: store.id, rating: 4 }, { userId: u2.id, storeId: store.id, rating: 2 }] });

    const res = await api().get('/api/stores').set(bearer(token));
    expect(res.status).toBe(200);
    const mine = res.body.data.find((s) => s.id === store.id);
    expect(mine.averageRating).toBe(3);
    expect(mine.myRating).toBe(4);
    const untouched = res.body.data.find((s) => s.id === other.id);
    expect(untouched.averageRating).toBeNull();
    expect(untouched.myRating).toBeNull();

    expect((await api().get('/api/stores?search=chennai').set(bearer(token))).body.data).toHaveLength(1);
    expect((await api().get('/api/stores?search=hardware').set(bearer(token))).body.data[0].id).toBe(other.id);
    const rated = await api().get('/api/stores?ratedByMe=true').set(bearer(token));
    expect(rated.body.data.map((s) => s.id)).toEqual([store.id]);
    const sorted = await api().get('/api/stores?sortBy=rating&order=desc').set(bearer(token));
    expect(sorted.body.data[0].id).toBe(store.id);
    const byName = await api().get('/api/stores?sortBy=name&order=desc').set(bearer(token));
    expect(byName.body.data[0].id).toBe(store.id);
  });

  test('SQL-injection style search text is treated as plain text', async () => {
    const res = await api().get("/api/stores?search=' OR 1=1 --").set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(await prisma.store.count()).toBe(1);
  });

  test('get one store / 404 / invalid id', async () => {
    expect((await api().get(`/api/stores/${store.id}`).set(bearer(token))).body.data.id).toBe(store.id);
    expect((await api().get('/api/stores/99999').set(bearer(token))).status).toBe(404);
    expect((await api().get('/api/stores/xyz').set(bearer(token))).status).toBe(422);
  });
});

describe('normal user: ratings', () => {
  test('submits a rating and the average updates', async () => {
    const res = await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 4 });
    expect(res.status).toBe(201);
    expect(res.body.data.store.averageRating).toBe(4);
    expect(res.body.data.store.myRating).toBe(4);
    expect(await prisma.rating.count()).toBe(1);
  });

  test('submitting twice UPDATES the same record (no duplicate)', async () => {
    await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 4 });
    const second = await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 1 });
    expect(second.status).toBe(200);
    expect(await prisma.rating.count()).toBe(1);
    expect(second.body.data.store.myRating).toBe(1);
  });

  test('PATCH modifies an existing rating; 404 if none yet', async () => {
    const none = await api().patch(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 3 });
    expect(none.status).toBe(404);
    await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 5 });
    const res = await api().patch(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.store.averageRating).toBe(2);
  });

  test('a user can never change another user\'s rating', async () => {
    const other = await makeUser('USER');
    await prisma.rating.create({ data: { userId: other.id, storeId: store.id, rating: 5 } });
    await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 1 });
    const stillFive = await prisma.rating.findUnique({ where: { userId_storeId: { userId: other.id, storeId: store.id } } });
    expect(stillFive.rating).toBe(5);
    expect(await prisma.rating.count()).toBe(2);
  });

  test.each([0, 6, -1, 3.5, '4', null, 'abc'])('rejects invalid rating %p', async (bad) => {
    const res = await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: bad });
    expect(res.status).toBe(422);
    expect(await prisma.rating.count()).toBe(0);
  });

  test('missing rating field and unknown store', async () => {
    expect((await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({})).status).toBe(422);
    expect((await api().post('/api/stores/99999/ratings').set(bearer(token)).send({ rating: 3 })).status).toBe(404);
  });

  test('average of several users is calculated from real rows', async () => {
    const users = [await makeUser('USER'), await makeUser('USER'), await makeUser('USER')];
    const values = [5, 4, 4];
    for (let i = 0; i < users.length; i += 1) {
      const t = await login(users[i]);
      await api().post(`/api/stores/${store.id}/ratings`).set(bearer(t)).send({ rating: values[i] });
    }
    const res = await api().get(`/api/stores/${store.id}`).set(bearer(token));
    expect(res.body.data.averageRating).toBe(4.33);
    expect(res.body.data.ratingCount).toBe(3);
  });
});

describe('database-level integrity', () => {
  test('unique(user, store) and CHECK(1..5) are enforced by PostgreSQL itself', async () => {
    await prisma.rating.create({ data: { userId: user.id, storeId: store.id, rating: 3 } });
    await expect(prisma.rating.create({ data: { userId: user.id, storeId: store.id, rating: 4 } })).rejects.toBeTruthy();
    const u2 = await makeUser('USER');
    await expect(prisma.rating.create({ data: { userId: u2.id, storeId: store.id, rating: 9 } })).rejects.toBeTruthy();
    await expect(prisma.rating.create({ data: { userId: u2.id, storeId: 99999, rating: 3 } })).rejects.toBeTruthy();
  });
});

describe('store owner', () => {
  test('sees only own store: average, count, distribution and the raters', async () => {
    const otherOwner = await makeUser('OWNER');
    const otherStore = await makeStore(otherOwner);
    const u2 = await makeUser('USER');
    await prisma.rating.createMany({ data: [
      { userId: user.id, storeId: store.id, rating: 5 },
      { userId: u2.id, storeId: store.id, rating: 3 },
      { userId: user.id, storeId: otherStore.id, rating: 1 }] });

    const t = await login(owner);
    const dash = await api().get('/api/owner/dashboard').set(bearer(t));
    expect(dash.status).toBe(200);
    expect(dash.body.data.store.id).toBe(store.id);
    expect(dash.body.data.averageRating).toBe(4);
    expect(dash.body.data.ratingCount).toBe(2);
    expect(dash.body.data.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 });

    const list = await api().get('/api/owner/ratings?sortBy=rating&order=desc').set(bearer(t));
    expect(list.body.data).toHaveLength(2);
    expect(list.body.data[0].rating).toBe(5);
    expect(list.body.data[0].user.email).toBe(user.email);
    expect(list.body.data[0].submittedAt).toBeTruthy();
    expect(list.body.data.every((r) => r.user.passwordHash === undefined)).toBe(true);
    expect(list.body.meta.total).toBe(2);

    const byName = await api().get('/api/owner/ratings?sortBy=userName&order=asc&limit=1').set(bearer(t));
    expect(byName.body.data).toHaveLength(1);
    expect(byName.body.meta.totalPages).toBe(2);
  });

  test('owner has no way to read another store (no store id is accepted)', async () => {
    const otherOwner = await makeUser('OWNER');
    const otherStore = await makeStore(otherOwner);
    await prisma.rating.create({ data: { userId: user.id, storeId: otherStore.id, rating: 1 } });
    const t = await login(owner);
    const res = await api().get(`/api/owner/ratings?storeId=${otherStore.id}`).set(bearer(t));
    expect(res.body.data).toHaveLength(0);
  });

  test('owner without a store gets a clear 404; empty store shows no ratings', async () => {
    const lonely = await makeUser('OWNER');
    const t = await login(lonely);
    expect((await api().get('/api/owner/dashboard').set(bearer(t))).status).toBe(404);
    const t2 = await login(owner);
    const dash = await api().get('/api/owner/dashboard').set(bearer(t2));
    expect(dash.body.data.averageRating).toBeNull();
    expect(dash.body.data.ratingCount).toBe(0);
  });
});

describe('one account, both sides', () => {
  const shop = { name: 'Neha Fancy Store', email: 'nehashop@example.com', address: '12 Station Road, Bhilai' };

  test('a member opens a store, becomes its owner and keeps shopping', async () => {
    const res = await api().post('/api/owner/store').set(bearer(token)).send(shop);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(shop.name);
    expect((await prisma.user.findUnique({ where: { id: user.id } })).role).toBe('OWNER');

    const dash = await api().get('/api/owner/dashboard').set(bearer(token));
    expect(dash.status).toBe(200);
    expect(dash.body.data.store.name).toBe(shop.name);

    // still a shopper: can list and rate somebody else's store with the same login
    expect((await api().get('/api/stores').set(bearer(token))).status).toBe(200);
    expect((await api().post(`/api/stores/${store.id}/ratings`).set(bearer(token)).send({ rating: 5 })).status).toBe(201);
  });

  test('only one store per account, and the store form is validated', async () => {
    expect((await api().post('/api/owner/store').set(bearer(token)).send(shop)).status).toBe(201);
    expect((await api().post('/api/owner/store').set(bearer(token)).send({ ...shop, email: 'x@example.com' })).status).toBe(409);
    const t2 = await login(await makeUser('USER'));
    const bad = await api().post('/api/owner/store').set(bearer(t2)).send({ name: '', email: 'nope', address: '' });
    expect(bad.status).toBe(422);
    expect(Object.keys(bad.body.errors).sort()).toEqual(['address', 'email', 'name']);
  });

  test('nobody can rate their own store', async () => {
    const t = await login(owner);
    expect((await api().post(`/api/stores/${store.id}/ratings`).set(bearer(t)).send({ rating: 5 })).status).toBe(403);
    expect((await api().patch(`/api/stores/${store.id}/ratings`).set(bearer(t)).send({ rating: 5 })).status).toBe(403);
    expect(await prisma.rating.count()).toBe(0);
  });
});
