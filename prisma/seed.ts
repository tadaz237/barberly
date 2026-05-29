import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const demoServices = [
  {
    id: "srv-brushing-premium",
    name: "Brushing premium à domicile",
    category: "Coiffure femme",
    price: 45,
    duration: 60,
    city: "Paris",
    neighborhood: "Petite couronne",
    description:
      "Un brushing soigné réalisé à domicile pour une coiffure nette, brillante et durable.",
    featured: true,
  },
  {
    id: "srv-tresses-protectrices",
    name: "Tresses protectrices",
    category: "Coiffure afro",
    price: 70,
    duration: 120,
    city: "Lyon",
    neighborhood: "Centre",
    description:
      "Pose de tresses protectrices avec finition propre et conseils d'entretien personnalisés.",
    featured: true,
  },
  {
    id: "srv-coupe-barbe",
    name: "Coupe + barbe express",
    category: "Barbier",
    price: 35,
    duration: 40,
    city: "Marseille",
    neighborhood: "Centre",
    description:
      "Service rapide et précis pour une coupe nette accompagnée d'une taille de barbe structurée.",
    featured: false,
  },
];

async function main() {
  for (const service of demoServices) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: { ...service, ownerId: null },
    });
  }
  console.log(`Seed terminé : ${demoServices.length} services de démo.`);
}

main()
  .catch((error) => {
    console.error("Erreur de seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
