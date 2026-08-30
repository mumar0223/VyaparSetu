import { getCurrentUser } from "@/lib/auth";
import { LandingClient } from "./_components/landing-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return <LandingClient currentUser={user} />;
}
