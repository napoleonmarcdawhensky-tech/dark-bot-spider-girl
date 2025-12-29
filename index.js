
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import Pino from "pino";

const PREFIX = ".";
const POWERED = "\n\nPowered by Dark Émeraude";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ===== COMMANDES =====
    if (command === "ping") {
      await sock.sendMessage(from, { text: "💓 Oui je t’entends !" + POWERED });
    }

    if (command === "alive") {
      await sock.sendMessage(from, { text: "🕷️🍓 DarkSpider_Anya est vivante." + POWERED });
    }

    if (command === "menu") {
      const menu = `
╭🕷️🍓 𝐃𝐀𝐑𝐊 𝐒𝐏𝐈𝐃𝐄𝐑 𝐆𝐈𝐑𝐋 🍓🕷️
│ Dev : Dark Émeraude
│ 🩸 Name    : DarkSpider_Anya
│ 🍓 Prefix  : .
│ 💫 Status  : Online • Sweet but Deadly
╰━━━━━━━━━━━━━━━━━━━━━━━╯

🕷️🍓 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 🍓🕷️
.ping
.alive
.menu

Powered by Dark Émeraude
`;
      await sock.sendMessage(from, { text: menu });
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) console.log("📸 SCANNE CE QR CODE AVEC WHATSAPP");

    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("🕷️🍓 DarkSpider_Anya connectée");
    }
  });
}

startBot();
