import { getCurrentUser } from "@/lib/auth";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const user = await getCurrentUser();
  const { chatId } = await params;

  return <ChatWorkspace currentUser={user} initialChatId={chatId} />;
}
