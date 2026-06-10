import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { encode, decode } from "next-auth/jwt";

// Load .env and .env.local manually (no dotenv ordering surprises).
for (const file of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

const BASE = process.env.PROBE_BASE ?? "http://localhost:3123";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const adminEmail = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)[0];

const user =
  (adminEmail &&
    (await prisma.user.findUnique({ where: { email: adminEmail } }))) ||
  (await prisma.user.findFirst({ where: { role: "professional" } })) ||
  (await prisma.user.findFirst());

if (!user) {
  console.error("No user in DB to mint a session for.");
  process.exit(1);
}
console.log("Minting session for:", user.email, "role:", user.role);

const token = {
  id: user.id,
  sub: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  picture: user.image ?? null,
};

const salt = "authjs.session-token";
const jwt = await encode({
  token,
  secret: process.env.AUTH_SECRET,
  salt,
  maxAge: 60 * 60 * 24 * 30,
});

const roundTrip = await decode({
  token: jwt,
  secret: process.env.AUTH_SECRET,
  salt,
}).catch((e) => ({ error: e?.message }));
console.log("decode round-trip:", JSON.stringify(roundTrip));
console.log("AUTH_SECRET present:", Boolean(process.env.AUTH_SECRET));

const cookie = `${salt}=${jwt}`;
const routes = [
  "/",
  "/client",
  "/admin",
  "/admin/messages",
  "/client/messages",
  "/marketplace",
  "/platform/kyc",
  "/platform/support",
  "/support",
  "/api/support/notifications",
];

for (const route of routes) {
  try {
    const res = await fetch(BASE + route, {
      headers: { cookie },
      redirect: "manual",
    });
    let extra = "";
    if (res.status >= 500) {
      const body = await res.text();
      const digest = body.match(/digest[":\s]+([0-9]+)/i);
      extra = digest ? ` digest=${digest[1]}` : " (500)";
    }
    console.log(`${route} -> ${res.status}${extra}`);
  } catch (e) {
    console.log(`${route} -> ERROR ${e?.message ?? e}`);
  }
}

await prisma.$disconnect();
