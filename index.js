
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage
} from "@whiskeysockets/baileys";
import Pino from "pino";
import ytdl from "ytdl-core";
import ytSearch from "yt-search";
import FileType from "file-type";

// ===== CONFIG =====
const PREFIX = ".";
const OWNER_NUMBER = "242069709368";
const POWERED = "\n\n🕷️ Powered by Dark Émeraude";

// ===== PROTECT STATES =====
let protect = {
  antilink: false,
  antibot: false,
  antispam: false,
  autopromote: false
};

// ===== MENU =====
const MENU = `
╭🕷️🍓 𝐃𝐀𝐑𝐊 𝐒𝐏𝐈𝐃𝐄𝐑 𝐆𝐈𝐑𝐋 🍓🕷️
│ Dev : Dark Émeraude
│ Name : DarkSpider_Anya
│ Prefix : .
│ Mode : PRIVATE 🔒
│ Status : Sweet but Deadly
╰━━━━━━━━━━━━━━━━━━━━━━━╯

🕷️ GENERAL
.ping
.alive
.status
.time
.date
.owner
.menu

🎧 MEDIA
.play <music>
.sticker
.toimage

🍓 FUN
.quote
.fact
.user
.take

🕸️ GROUP
.tagall
.kick @user
.kickall
.open
.close
.promote @user
.demote @user
.warn
.join <link>

🛡️ PROTECT
.antilink on/off
.antibot on/off
.antispam on/off
.autopromote on/off

By Dark Émeraude
`;

const quotes = [
  "🕷️ Cute outside, dark inside.",
  "🍓 Même les reines doutent parfois.",
  "🌙 La nuit protège les âmes sensibles.",
  "🖤 Sweet but deadly."
];

function isOwner(sender) {
  return sender?.includes(OWNER_NUMBER);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  // ===== AUTO PROMOTE =====
  sock.ev.on("group-participants.update", async (ev) => {
    if (!protect.autopromote) return;
    if (ev.action === "add") {
      await sock.groupParticipantsUpdate(ev.id, ev.participants, "promote");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    // 🔒 MODE PRIVÉ
    if (!isOwner(sender)) return;

    // 🔗 ANTILINK
    if (protect.antilink && text.includes("http")) {
      await sock.sendMessage(from, { delete: msg.key });
      return;
    }

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ===== GENERAL =====
    if (command === "ping")
      return sock.sendMessage(from, { text: "💓 Pong !" + POWERED });

    if (command === "alive")
      return sock.sendMessage(from, { text: "🕷️ DarkSpider_Anya est vivante." + POWERED });

    if (command === "status")
      return sock.sendMessage(from, { text: "💫 Online & Watching" + POWERED });

    if (command === "time")
      return sock.sendMessage(from, { text: `⏰ ${new Date().toLocaleTimeString()}` + POWERED });

    if (command === "date")
      return sock.sendMessage(from, { text: `📅 ${new Date().toLocaleDateString()}` + POWERED });

    if (command === "owner")
      return sock.sendMessage(from, { text: "👑 Dark Émeraude" + POWERED });

    // ===== MENU (IMAGE + MUSIC) =====
    if (command === "menu") {
      await sock.sendMessage(from, {
        image: {
          url: "https://i.postimg.cc/qvDLp3YZ/cd5fe5a973e9a36b2fb8d0c7356a02dc.jpg"
        },
        caption: MENU + POWERED
      });

      const menuSong = ytdl(
        "https://youtu.be/icu5nPazbxU",
        { filter: "audioonly", quality: "highestaudio" }
      );

      await sock.sendMessage(from, {
        audio: { stream: menuSong },
        mimetype: "audio/mpeg",
        fileName: "DarkSpider_Menu.mp3",
        caption: "🎧 Dark Spider Girl • Menu Theme" + POWERED
      });
    }

    // ===== MEDIA =====
    if (command === "play") {
      if (!args.length)
        return sock.sendMessage(from, { text: "🎧 Donne une musique." + POWERED });

      const search = await ytSearch(args.join(" "));
      const video = search.videos[0];
      if (!video)
        return sock.sendMessage(from, { text: "❌ Introuvable." + POWERED });

      const stream = ytdl(video.url, { filter: "audioonly" });
      await sock.sendMessage(from, {
        audio: { stream },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
        caption: `🎶 ${video.title}` + POWERED
      });
    }

    if (command === "sticker" && msg.message.imageMessage) {
      const buffer = await downloadMediaMessage(msg, "buffer");
      await sock.sendMessage(from, { sticker: buffer });
    }

    if (command === "toimage" && msg.message.stickerMessage) {
      const buffer = await downloadMediaMessage(msg, "buffer");
      const type = await FileType.fromBuffer(buffer);
      await sock.sendMessage(from, { image: buffer, mimetype: type.mime });
    }

    // ===== FUN =====
    if (command === "quote")
      return sock.sendMessage(from, {
        text: quotes[Math.floor(Math.random() * quotes.length)] + POWERED
      });

    if (command === "fact")
      return sock.sendMessage(from, {
        text: "🕷️ Les araignées rêvent vraiment." + POWERED
      });

    if (command === "user")
      return sock.sendMessage(from, {
        text: `👤 ${sender.split("@")[0]}` + POWERED
      });

    if (command === "take")
      return sock.sendMessage(from, {
        text: `📩 Message ID : ${msg.key.id}` + POWERED
      });

    // ===== GROUP =====
    if (command === "tagall") {
      const meta = await sock.groupMetadata(from);
      const mentions = meta.participants.map(p => p.id);
      await sock.sendMessage(from, { text: "🕸️ Tout le monde !" + POWERED, mentions });
    }

    if (command === "kick") {
      const user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (user) await sock.groupParticipantsUpdate(from, user, "remove");
    }

    if (command === "kickall") {
      const meta = await sock.groupMetadata(from);
      const users = meta.participants.map(p => p.id);
      await sock.groupParticipantsUpdate(from, users, "remove");
    }

    if (command === "open")
      await sock.groupSettingUpdate(from, "not_announcement");

    if (command === "close")
      await sock.groupSettingUpdate(from, "announcement");

    if (command === "promote") {
      const user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (user) await sock.groupParticipantsUpdate(from, user, "promote");
    }

    if (command === "demote") {
      const user = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (user) await sock.groupParticipantsUpdate(from, user, "demote");
    }

    if (command === "warn")
      return sock.sendMessage(from, { text: "⚠️ Avertissement envoyé." + POWERED });

    if (command === "join" && args[0])
      await sock.groupAcceptInvite(args[0].split("/").pop());

    // ===== PROTECT TOGGLES =====
    if (command === "antilink") {
      protect.antilink = args[0] === "on";
      return sock.sendMessage(from, { text: `🔗 Antilink ${args[0]}` + POWERED });
    }

    if (command === "antibot") {
      protect.antibot = args[0] === "on";
      return sock.sendMessage(from, { text: `🤖 Antibot ${args[0]}` + POWERED });
    }

    if (command === "antispam") {
      protect.antispam = args[0] === "on";
      return sock.sendMessage(from, { text: `🚫 Antispam ${args[0]}` + POWERED });
    }

    if (command === "autopromote") {
      protect.autopromote = args[0] === "on";
      return sock.sendMessage(from, { text: `👑 Autopromote ${args[0]}` + POWERED });
    }
  });

  sock.ev.on("connection.update", (u) => {
    if (u.connection === "close") {
      if (u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      }
    } else if (u.connection === "open") {
      console.log("🕷️ DarkSpider_Anya connectée");
    }
  });
}

startBot();
