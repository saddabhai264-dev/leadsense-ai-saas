import net from "node:net";
import tls from "node:tls";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const account = await prisma.senderAccount.findFirst({ where: { id, userId: user.id } });
    if (!account) return NextResponse.json({ error: "Sender account not found" }, { status: 404 });
    if (account.smtpPasswordEncrypted) decryptSecret(account.smtpPasswordEncrypted);
    const result = await testSmtpConnection(account.smtpHost, account.smtpPort);
    await prisma.senderAccount.update({ where: { id }, data: { status: result.ok ? "connected" : "error", lastTestedAt: new Date() } });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}

function testSmtpConnection(host: string, port: number): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const secure = port === 465;
    const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, message: "Connection timed out. Check host, port, firewall, or app password settings." });
    }, 8000);
    socket.once("data", (data) => {
      clearTimeout(timeout);
      const greeting = data.toString();
      socket.end();
      resolve(greeting.startsWith("220") ? { ok: true, message: "SMTP server responded successfully." } : { ok: false, message: `SMTP server responded unexpectedly: ${greeting.slice(0, 80)}` });
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      resolve({ ok: false, message: error.message });
    });
  });
}
