import { SendingSettings } from "@/components/sending-settings";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSenderAccount } from "@/lib/db-mappers";

export default async function SendingPage() {
  const user = await requireUser();
  const accounts = await prisma.senderAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <SendingSettings initialAccounts={accounts.map((account) => ({ ...toSenderAccount(account), smtp_password_encrypted: null }))} />;
}
