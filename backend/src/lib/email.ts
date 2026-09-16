import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import PasswordResetEmail from "../emails/password-reset";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.resend.com",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER ?? "resend",
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendPasswordResetEmailProps {
  to: string;
  username?: string;
  resetToken: string;
}

export async function sendPasswordResetEmail({
  to,
  username,
  resetToken,
}: SendPasswordResetEmailProps): Promise<boolean> {
  const frontendUrl = process.env.CORS_ORIGIN ?? "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const html = await render(
    PasswordResetEmail({ username, resetUrl })
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "Mekdara <noreply@mekdara.dev>",
      to,
      subject: "Reset your Mekdara password",
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
