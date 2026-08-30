import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let settings = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId: user.id,
        currency: "INR",
        language: "en",
        theme: "light",
        emailAlerts: true,
      },
    });
  }

  return (
    <SettingsClient
      initialSettings={{
        currency: settings.currency || "INR",
        language: settings.language || "en",
        theme: settings.theme || "light",
        emailAlerts: Boolean(settings.emailAlerts),
      }}
    />
  );
}
