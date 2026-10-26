const { api, prisma, resetDb, makeUser, login, bearer, PASSWORD } = require('./helpers');

const validBody = () => ({
  name: 'Alexander The Great Customer',
  email: 'alex@example.com',
  address: '10 Downing Street',
  password: 'Secret#12',
  confirmPassword: 'Secret#12',
});

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('registration', () => {
  test('creates a normal user and never returns the password hash', async () => {
    const res = await api().post('/api/auth/register').send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.token).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password_hash|\$2b\$/);
    const row = await prisma.user.findUnique({ where: { email: 'alex@example.com' } });
    expect(row.passwordHash).not.toBe('Secret#12');
    expect(row.passwordHash.startsWith('$2')).toBe(true);
  });

  test('ignores a role sent by the client (no privilege escalation)', async () => {
    const res = await api().post('/api/auth/register').send({ ...validBody(), role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');
  });

  test('rejects a duplicate email', async () => {
    await api().post('/api/auth/register').send(validBody());
    const res = await api().post('/api/auth/register').send(validBody());
    expect(res.status).toBe(409);
    expect(res.body.errors.email).toMatch(/already registered/i);
  });

  test.each([
    ['empty name', { name: '   ' }, 'name'],
    ['name over 60 chars', { name: 'x'.repeat(61) }, 'name'],
    ['address over 400 chars', { address: 'a'.repeat(401) }, 'address'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['password too short', { password: 'Ab#1', confirmPassword: 'Ab#1' }, 'password'],
    ['password too long', { password: 'Abcdefgh#12345678', confirmPassword: 'Abcdefgh#12345678' }, 'password'],
    ['password without uppercase', { password: 'secret#12', confirmPassword: 'secret#12' }, 'password'],
    ['password without special char', { password: 'Secret1234', confirmPassword: 'Secret1234' }, 'password'],
    ['password mismatch', { confirmPassword: 'Different#1' }, 'confirmPassword'],
  ])('rejects %s', async (_label, patch, field) => {
    const res = await api().post('/api/auth/register').send({ ...validBody(), ...patch });
    expect(res.status).toBe(422);
    expect(res.body.errors[field]).toBeTruthy();
  });

  test('accepts boundary values (name 2 and 60 chars, password 8 and 16 chars, address 400)', async () => {
    const a = await api().post('/api/auth/register').send({
      ...validBody(), name: 'Al', email: 'a@example.com', address: 'x'.repeat(400), password: 'Abcdef#1', confirmPassword: 'Abcdef#1',
    });
    expect(a.status).toBe(201);
    const b = await api().post('/api/auth/register').send({
      ...validBody(), name: 'b'.repeat(60), email: 'b@example.com', password: 'Abcdefghijklm#12', confirmPassword: 'Abcdefghijklm#12',
    });
    expect(b.status).toBe(201);
  });
});

describe('login & session', () => {
  test('logs in with valid credentials', async () => {
    const user = await makeUser('USER');
    const res = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.token).toBeTruthy();
  });

  test('wrong password and unknown email give the same 401 message', async () => {
    const user = await makeUser('USER');
    const wrong = await api().post('/api/auth/login').send({ email: user.email, password: 'Nope#1234' });
    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Nope#1234' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  test('/me requires a token and returns the current user', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set(bearer('garbage'))).status).toBe(401);
    const user = await makeUser('OWNER');
    const token = await login(user);
    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('OWNER');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('expired token is rejected with 401', async () => {
    const jwt = require('jsonwebtoken');
    const user = await makeUser('USER');
    const expired = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: -10 });
    const res = await api().get('/api/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });
});

describe('change password', () => {
  test('changes the password and the new one works', async () => {
    const user = await makeUser('USER');
    const token = await login(user);
    const res = await api().patch('/api/auth/change-password').set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'Brand#New1', confirmPassword: 'Brand#New1' });
    expect(res.status).toBe(200);
    const old = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    expect(old.status).toBe(401);
    const fresh = await api().post('/api/auth/login').send({ email: user.email, password: 'Brand#New1' });
    expect(fresh.status).toBe(200);
  });

  test('rejects wrong current password, weak new password, mismatch', async () => {
    const user = await makeUser('USER');
    const token = await login(user);
    const wrong = await api().patch('/api/auth/change-password').set(bearer(token))
      .send({ currentPassword: 'Wrong#1234', newPassword: 'Brand#New1', confirmPassword: 'Brand#New1' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.errors.currentPassword).toBeTruthy();
    const weak = await api().patch('/api/auth/change-password').set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'weakpass', confirmPassword: 'weakpass' });
    expect(weak.status).toBe(422);
    const mismatch = await api().patch('/api/auth/change-password').set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'Brand#New1', confirmPassword: 'Brand#New2' });
    expect(mismatch.status).toBe(422);
  });
});
