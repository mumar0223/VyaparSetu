import { LandingClient } from "./_components/landing-client";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="landing-theme">
      <LandingClient currentUser={null} />
    </div>
  );
}
