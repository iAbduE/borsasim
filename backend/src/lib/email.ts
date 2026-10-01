import nodemailer from "nodemailer";
import config from "../config/index.js";
import logger from "./logger.js";

// Transporter oluştur
// Gmail kullanıyorsak 'service' modunu kullanalım, bu daha stabil olabilir
const isGmail = config.smtp.host === 'smtp.gmail.com';

const transporter = nodemailer.createTransport({
  ...(isGmail ? { service: 'gmail' } : {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
  }),
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  debug: true, 
  logger: true 
});

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: "BorsaSim Email Doğrulama Kodu",
      text: `Merhaba,\n\nBorsaSim hesabınızı doğrulamak için aşağıdaki kodu kullanın:\n\n${code}\n\nBu kod 15 dakika geçerlidir.\n\nİyi günler.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>BorsaSim'e Hoşgeldiniz!</h2>
            <p>Hesabınızı doğrulamak için lütfen aşağıdaki kodu kullanın:</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; color: #333;">
                ${code}
            </div>
            <p>Bu kod 15 dakika süreyle geçerlidir.</p>
            <hr>
            <p style="font-size: 12px; color: #888;">Eğer bu isteği siz yapmadıysanız lütfen bu maili dikkate almayınız.</p>
        </div>
      `,
    });

    logger.info(`Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error("Error sending email:", error);
    return false;
  }
};
