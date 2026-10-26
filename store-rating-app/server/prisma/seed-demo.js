// OPTIONAL sample data so every screen looks alive: 60 member accounts (30 of them also own a store), 30 stores, ~850 ratings.
// Needs DEMO_PASSWORD in .env (same password rules). Usage: npm run seed:demo
// Safe to run again: it first removes the previous demo data (emails ending in @demo.example) and recreates it.
// It never touches accounts you created yourself.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const c = require('../src/validators/common');

const prisma = new PrismaClient();
const DEMO_DOMAIN = '@demo.example';

// Deterministic "random" numbers so the demo data looks the same every time
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261026);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const STORES = [
  ['Shree Ganesh Kirana and General Store', 'Sector 6 Market, Bhilai'],
  ['Bhilai Fresh Mart', 'Civic Centre Road, Bhilai'],
  ['Sector 9 Sweets and Bakery', 'Sector 9 Main Road, Bhilai'],
  ['Chhattisgarh Handloom Emporium', 'Supela Chowk, Bhilai'],
  ['Nehru Nagar Electronics', 'Nehru Nagar East, Bhilai'],
  ['Maitri Bagh Book Corner', 'Near Maitri Bagh Gate, Bhilai'],
  ['Supela Pharmacy Plus', 'Supela Bazaar, Bhilai'],
  ['Civic Centre Mobile Hub', 'Civic Centre Complex, Bhilai'],
  ['Kohka Fruit and Veg Co', 'Kohka Road, Bhilai'],
  ['Smriti Nagar Stationers', 'Smriti Nagar Chowk, Bhilai'],
  ['Rungta Hardware Traders', 'Power House Road, Bhilai'],
  ['Chai Adda Cafe', 'Risali Sector, Bhilai'],
  ['Risali Tailors and Fabrics', 'Risali Market, Bhilai'],
  ['Station Road Footwear', 'Station Road, Durg'],
  ['Telibandha Organic Store', 'Telibandha, Raipur'],
  ['Power House Auto Parts', 'Power House, Bhilai'],
  ['Khursipar Dairy Fresh', 'Khursipar, Bhilai'],
  ['Hudco Pet Supplies', 'Hudco Colony, Bhilai'],
  ['Vaishali Nagar Gift Gallery', 'Vaishali Nagar, Bhilai'],
  ['Sector 10 Salon and Spa', 'Sector 10, Bhilai'],
  ['Ram Nagar Sports Zone', 'Ram Nagar, Bhilai'],
  ['Kailash Nagar Jewellers', 'Kailash Nagar, Durg'],
  ['Nandini Road Optical House', 'Nandini Road, Bhilai'],
  ['Junwani Cycle Mart', 'Junwani Road, Bhilai'],
  ['Steel Plaza Coffee Roasters', 'Steel Plaza, Bhilai'],
  ['Sector 1 Toy Kingdom', 'Sector 1 Market, Bhilai'],
  ['Mohan Nagar Fresh Bakery', 'Mohan Nagar, Durg'],
  ['Shivaji Chowk Cloth House', 'Shivaji Chowk, Durg'],
  ['Anand Nagar Pooja Samagri', 'Anand Nagar, Bhilai'],
  ['Tulsi Nagar Medical Hall', 'Tulsi Nagar, Bhilai'],
];
const FIRST = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Ishita', 'Kabir', 'Meera', 'Rohan', 'Saanvi', 'Aditya', 'Kavya', 'Yash', 'Nisha', 'Dev', 'Pooja', 'Harsh', 'Riya', 'Karan', 'Tanvi'];
const LAST = ['Sharma', 'Verma', 'Agrawal', 'Soni', 'Patel', 'Yadav', 'Tiwari', 'Sahu', 'Chandra', 'Mishra', 'Dewangan', 'Thakur', 'Gupta', 'Nayak'];
const MEMBERS = 60;

async function main() {
  const pw = c.password.safeParse(process.env.DEMO_PASSWORD || '');
  if (!pw.success) {
    console.error('Set DEMO_PASSWORD in .env first (8-16 chars, one uppercase letter, one special character).');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(pw.data, Number(process.env.BCRYPT_ROUNDS) || 10);

  // 1. remove the previous demo data
  await prisma.store.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });

  // 2. member accounts. One login per person: every member can rate stores,
  //    and members 1-30 also own a store (so they see "My store" filled in).
  const members = [];
  for (let i = 0; i < MEMBERS; i += 1) {
    members.push(
      await prisma.user.create({
        data: {
          name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`,
          email: `user${i + 1}${DEMO_DOMAIN}`,
          address: i < STORES.length ? STORES[i][1] : `${10 + i} Lake View Road, Bhilai`,
          role: i < STORES.length ? 'OWNER' : 'USER',
          passwordHash,
        },
      })
    );
  }

  // 3. stores, each owned by one member
  const stores = [];
  for (let i = 0; i < STORES.length; i += 1) {
    const [name, address] = STORES[i];
    const store = await prisma.store.create({
      data: { name, email: `store${i + 1}${DEMO_DOMAIN}`, address, ownerId: members[i].id },
    });
    // each store has a hidden "quality" so averages differ from 2.4 to 4.9
    stores.push({ ...store, quality: 2.4 + rand() * 2.5, popularity: 0.2 + rand() * 0.6 });
  }

  // 4. ratings spread across the last 30 days (so the charts have a shape); nobody rates their own store
  const now = Date.now();
  const rows = [];
  for (const member of members) {
    for (const store of stores) {
      if (store.ownerId === member.id || rand() > store.popularity) continue;
      const value = Math.max(1, Math.min(5, Math.round(store.quality + (rand() - 0.5) * 2.6)));
      const when = new Date(now - Math.floor(rand() * 30 * 24 * 3600 * 1000));
      rows.push({ userId: member.id, storeId: store.id, rating: value, createdAt: when, updatedAt: when });
    }
  }
  await prisma.rating.createMany({ data: rows });

  console.log(`Demo data ready: ${stores.length} stores, ${members.length} members (${STORES.length} of them own a store), ${rows.length} ratings.`);
  console.log(`Log in with DEMO_PASSWORD as any of user1${DEMO_DOMAIN} ... user${MEMBERS}${DEMO_DOMAIN}`);
  console.log(`(user1-user${STORES.length} also own a store; the others can open one from "My store")`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
