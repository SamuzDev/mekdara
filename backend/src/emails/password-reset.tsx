import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  username?: string;
  resetUrl: string;
}

export default function PasswordResetEmail({
  username,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Mekdara password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            Hi {username || "there"},
          </Text>
          <Text style={text}>
            We received a request to reset the password for your Mekdara account. Click the button below to create a new password:
          </Text>
          <Section style={buttonContainer}>
            <Button href={resetUrl} style={button}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Mekdara — Convert any web page or document to clean Markdown for LLMs.
          </Text>
          <Text style={footer}>
            <Link href="https://mekdara.dev" style={link}>
              mekdara.dev
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const text = {
  color: "#a1a1aa",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonContainer = {
  margin: "24px 0",
};

const button = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  borderRadius: "8px",
  display: "block",
};

const hr = {
  borderColor: "#27272a",
  margin: "32px 0",
};

const footer = {
  color: "#52525b",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const link = {
  color: "#71717a",
  textDecoration: "underline",
};
