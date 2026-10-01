import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { loginSchema, registerSchema } from "../schemas/index.js";
import { validateBody } from "../middleware/validate.js";
import { Role } from "@prisma/client";
import config from "../config/index.js";
import { sendVerificationEmail } from "../lib/email.js";
import crypto from "crypto";

export default async function authRoutes(fastify: FastifyInstance) {
  // Kayıt ol
  fastify.post(
    "/register",
    {
      config: {
        // Kayıt spam'ini ve otomatik hesap üretimini sınırla.
        rateLimit: { max: 5, timeWindow: "10 minutes" },
      },
      preHandler: validateBody(registerSchema),
    },
    async (request, reply) => {
      const { email, password, name } = request.body as any;

      // 1. Kayıt durumu kontrolü
      const regStatus = await prisma.config.findUnique({
        where: { key: "REGISTRATION_STATUS" },
      });

      if (regStatus && regStatus.value === "CLOSED") {
        return reply.code(403).send({ error: "Kayıtlar şu anda kapalıdır." });
      }

      // 2. Email domain kontrolü
      // İzin verilenler: @beun.edu.tr veya *.karaelmas.edu.tr
      const emailRegex =
        /^[a-zA-Z0-9._%+-]+@(beun\.edu\.tr|[a-zA-Z0-9-]+\.karaelmas\.edu\.tr)$/;

      if (!emailRegex.test(email)) {
        return reply.code(400).send({
          error:
            "Sadece @beun.edu.tr veya @*.karaelmas.edu.tr uzantılı mailler ile kayıt olabilirsiniz.",
        });
      }

      // Email kontrolü
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.code(400).send({ error: "Bu email zaten kullanılıyor" });
      }

      // Şifre hash
      const hashedPassword = await bcrypt.hash(password, 10);

      // Doğrulama kodu oluştur
      const verificationCode = crypto.randomInt(100000, 999999).toString();
      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 dk

      // Kullanıcı oluştur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: Role.STUDENT,
          emailVerified: false,
          verificationToken: verificationCode,
          verificationTokenExpiry: verificationExpiry,
          account: {
            create: {
              cash: config.startingCash,
              totalDeposit: config.startingCash,
            },
          },
        },
        include: {
          account: true,
        },
      });

      // Email gönder
      const emailSent = await sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        // Geliştirme kolaylığı için: Mail gitmezse konsola bas
        console.log("------------------------------------------");
        console.log("⚠️ UYARI: Email gönderilemedi!");
        console.log(`📧 Alıcı: ${email}`);
        console.log(`🔑 Doğrulama Kodu: ${verificationCode}`);
        console.log("------------------------------------------");
      }

      return reply.send({
        message: "verification_sent",
        email: user.email,
        description: emailSent 
          ? "Lütfen email adresinize gönderilen doğrulama kodunu giriniz." 
          : "Email gönderilemedi. Lütfen sunucu loglarını kontrol edin veya yöneticinize danışın."
      });
    }
  );

  // Email Doğrulama
  // Kaba kuvvet (brute-force) koruması: kod başına en fazla MAX_VERIFY_ATTEMPTS deneme.
  const MAX_VERIFY_ATTEMPTS = 5;
  fastify.post(
    "/verify-email",
    {
      config: {
        // 6 haneli kodun kaba kuvvetle denenmesini IP bazında da sınırla.
        rateLimit: { max: 10, timeWindow: "10 minutes" },
      },
    },
    async (request, reply) => {
    const { email, code } = request.body as any;

    if (!email || !code) {
      return reply.code(400).send({ error: "Email ve kod gereklidir" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.code(404).send({ error: "Kullanıcı bulunamadı" });
    }

    if (user.emailVerified) {
      return reply.code(400).send({ error: "Email zaten doğrulanmış" });
    }

    // Kod hiç yoksa (deneme limiti dolmuş veya süresi geçmiş) yeni kod iste.
    if (!user.verificationToken || !user.verificationTokenExpiry) {
      return reply.code(400).send({
        error: "Doğrulama kodu geçersiz. Lütfen yeni kod isteyin.",
        code: "CODE_INVALIDATED",
      });
    }

    // Süre dolmuşsa
    if (user.verificationTokenExpiry < new Date()) {
      return reply.code(400).send({ error: "Kodun süresi dolmuş. Lütfen yeni kod isteyin." });
    }

    // Kod yanlışsa: deneme sayısını artır, limit dolduysa kodu iptal et.
    if (user.verificationToken !== code) {
      const newAttempts = user.verificationAttempts + 1;

      if (newAttempts >= MAX_VERIFY_ATTEMPTS) {
        // Çok fazla yanlış deneme: kodu tamamen geçersiz kıl.
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: null,
            verificationTokenExpiry: null,
            verificationAttempts: 0,
          },
        });
        return reply.code(429).send({
          error:
            "Çok fazla hatalı deneme yaptınız. Kod iptal edildi, lütfen yeni kod isteyin.",
          code: "TOO_MANY_ATTEMPTS",
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: newAttempts },
      });

      return reply.code(400).send({
        error: `Geçersiz kod. Kalan deneme hakkı: ${MAX_VERIFY_ATTEMPTS - newAttempts}`,
      });
    }

    // Doğrulama başarılı
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        verificationAttempts: 0,
      },
    });

    // Token oluştur
    const token = fastify.jwt.sign({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return reply.send({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
      token,
    });
  });

  // Kod tekrar gönder
  fastify.post(
    "/resend-code",
    {
      config: {
        // Kod gönderim spam'ini sınırla.
        rateLimit: { max: 3, timeWindow: "10 minutes" },
      },
    },
    async (request, reply) => {
    const { email } = request.body as any;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return reply.code(404).send({ error: "Kullanıcı bulunamadı" });
    if (user.emailVerified) return reply.code(400).send({ error: "Zaten doğrulanmış" });

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationCode,
        verificationTokenExpiry: verificationExpiry,
        // Yeni kod ile deneme sayacını sıfırla.
        verificationAttempts: 0,
      },
    });

    const emailSent = await sendVerificationEmail(email, verificationCode);
      
    if (!emailSent) {
      console.log("------------------------------------------");
      console.log("⚠️ UYARI: (Tekrar) Email gönderilemedi!");
      console.log(`📧 Alıcı: ${email}`);
      console.log(`🔑 Doğrulama Kodu: ${verificationCode}`);
      console.log("------------------------------------------");
    }

    return reply.send({ message: "Kod tekrar gönderildi" });
  });

  // Giriş yap
  fastify.post(
    "/login",
    {
      config: {
        // Şifre kaba kuvvet denemelerini sınırla.
        rateLimit: { max: 10, timeWindow: "5 minutes" },
      },
    },
    async (request, reply) => {
    try {
      const { email, password } = request.body as any;

      if (!email || !password) {
        return reply.code(400).send({ error: "Email ve şifre gereklidir" });
      }

      // Kullanıcı kontrolü
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          account: true,
        },
      });

      if (!user) {
        return reply.code(401).send({ error: "Email veya şifre hatalı" });
      }

      if (!user.isActive) {
        return reply.code(401).send({ error: "Hesabınız aktif değil" });
      }

      // Email doğrulama kontrolü
      if (!user.emailVerified) {
        return reply.code(403).send({ 
          error: "Lütfen önce email adresinizi doğrulayın", 
          code: "EMAIL_NOT_VERIFIED",
          email: user.email 
        });
      }

      // Şifre kontrolü
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return reply.code(401).send({ error: "Email veya şifre hatalı" });
      }

      // Access token
      const accessToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        {
          expiresIn: config.jwtAccessExpiry,
        }
      );

      // Refresh token
      const refreshToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          type: "refresh",
        },
        {
          expiresIn: config.jwtRefreshExpiry,
        }
      );

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          cash: user.account?.cash,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      fastify.log.error({ error }, "Login error");
      return reply.code(500).send({ error: "Sunucu hatası" });
    }
  });

  // Token yenile
  fastify.post(
    "/refresh",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "5 minutes" },
      },
    },
    async (request, reply) => {
    try {
      const { refreshToken } = request.body as any;

      if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token gerekli" });
      }

      const decoded = fastify.jwt.verify(refreshToken) as any;

      if (decoded.type !== "refresh") {
        return reply.code(401).send({ error: "Geçersiz token" });
      }

      // Kullanıcı kontrolü
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        return reply.code(401).send({ error: "Geçersiz kullanıcı" });
      }

      // Yeni access token
      const accessToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        {
          expiresIn: config.jwtAccessExpiry,
        }
      );

      return reply.send({ accessToken });
    } catch (err) {
      return reply
        .code(401)
        .send({ error: "Geçersiz veya süresi dolmuş token" });
    }
  });

  // Profil bilgisi
  fastify.get(
    "/me",
    { onRequest: [fastify.authenticate as any] },
    async (request, reply) => {
      const user = (request as any).user;

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          account: true,
          positions: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!userData) {
        return reply.code(404).send({ error: "Kullanıcı bulunamadı" });
      }

      return reply.send({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        account: userData.account,
        positions: userData.positions,
      });
    }
  );
}
