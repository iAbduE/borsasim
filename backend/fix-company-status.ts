import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tüm IPO durumundaki firmaları OPEN yap
  const result = await prisma.company.updateMany({
    where: {
      status: 'IPO',
    },
    data: {
      status: 'OPEN',
      isActive: true,
    },
  });

  console.log(`✅ ${result.count} firma OPEN durumuna getirildi`);
  
  // Güncellenmiş firmaları listele
  const companies = await prisma.company.findMany({
    where: {
      status: 'OPEN',
      isActive: true,
    },
    select: {
      symbol: true,
      name: true,
      status: true,
      isActive: true,
      currentPrice: true,
    },
  });
  
  console.log('\n📊 Piyasadaki firmalar:');
  companies.forEach(c => {
    console.log(`  - ${c.symbol}: ${c.name} (${c.status}, active: ${c.isActive}, price: ${c.currentPrice})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
