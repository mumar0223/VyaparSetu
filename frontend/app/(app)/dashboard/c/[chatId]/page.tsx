import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConversationRedirect({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  redirect(`/ai-saathi/c/${chatId}`);
}
