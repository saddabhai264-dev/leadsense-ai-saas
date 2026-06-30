import { SendingSettings } from "@/components/sending-settings";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSenderAccount } from "@/lib/db-mappers";
import { DataErrorState } from "@/components/data-error-state";

export default async function SendingPage() {
  const user = await requireUser();
  try {
    const accounts = await prisma.senderAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return <SendingSettings initialAccounts={accounts.map((account) => ({ ...toSenderAccount(account), smtp_password_encrypted: null }))} />;
  } catch (error) {
    console.error("Failed to load sender accounts", error);
    return <DataErrorState title="Could not load sender accounts" />;
  }
}
