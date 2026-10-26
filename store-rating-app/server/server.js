const app = require('./src/app');
const prisma = require('./src/config/db');
const { port } = require('./src/config/env');

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Store Rating API running on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
