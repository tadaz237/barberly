import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // `url` est optionnel : il n'est requis que pour migrate / db push.
  // En CI on lance uniquement `prisma generate`, qui n'a pas besoin de l'URL.
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "node prisma/seed.ts",
  },
});
