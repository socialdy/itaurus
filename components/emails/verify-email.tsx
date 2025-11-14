import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
  username?: string;
  verificationLink?: string; // This will be the URL provided by better-auth
}

export const VerifyEmail = ({ username, verificationLink }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Bestätigen Sie Ihre E-Mail-Adresse für iTaurus Wartungsmanagement</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Optional: Add your logo here */}
        {/* <Img src={`${baseUrl}/static/itaurus-logo.png`} width="50" height="50" alt="iTaurus Logo" /> */}

        <Heading style={heading}>E-Mail-Adresse bestätigen</Heading>
        <Text style={paragraph}>Hallo {username || "Benutzer"},</Text>
        <Text style={paragraph}>
          Vielen Dank für Ihre Registrierung bei iTaurus Wartungsmanagement.
          Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den unten stehenden Link klicken:
        </Text>
        <Section style={{ textAlign: "center" }}>
          <Button style={{ ...button, padding: "12px 20px" }} href={verificationLink}>
            E-Mail-Adresse bestätigen
          </Button>
        </Section>
        <Text style={paragraph}>
          Falls Sie kein Konto bei iTaurus Wartungsmanagement erstellt haben,
          können Sie diese E-Mail ignorieren.
        </Text>
        {/* Optional: Add a footer with your company name or link */}
        {/* <Text style={footer}>iTaurus Wartungsmanagement</Text> */}
      </Container>
    </Body>
  </Html>
);

export default VerifyEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const button = {
  backgroundColor: "#5F2F9F", // Example button color, you might want to match your theme
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};
