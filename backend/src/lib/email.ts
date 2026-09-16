const EMAILJS_API = "https://api.emailjs.com/api/v1.0/email/send";

interface SendEmailProps {
  to: string;
  templateId: string;
  templateParams: Record<string, string>;
}

async function sendEmail({ to, templateId, templateParams }: SendEmailProps): Promise<boolean> {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!publicKey || !serviceId || !privateKey) {
    console.error("[Email] Missing EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, or EMAILJS_PRIVATE_KEY");
    return false;
  }

  const response = await fetch(EMAILJS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: to,
        ...templateParams,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[Email] Failed to send email:", response.status, text);
    throw new Error(`Email send failed: ${response.status}`);
  }

  return true;
}

interface SendPasswordResetEmailProps {
  to: string;
  username?: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  username,
  resetUrl,
}: SendPasswordResetEmailProps): Promise<boolean> {
  const templateId = process.env.EMAILJS_TEMPLATE_PASSWORD_RESET;

  if (!templateId) {
    console.error("[Email] Missing EMAILJS_TEMPLATE_PASSWORD_RESET");
    return false;
  }

  try {
    return await sendEmail({
      to,
      templateId,
      templateParams: {
        username: username || "there",
        resetUrl,
      },
    });
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error);
    throw error;
  }
}

interface SendVerificationEmailProps {
  to: string;
  username?: string;
  verificationUrl: string;
}

export async function sendVerificationEmail({
  to,
  username,
  verificationUrl,
}: SendVerificationEmailProps): Promise<boolean> {
  const templateId = process.env.EMAILJS_TEMPLATE_VERIFICATION;

  if (!templateId) {
    console.error("[Email] Missing EMAILJS_TEMPLATE_VERIFICATION");
    return false;
  }

  try {
    return await sendEmail({
      to,
      templateId,
      templateParams: {
        username: username || "there",
        verificationUrl,
      },
    });
  } catch (error) {
    console.error("[Email] Failed to send verification email:", error);
    throw error;
  }
}
