import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppMobileShell } from "@/components/app-mobile-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppMobileShell currentUser={user}>
      {children}
    </AppMobileShell>
  );
}
