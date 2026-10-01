import {
  PrismaClient,
  Role,
  CompanyStatus,
  OrderSide,
  OrderType,
  Sentiment,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı seed işlemi başlatılıyor...");
  console.log("");

  // =====================================================
  // 1. CONFIG DEĞERLERİ
  // =====================================================
  console.log("⚙️  Config değerleri oluşturuluyor...");

  const configs = [
    { key: "FEE_BPS", value: "30" },
    { key: "PRICE_LIMIT_PCT", value: "10" },
    { key: "TICK_SIZE", value: "0.10" },
    { key: "STARTING_CASH", value: "1000000" },
    { key: "MARKET_OPEN_HOUR", value: "09" },
    { key: "MARKET_CLOSE_HOUR", value: "18" },
    { key: "MIN_ORDER_QTY", value: "1" },
    { key: "MAX_ORDER_QTY", value: "100000" },
  ];

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("   ✅ Config değerleri oluşturuldu");

  // =====================================================
  // 2. KULLANICILAR
  // =====================================================
  console.log("👥 Kullanıcılar oluşturuluyor...");

  const adminPassword = await bcrypt.hash("CHANGE_ME!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@borsasim.com" },
    update: {},
    create: {
      email: "admin@borsasim.com",
      password: adminPassword,
      name: "Sistem Yöneticisi",
      role: Role.ADMIN,
      emailVerified: true,
      account: {
        create: {
          cash: 0,
          totalDeposit: 0,
        },
      },
    },
  });
  console.log("   ✅ Admin: " + admin.email);

  const studentPassword = await bcrypt.hash("Ogrenci123!", 10);

  const students = [
    { email: "ahmet.yilmaz@borsasim.com", name: "Ahmet Yılmaz", cash: 1000000 },
    { email: "ayse.demir@borsasim.com", name: "Ayşe Demir", cash: 1000000 },
    { email: "mehmet.kaya@borsasim.com", name: "Mehmet Kaya", cash: 1000000 },
    { email: "fatma.celik@borsasim.com", name: "Fatma Çelik", cash: 1000000 },
    { email: "ali.ozturk@borsasim.com", name: "Ali Öztürk", cash: 1000000 },
    {
      email: "zeynep.arslan@borsasim.com",
      name: "Zeynep Arslan",
      cash: 1000000,
    },
    {
      email: "mustafa.sahin@borsasim.com",
      name: "Mustafa Şahin",
      cash: 1000000,
    },
    { email: "elif.yildiz@borsasim.com", name: "Elif Yıldız", cash: 1000000 },
    { email: "hasan.aydin@borsasim.com", name: "Hasan Aydın", cash: 1000000 },
    {
      email: "selin.korkmaz@borsasim.com",
      name: "Selin Korkmaz",
      cash: 1000000,
    },
    { email: "ogrenci@borsasim.com", name: "Test Öğrenci", cash: 1000000 },
  ];

  const createdStudents: any[] = [];
  for (const student of students) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        password: studentPassword,
        name: student.name,
        role: Role.STUDENT,
        emailVerified: true,
        account: {
          create: {
            cash: student.cash,
            totalDeposit: student.cash,
          },
        },
      },
    });
    createdStudents.push(user);
  }
  console.log("   ✅ " + createdStudents.length + " öğrenci oluşturuldu");

  // =====================================================
  // 3. FİRMALAR
  // =====================================================
  console.log("🏢 Firmalar oluşturuluyor...");

  const companies = [
    {
      symbol: "TEKNO",
      name: "Tekno Yazılım A.Ş.",
      sector: "Teknoloji",
      description:
        "Kurumsal yazılım çözümleri ve bulut hizmetleri sunan lider teknoloji şirketi.",
      currentPrice: 45.5,
      freeFloat: 30,
    },
    {
      symbol: "CYBER",
      name: "Siber Güvenlik Holding",
      sector: "Teknoloji",
      description: "Türkiye'nin önde gelen siber güvenlik şirketi.",
      currentPrice: 78.25,
      freeFloat: 25,
    },
    {
      symbol: "OYUN",
      name: "Dijital Oyun Studios",
      sector: "Teknoloji",
      description: "Mobil ve PC oyun geliştirme stüdyosu.",
      currentPrice: 125.0,
      freeFloat: 35,
    },
    {
      symbol: "BANK",
      name: "Milli Kalkınma Bankası",
      sector: "Finans",
      description: "Türkiye'nin köklü bankalarından biri.",
      currentPrice: 89.75,
      freeFloat: 40,
    },
    {
      symbol: "SIGOR",
      name: "Anadolu Sigorta",
      sector: "Finans",
      description:
        "Hayat, sağlık, araç ve konut sigortası alanlarında faaliyet göstermektedir.",
      currentPrice: 34.2,
      freeFloat: 28,
    },
    {
      symbol: "YATIR",
      name: "Sermaye Yatırım Ortaklığı",
      sector: "Finans",
      description: "Çeşitlendirilmiş portföy yönetimi ve yatırım danışmanlığı.",
      currentPrice: 156.8,
      freeFloat: 20,
    },
    {
      symbol: "ENERJ",
      name: "Yeşil Enerji Holding",
      sector: "Enerji",
      description:
        "Rüzgar, güneş ve hidroelektrik santralleri işleten yenilenebilir enerji şirketi.",
      currentPrice: 67.3,
      freeFloat: 32,
    },
    {
      symbol: "PETRO",
      name: "Petrol Rafineri A.Ş.",
      sector: "Enerji",
      description: "Ham petrol işleme ve petrokimya ürünleri üretimi.",
      currentPrice: 234.5,
      freeFloat: 15,
    },
    {
      symbol: "OTOM",
      name: "Anadolu Otomotiv",
      sector: "Sanayi",
      description: "Binek ve ticari araç üretimi yapan otomotiv üreticisi.",
      currentPrice: 412.0,
      freeFloat: 22,
    },
    {
      symbol: "CELIK",
      name: "Demir Çelik Sanayi",
      sector: "Sanayi",
      description:
        "Yassı ve uzun çelik ürünleri üreten entegre demir-çelik tesisi.",
      currentPrice: 28.9,
      freeFloat: 45,
    },
    {
      symbol: "MAKINE",
      name: "Endüstriyel Makine A.Ş.",
      sector: "Sanayi",
      description:
        "CNC tezgahları ve endüstriyel robotlar üreten makine imalatçısı.",
      currentPrice: 95.6,
      freeFloat: 30,
    },
    {
      symbol: "GIDA",
      name: "Ulusal Gıda Grubu",
      sector: "Tüketim",
      description:
        "Süt ürünleri, içecekler ve hazır gıda alanlarında faaliyet göstermektedir.",
      currentPrice: 52.4,
      freeFloat: 38,
    },
    {
      symbol: "PERAK",
      name: "Perakende Zinciri A.Ş.",
      sector: "Tüketim",
      description:
        "Türkiye genelinde 500'den fazla mağazası bulunan süpermarket zinciri.",
      currentPrice: 18.75,
      freeFloat: 50,
    },
    {
      symbol: "TEKST",
      name: "Tekstil Holding",
      sector: "Tüketim",
      description: "Hazır giyim, ev tekstili ve teknik tekstil üretimi.",
      currentPrice: 41.25,
      freeFloat: 35,
    },
    {
      symbol: "SAGLIK",
      name: "Medikal Sağlık Grubu",
      sector: "Sağlık",
      description:
        "Özel hastaneler ve tıbbi laboratuvarlar işleten sağlık hizmetleri şirketi.",
      currentPrice: 187.5,
      freeFloat: 25,
    },
    {
      symbol: "ILAC",
      name: "Farma İlaç Sanayi",
      sector: "Sağlık",
      description: "Jenerik ve orijinal ilaç üretimi yapan ilaç şirketi.",
      currentPrice: 145.0,
      freeFloat: 28,
    },
    {
      symbol: "INSAAT",
      name: "Mega İnşaat Holding",
      sector: "İnşaat",
      description:
        "Konut, ticari ve altyapı projeleri geliştiren inşaat şirketi.",
      currentPrice: 23.8,
      freeFloat: 42,
    },
    {
      symbol: "CIMENTO",
      name: "Anadolu Çimento",
      sector: "İnşaat",
      description: "Çimento, hazır beton ve agrega üretimi.",
      currentPrice: 56.9,
      freeFloat: 33,
    },
    {
      symbol: "TELEKOM",
      name: "Ulusal Telekom",
      sector: "İletişim",
      description: "Mobil ve sabit hat telefon hizmetleri, internet ve IPTV.",
      currentPrice: 32.15,
      freeFloat: 48,
    },
    {
      symbol: "MEDYA",
      name: "Dijital Medya Grubu",
      sector: "İletişim",
      description: "Televizyon kanalları ve dijital yayın platformları.",
      currentPrice: 14.6,
      freeFloat: 55,
    },
  ];

  const createdCompanies: any[] = [];
  for (const company of companies) {
    const created = await prisma.company.upsert({
      where: { symbol: company.symbol },
      update: {
        name: company.name,
        sector: company.sector,
        description: company.description,
        currentPrice: company.currentPrice,
        lastPrice: company.currentPrice,
        openPrice: company.currentPrice,
        highPrice: company.currentPrice * 1.02,
        lowPrice: company.currentPrice * 0.98,
        freeFloat: company.freeFloat,
        ipoMinPrice: company.currentPrice * 0.8,
        ipoMaxPrice: company.currentPrice * 1.2,
        status: CompanyStatus.OPEN,
        isActive: true,
      },
      create: {
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
        description: company.description,
        currentPrice: company.currentPrice,
        lastPrice: company.currentPrice,
        openPrice: company.currentPrice,
        highPrice: company.currentPrice * 1.02,
        lowPrice: company.currentPrice * 0.98,
        freeFloat: company.freeFloat,
        ipoMinPrice: company.currentPrice * 0.8,
        ipoMaxPrice: company.currentPrice * 1.2,
        status: CompanyStatus.OPEN,
        isActive: true,
      },
    });
    createdCompanies.push(created);
  }
  console.log("   ✅ " + createdCompanies.length + " firma oluşturuldu");

  // =====================================================
  // 4. HABERLER
  // =====================================================
  console.log("📰 Haberler oluşturuluyor...");

  const companyMap: Record<string, string> = {};
  for (const company of createdCompanies) {
    companyMap[company.symbol] = company.id;
  }

  const news = [
    {
      companyId: null,
      title: "Merkez Bankası Faiz Kararını Açıkladı",
      body: "Merkez Bankası Para Politikası Kurulu, politika faizini sabit tutma kararı aldı. Kurul, enflasyondaki düşüş eğiliminin devam ettiğini vurguladı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: null,
      title: "Borsa İstanbul Yeni Rekor Kırdı",
      body: "BIST 100 endeksi, yabancı yatırımcıların artan ilgisiyle birlikte tarihi zirvesini yeniledi.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: null,
      title: "Küresel Piyasalarda Dalgalanma",
      body: "ABD'de açıklanan enflasyon verileri beklentilerin üzerinde geldi. Fed'in faiz artırımına devam edeceği beklentisi satış baskısı yarattı.",
      sentiment: Sentiment.NEG,
    },
    {
      companyId: companyMap["TEKNO"],
      title: "TEKNO Yapay Zeka Girişimi Satın Aldı",
      body: "Tekno Yazılım, yapay zeka alanında faaliyet gösteren yerli bir girişimi 50 milyon dolar karşılığında satın aldı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["CYBER"],
      title: "CYBER Uluslararası Sertifika Aldı",
      body: "Siber Güvenlik Holding, prestijli ISO 27001 ve SOC 2 sertifikalarını aldı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["OYUN"],
      title: "OYUN Yeni Oyunu 10 Milyon İndirmeye Ulaştı",
      body: "Dijital Oyun Studios'un son çıkardığı mobil oyun, dünya genelinde 10 milyon indirme sayısına ulaştı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["BANK"],
      title: "BANK Kredi Hacmini Artırdı",
      body: "Milli Kalkınma Bankası, yılın ilk yarısında kredi hacmini %25 artırdı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["SIGOR"],
      title: "SIGOR Kar Payı Dağıtacak",
      body: "Anadolu Sigorta, 2024 yılı için hisse başına 2.50 TL temettü dağıtacağını açıkladı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["ENERJ"],
      title: "ENERJ Yeni Güneş Santrali Açtı",
      body: "Yeşil Enerji Holding, Konya'da 100 MW kapasiteli yeni güneş enerjisi santralini faaliyete geçirdi.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["PETRO"],
      title: "PETRO Rafineri Modernizasyonunu Tamamladı",
      body: "Petrol Rafineri, 500 milyon dolarlık yatırımla tamamladığı modernizasyon projesiyle üretim kapasitesini %30 artırdı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["OTOM"],
      title: "OTOM Elektrikli Araç Satışlarını Artırdı",
      body: "Anadolu Otomotiv, elektrikli araç segmentinde pazar payını %15'e çıkardı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["CELIK"],
      title: "CELIK İhracat Rekorunu Kırdı",
      body: "Demir Çelik Sanayi, aylık ihracatta yeni rekor kırdı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["GIDA"],
      title: "GIDA Yeni Ürün Serisi Tanıttı",
      body: "Ulusal Gıda Grubu, sağlıklı beslenme trendine yönelik yeni organik ürün serisini tanıttı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["SAGLIK"],
      title: "SAGLIK Yeni Hastane Açtı",
      body: "Medikal Sağlık Grubu, İstanbul'da 500 yataklı yeni hastanesini hizmete açtı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["ILAC"],
      title: "ILAC FDA Onayı Aldı",
      body: "Farma İlaç Sanayi, geliştirdiği kanser ilacı için ABD Gıda ve İlaç İdaresi'nden (FDA) onay aldı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["INSAAT"],
      title: "INSAAT Yeni Mega Proje İhalesi Kazandı",
      body: "Mega İnşaat Holding, 5 milyar dolarlık havalimanı genişletme projesinin ihalesini kazandı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["TELEKOM"],
      title: "TELEKOM 5G Şebekesini Genişletti",
      body: "Ulusal Telekom, 5G kapsama alanını 81 ilin tamamına genişletti.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["MEDYA"],
      title: "MEDYA Abone Sayısını Artırdı",
      body: "Dijital Medya Grubu'nun streaming platformu, 5 milyon abone sayısına ulaştı.",
      sentiment: Sentiment.POS,
    },
    {
      companyId: companyMap["INSAAT"],
      title: "INSAAT Maliyet Artışlarından Etkilendi",
      body: "Mega İnşaat Holding, artan hammadde maliyetleri nedeniyle kar marjlarında düşüş yaşandığını açıkladı.",
      sentiment: Sentiment.NEG,
    },
    {
      companyId: companyMap["PERAK"],
      title: "PERAK Tüketici Güveni Düşük",
      body: "Perakende Zinciri, düşen tüketici güveni nedeniyle yıl sonu hedeflerini revize etti.",
      sentiment: Sentiment.NEG,
    },
  ];

  for (const item of news) {
    await prisma.news.create({
      data: {
        companyId: item.companyId,
        title: item.title,
        body: item.body,
        sentiment: item.sentiment,
        publishedAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ),
      },
    });
  }
  console.log("   ✅ " + news.length + " haber oluşturuldu");

  // =====================================================
  // 5. ÖRNEK POZİSYONLAR
  // =====================================================
  console.log("📊 Örnek pozisyonlar oluşturuluyor...");

  const positionsData = [
    { studentIndex: 0, symbol: "TEKNO", quantity: 500, avgPrice: 44.0 },
    { studentIndex: 0, symbol: "BANK", quantity: 300, avgPrice: 88.5 },
    { studentIndex: 1, symbol: "CYBER", quantity: 400, avgPrice: 77.0 },
    { studentIndex: 1, symbol: "GIDA", quantity: 600, avgPrice: 51.8 },
    { studentIndex: 2, symbol: "OTOM", quantity: 100, avgPrice: 408.0 },
    { studentIndex: 2, symbol: "SIGOR", quantity: 800, avgPrice: 33.5 },
    { studentIndex: 3, symbol: "SAGLIK", quantity: 150, avgPrice: 185.0 },
    { studentIndex: 3, symbol: "ILAC", quantity: 200, avgPrice: 143.0 },
    { studentIndex: 4, symbol: "OYUN", quantity: 250, avgPrice: 122.0 },
    { studentIndex: 4, symbol: "YATIR", quantity: 100, avgPrice: 155.0 },
  ];

  let positionCount = 0;
  for (const pos of positionsData) {
    const student = createdStudents[pos.studentIndex];
    const company = createdCompanies.find((c: any) => c.symbol === pos.symbol);

    if (student && company) {
      const cost = pos.quantity * pos.avgPrice;

      await prisma.position.upsert({
        where: {
          userId_companyId: {
            userId: student.id,
            companyId: company.id,
          },
        },
        update: {
          quantity: pos.quantity,
          avgPrice: pos.avgPrice,
        },
        create: {
          userId: student.id,
          companyId: company.id,
          quantity: pos.quantity,
          avgPrice: pos.avgPrice,
        },
      });

      await prisma.account.update({
        where: { userId: student.id },
        data: {
          cash: { decrement: cost },
        },
      });

      positionCount++;
    }
  }
  console.log("   ✅ " + positionCount + " pozisyon oluşturuldu");

  // =====================================================
  // 6. ÖRNEK EMİRLER
  // =====================================================
  console.log("📋 Örnek emirler oluşturuluyor...");

  const orderBookOrders = [
    {
      symbol: "TEKNO",
      studentIndex: 5,
      side: OrderSide.BUY,
      price: 44.5,
      qty: 100,
    },
    {
      symbol: "TEKNO",
      studentIndex: 6,
      side: OrderSide.BUY,
      price: 44.0,
      qty: 200,
    },
    {
      symbol: "TEKNO",
      studentIndex: 7,
      side: OrderSide.BUY,
      price: 43.5,
      qty: 150,
    },
    {
      symbol: "BANK",
      studentIndex: 8,
      side: OrderSide.BUY,
      price: 89.0,
      qty: 50,
    },
    {
      symbol: "BANK",
      studentIndex: 9,
      side: OrderSide.BUY,
      price: 88.5,
      qty: 100,
    },
    {
      symbol: "ENERJ",
      studentIndex: 6,
      side: OrderSide.BUY,
      price: 66.5,
      qty: 100,
    },
    {
      symbol: "ENERJ",
      studentIndex: 7,
      side: OrderSide.BUY,
      price: 66.0,
      qty: 150,
    },
    {
      symbol: "CYBER",
      studentIndex: 5,
      side: OrderSide.BUY,
      price: 77.5,
      qty: 80,
    },
    {
      symbol: "CYBER",
      studentIndex: 6,
      side: OrderSide.BUY,
      price: 77.0,
      qty: 100,
    },
  ];

  let orderCount = 0;
  for (const orderData of orderBookOrders) {
    const student = createdStudents[orderData.studentIndex];
    const company = createdCompanies.find(
      (c: any) => c.symbol === orderData.symbol
    );

    if (student && company) {
      const lockedAmount = orderData.price * orderData.qty;
      await prisma.account.update({
        where: { userId: student.id },
        data: {
          cash: { decrement: lockedAmount },
          lockedCash: { increment: lockedAmount },
        },
      });

      await prisma.order.create({
        data: {
          userId: student.id,
          companyId: company.id,
          side: orderData.side,
          type: OrderType.LIMIT,
          price: orderData.price,
          qty: orderData.qty,
          remaining: orderData.qty,
          filled: 0,
          status: "OPEN",
        },
      });

      orderCount++;
    }
  }
  console.log("   ✅ " + orderCount + " emir oluşturuldu");

  // =====================================================
  // 7. IPO PENCERESİ
  // =====================================================
  console.log("🎯 IPO penceresi oluşturuluyor...");

  const ipoCompany = await prisma.company.upsert({
    where: { symbol: "YAPAY" },
    update: {},
    create: {
      symbol: "YAPAY",
      name: "Yapay Zeka Teknolojileri A.Ş.",
      sector: "Teknoloji",
      description:
        "Türkiye'nin ilk büyük dil modeli (LLM) geliştiren yapay zeka şirketi.",
      status: CompanyStatus.IPO,
      isActive: true,
      currentPrice: 0,
      ipoMinPrice: 50.0,
      ipoMaxPrice: 75.0,
      freeFloat: 25,
      ipoShares: 10000000,
    },
  });

  const now = new Date();
  const ipoEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.ipoWindow.create({
    data: {
      companyId: ipoCompany.id,
      startsAt: now,
      endsAt: ipoEndDate,
      isAllocated: false,
    },
  });
  console.log("   ✅ IPO penceresi oluşturuldu: YAPAY");

  // =====================================================
  // ÖZET
  // =====================================================
  console.log("");
  console.log("════════════════════════════════════════════════════");
  console.log("🎉 Seed işlemi başarıyla tamamlandı!");
  console.log("════════════════════════════════════════════════════");
  console.log("");
  console.log("📊 Oluşturulan Veriler:");
  console.log("   • " + configs.length + " config değeri");
  console.log("   • 1 admin kullanıcı");
  console.log("   • " + createdStudents.length + " öğrenci kullanıcı");
  console.log("   • " + (createdCompanies.length + 1) + " firma");
  console.log("   • " + news.length + " haber");
  console.log("   • " + positionCount + " pozisyon");
  console.log("   • " + orderCount + " açık emir");
  console.log("   • 1 aktif IPO penceresi");
  console.log("");
  console.log("👤 Giriş Bilgileri:");
  console.log("   Admin: admin@borsasim.com / CHANGE_ME!");
  console.log("   Öğrenci: ogrenci@borsasim.com / Ogrenci123!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
