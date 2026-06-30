import net from "node:net";
import tls from "node:tls";

type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
};

type Mail = {
  to: string;
  subject: string;
  text: string;
  headers?: Record<string, string>;
};

export async function sendSmtpMail(config: SmtpConfig, mail: Mail) {
  const client = await SmtpClient.connect(config.host, config.port);
  try {
    await client.expect(220);
    await client.command(`EHLO leadsense.ai`, 250);
    if (config.port !== 465) {
      await client.command("STARTTLS", 220);
      client.startTls(config.host);
      await client.command(`EHLO leadsense.ai`, 250);
    }
    await client.command("AUTH LOGIN", 334);
    await client.command(Buffer.from(config.username).toString("base64"), 334);
    await client.command(Buffer.from(config.password).toString("base64"), 235);
    await client.command(`MAIL FROM:<${config.fromEmail}>`, 250);
    await client.command(`RCPT TO:<${mail.to}>`, 250);
    await client.command("DATA", 354);
    await client.writeData(formatMessage(config, mail));
    await client.expect(250);
    await client.command("QUIT", 221).catch(() => undefined);
  } finally {
    client.close();
  }
}

function formatMessage(config: SmtpConfig, mail: Mail) {
  const headers = [
    `From: ${encodeHeader(config.fromName)} <${config.fromEmail}>`,
    `To: <${mail.to}>`,
    `Subject: ${encodeHeader(mail.subject)}`,
    config.replyTo ? `Reply-To: ${config.replyTo}` : null,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    ...Object.entries(mail.headers ?? {}).map(([key, value]) => `${key}: ${value}`),
  ].filter(Boolean);
  return `${headers.join("\r\n")}\r\n\r\n${mail.text.replace(/\n/g, "\r\n")}\r\n.`;
}

function encodeHeader(value: string) {
  return /[^\x00-\x7F]/.test(value) ? `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=` : value;
}

class SmtpClient {
  private buffer = "";

  private constructor(private socket: net.Socket | tls.TLSSocket) {}

  static async connect(host: string, port: number) {
    const secure = port === 465;
    const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("SMTP connection timed out")), 10000);
      socket.once("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once("secureConnect", () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once("error", reject);
    });
    return new SmtpClient(socket);
  }

  startTls(host: string) {
    this.socket = tls.connect({ socket: this.socket, servername: host });
    this.buffer = "";
  }

  async command(command: string, expected: number) {
    this.socket.write(`${command}\r\n`);
    return this.expect(expected);
  }

  async writeData(data: string) {
    this.socket.write(`${data}\r\n`);
  }

  async expect(expected: number) {
    const response = await this.readResponse();
    if (!response.startsWith(String(expected))) {
      throw new Error(`SMTP expected ${expected}, got ${response.slice(0, 140)}`);
    }
    return response;
  }

  close() {
    this.socket.destroy();
  }

  private readResponse(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("SMTP response timed out")), 10000);
      const onData = (chunk: Buffer) => {
        this.buffer += chunk.toString("utf8");
        const lines = this.buffer.split(/\r?\n/).filter(Boolean);
        const last = lines.at(-1);
        if (last && /^\d{3}\s/.test(last)) {
          cleanup();
          const response = this.buffer;
          this.buffer = "";
          resolve(response);
        }
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        clearTimeout(timeout);
        this.socket.off("data", onData);
        this.socket.off("error", onError);
      };
      this.socket.on("data", onData);
      this.socket.once("error", onError);
    });
  }
}
