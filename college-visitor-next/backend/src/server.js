import "dotenv/config";

import { createApp } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT || 4000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`College Visitor API running on http://localhost:${port}`);
});

const shutdown = async () => {
  console.log("Shutting down API server...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
