const { getFlagMap, translateText } = require("../discord/translate");
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");

const messageStore = new Map();
const COMMANDS = {
  "faq": "Hello {name}, below is the list of FAQ's: https://docs.google.com/document/d/1mMHGkiFFlG3lH-I4qg86cxSOOB35tCmicU35lleY7T0/edit?tab=t.0",
//   "How to register": "Hello {name}, below is the steps to register:",
  "roadmap": "Hello {name}, below is the roadmap: https://www.youtube.com/watch?v=kG9O9RM9Qrc",
  "timeline": "Hello {name}, below is the timeline: https://www.instagram.com/p/DEziKMpyroE/",
  "register": "Hello {name}, below is the registration link: https://esports.pubgmobile.com/tournaments/web/pubgm_match/brand-detail?brand_id=14",
  "help": `Hello {name}, please reply with one of the following keywords to get more information:\n\n` +
  `- "FAQ" for the FAQ Document 📄\n` +
  `- "Roadmap" for the Roadmap 🗺️\n` +
  `- "Timeline" for the Timeline 📅\n` +
  `- "Register" for the Registration Link\n\n` +
  `Looking forward to assisting you!`
};

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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      shouldReconnect ? startBot() : console.log("Logged out");
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      if (!message.message || !message.key.remoteJid) continue;
      
      messageStore.set(message.key.id, message);
      const { remoteJid, id: messageId } = message.key;
      const isGroup = remoteJid.endsWith("@g.us");
      const isPrivate = remoteJid.endsWith("@s.whatsapp.net");

      try {
        const text = getMessageText(message);
        if (!text) continue;

        const sender = message.key.participant || remoteJid;
        const name = message.pushName || "User";

        if (isPrivate && text.toLowerCase() in COMMANDS) {
          const responseText = COMMANDS[text.toLowerCase()].replace("{name}", name);
          await sendReply(sock, sender, responseText, message);
          console.log(`${text} replied to ${sender}`);
        }

        if (isGroup && !message.key.fromMe) {
          const groupMetadata = await sock.groupMetadata(remoteJid);
          if (groupMetadata.subject === "Tickets") {
            const responseText = text === "Ticket" 
              ? `Hello ${name}, how can we help you?`
              : `Hello ${name}, Please type 'Ticket' to get help.`;

            const target = text === "Ticket" ? sender : remoteJid;
            await sendReply(sock, target, responseText, message);
            
            if (text === "Ticket") {
              await sock.sendMessage(remoteJid, { react: { text: "👍", key: message.key }});
            }
            console.log(`Ticket response sent to ${target}`);
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    }
  });

  sock.ev.on("messages.reaction", async (reactions) => {
    for (const reaction of reactions) {
      try {
        const flagMap = await getFlagMap();
        const emoji = reaction.reaction.text;
        if (!flagMap.has(emoji)) {
          console.log(`${emoji} is not a recognized flag`);
          continue;
        }

        const originalMessage = messageStore.get(reaction.key.id);
        if (!originalMessage) {
          console.log("Message not found in store");
          continue;
        }

        const text = getMessageText(originalMessage);
        if (!text) {
          console.log("No text content in message");
          return;
        }

        const { code } = flagMap.get(emoji);
        const translated = await translateText(text, code);
        const response = `Translated message (${code}): ${translated}`;

        await sendReply(sock, originalMessage.key.remoteJid, response, originalMessage);
        console.log("Translation sent for message", reaction.key.id);
      } catch (error) {
        console.error("Error processing reaction:", error);
      }
    }
  });
}

function getMessageText(message) {
  return message.message?.conversation || 
         message.message?.extendedTextMessage?.text || 
         message.message?.buttonsResponseMessage?.selectedButtonId;
}

async function sendReply(sock, jid, text, originalMessage) {
  await sock.sendMessage(jid, { 
    text: text,
    mentions: originalMessage.key.fromMe ? undefined : [originalMessage.participant || originalMessage.key.remoteJid]
  }, { 
    quoted: originalMessage 
  });
}

module.exports = startBot;