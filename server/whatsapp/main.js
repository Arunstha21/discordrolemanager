const { getFlagMap, translateText } = require("../discord/translate");

const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const messageStore = new Map();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startBot();
      } else {
        console.log("Logged out");
      }
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }
  });

  sock.ev.on("messages.upsert", async (msg) => {
    msg.messages.forEach(async (message) => {
      if (!message.message || !message.key.remoteJid) return;
      messageStore.set(message.key.id, message);

      const chatId = message.key.remoteJid;
      const sender = message.key.participant || message.key.remoteJid;
      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text;

      if (message.key.remoteJid.includes("@g.us") && !message.key.fromMe) {
        const groupMetadata = await sock.groupMetadata(chatId);
        if (groupMetadata.subject === "Tickets") {
          if (text === "Ticket") {
            const responseText = `Hello ${msg.messages[0].pushName}, how can we help you?`;
            await sock
              .sendMessage(sender, { text: responseText }, { quoted: message })
              .then(async () => {
                console.log(`Replied to ${sender}`);
                await sock.sendMessage(chatId, {
                  react: { text: "👍", key: message.key },
                });
              })
              .catch((err) => console.log(err));
          } else {
            const responseText = `Hello ${msg.messages[0].pushName}, Please type 'Ticket' to get help.`;
            await sock
              .sendMessage(chatId, { text: responseText }, { quoted: message })
              .then(() => {
                console.log(`Replied to ${sender}`);
              })
              .catch((err) => console.log(err));
          }
        }
      }
    });
  });

  sock.ev.on("messages.reaction", async (reaction) => {
    reaction.forEach(async (reaction) => {
      const flagMap = await getFlagMap();
      if (flagMap.has(reaction.reaction.text)) {
        const flag = flagMap.get(reaction.reactionText);
        const message = messageStore.get(reaction.key.id);
        if (!message) {
          console.log("Message not found");
          return;
        } else {
          console.log("Message found", message);
          const text =
            message.conversation || message.extendedTextMessage?.text;
          const chatId = message.key.remoteJid || message.key.participant;

          const translate = await translateText(text, flag.code);
          const responseText = `Translated message: ${translate}`;
          console.log("Translated message:", responseText);
          await sock
            .sendMessage(chatId, { text: responseText }, { quoted: message })
            .then(() => {
              console.log("Translated message sent");
            })
            .catch((err) => console.log(err));
        }
      } else {
        console.log(`${reaction.reaction.text} Emoji is not flag`);
      }
    });
  });
}

module.exports = startBot;
