import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

function getPrismaCliDatabaseUrl() {
  const explicitDirectUrl =
    process.env.DIRECT_DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (explicitDirectUrl) return explicitDirectUrl;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  try {
    const parsedUrl = new URL(databaseUrl);
    if (parsedUrl.hostname.includes(".neon.tech")) {
      parsedUrl.hostname = parsedUrl.hostname.replace(/-pooler(?=\.)/, "");
      return parsedUrl.toString();
    }
  } catch {
    return databaseUrl;
  }

  return databaseUrl;
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Les commandes Prisma CLI ont besoin d'une connexion directe.
  // L'application garde DATABASE_URL pour le runtime serverless / pooler.
  datasource: {
    url: getPrismaCliDatabaseUrl(),
  },
  migrations: {
    seed: "node prisma/seed.ts",
  },
});
