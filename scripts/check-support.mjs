import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const conv = await prisma.supportConversation.count();
  console.log("supportConversation.count =", conv);
  const msg = await prisma.supportMessage.count();
  console.log("supportMessage.count =", msg);

  // Exercise the exact admin-list query used by /platform/support.
  const list = await prisma.supportConversation.findMany({
    where: { messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true } } },
      },
    },
  });
  console.log("admin list rows =", list.length);
  console.log("OK: support tables and queries work.");
} catch (error) {
  console.error("SUPPORT QUERY FAILED:");
  console.error(error?.message ?? error);
} finally {
  await prisma.$disconnect();
}
