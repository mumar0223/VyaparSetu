import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

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
    <div className="flex h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
      <AppSidebar currentUser={user} className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <main className="flex-1 h-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

