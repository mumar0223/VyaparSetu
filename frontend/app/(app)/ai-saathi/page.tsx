import { getCurrentUser } from "@/lib/auth";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export const dynamic = "force-dynamic";

export default async function AISaathiPage() {
  const user = await getCurrentUser();

  return <ChatWorkspace currentUser={user} />;
}
