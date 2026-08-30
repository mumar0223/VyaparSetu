import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrivacyConsentClient } from "./privacy-client";

export const dynamic = "force-dynamic";

export default async function PrivacyConsentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let consent = await prisma.privacyConsent.findUnique({
    where: { userId: user.id },
  });

  if (!consent) {
    consent = await prisma.privacyConsent.create({
      data: {
        userId: user.id,
        dataSharing: true,
        marketingEmails: false,
        termsAccepted: true,
      },
    });
  }

  return (
    <PrivacyConsentClient
      initialConsent={{
        dataSharing: Boolean(consent.dataSharing),
        marketingEmails: Boolean(consent.marketingEmails),
        termsAccepted: Boolean(consent.termsAccepted),
      }}
    />
  );
}
