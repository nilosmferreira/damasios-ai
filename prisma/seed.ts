import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar usuário administrador padrão
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@sistema.com" },
    update: {},
    create: {
      email: "admin@sistema.com",
      password: adminPassword,
      role: "ADMINISTRADOR",
    },
  });

  console.log("👤 Usuário administrador criado:", admin.email);

  // Criar um local de exemplo
  const place = await prisma.place.upsert({
    where: { id: "example-place" },
    update: {},
    create: {
      id: "example-place",
      name: "Quadra Principal",
      address: "Rua do Basquete, 123 - Recife, PE",
    },
  });

  console.log("📍 Local criado:", place.name);

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro durante o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
