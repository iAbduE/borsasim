import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  Sistem sıfırlama işlemi (Admin korunarak)...");

  // 1. Admin Kullanıcısını Bul
  console.log("🔍 Admin kullanıcısı aranıyor...");
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "admin@borsasim.com" },
        { role: Role.ADMIN }
      ]
    },
    include: {
      account: true
    }
  });

  if (admin) {
    console.log(`✅ Admin bulundu: ${admin.email} (ID: ${admin.id})`);
  } else {
    console.log("⚠️  Admin bulunamadı. Tam temizlik yapılacak.");
  }

  // 2. Transactional Verileri Temizle
  console.log("🧹 İşlem verileri temizleniyor (Trades, Orders, Positions)...");
  
  // Bağımlılık sırasına göre silme
  await prisma.trade.deleteMany({});
  await prisma.auditLog.deleteMany({});
  
  // Önce emirleri sil
  await prisma.order.deleteMany({});
  
  // Sonra pozisyonlar ve IPO'lar
  await prisma.position.deleteMany({});
  await prisma.ipoAllocation.deleteMany({});
  await prisma.ipoDemand.deleteMany({});
  await prisma.ipoWindow.deleteMany({});
  
  // Haberler
  await prisma.news.deleteMany({});
  
  // Reklamlar (İsteğe bağlı - şimdilik siliyoruz, seed tekrar yükler mi? Hayır seed yüklemiyor sanırım. 
  // Ama "her şeyi sil" dendiği için siliyoruz.)
  await prisma.advertisement.deleteMany({});

  // 3. Kullanıcıları ve Hesapları Temizle (Admin Hariç)
  console.log("👥 Kullanıcılar temizleniyor...");
  
  if (admin) {
    // Admin dışındaki tüm hesaplar
    await prisma.account.deleteMany({
      where: {
        userId: { not: admin.id }
      }
    });

    // Admin dışındaki tüm kullanıcılar
    const deleteUsers = await prisma.user.deleteMany({
      where: {
        id: { not: admin.id }
      }
    });
    console.log(`   🗑️  ${deleteUsers.count} kullanıcı silindi.`);

    // Admin hesabını sıfırla (Bakiye, portföy vb.)
    // Admin'in bakiyesini sıfırlamak istiyor muyuz? 
    // "admin hesabını koru" dendiği için şifre ve profile dokunmuyoruz.
    // Ancak borsa sıfırlandığı için bakiyeyi de sıfırlamak mantıklı olabilir.
    // Varsayılan olarak 0 yapalım veya config'deki starting cash?
    // Genelde admin test için para eklemiş olabilir. 
    // Ancak şirketleri sildiğimizde hisseleri boşa düşecek (Position zaten silindi).
    // Nakit bakiyesini de sıfırlayalım ki temiz başlangıç olsun.
    
    // Config'den başlangıç parasını al (opsiyonel, şimdilik 0 yapıyoruz ya da mevcut halini koruyoruz?)
    // Kullanıcı "admin hesabını koru" dedi. En güvenlisi 'Account' kaydına dokunmamak
    // Ama position tabloları silindiği için portföy zaten boşaldı.
    // Nakit kalsın mı? Bence kalsın. "Hesabımı koru" genelde "param gitmesin" de demek olabilir.
    // Ama diğer her şey silindi. Test ortamı sıfırlanıyor.
    // Biz Account tablosuna dokunmuyoruz (deleteMany dışında tuttuk), bu yüzden Admin bakiyesi KORUNUR.
    
  } else {
    // Admin yoksa hepsini sil
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
  }

  // 4. Şirketleri Temizle
  console.log("🏢 Şirketler ve piyasa verileri temizleniyor...");
  // Şirketler silinince, seed script onları tekrar oluşturacak.
  // Böylece fiyatlar başlangıç seviyesine döner.
  await prisma.company.deleteMany({});

  console.log("✅ Veritabanı temizliği tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
