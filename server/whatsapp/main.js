const { getFlagMap, translateText } = require("../discord/translate");
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const connectDB = require("../helper/db");
const { WALastInteraction, WAMessage } = require("../module/whatsapp");

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;
const HELP_EXPIRATION_MS = 8 * 60 * 60 * 1000;

async function withRetry(fn, context = '', retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${context}:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
    }
}

function logError(context, error, metadata = {}) {
    console.error(`[${new Date().toISOString()}] Error in ${context}:`, {
        error: error.message,
        stack: error.stack,
        ...metadata
    });
}

const COMMANDS = {
  "faq": "Hello {name}, below is the list of FAQ's: https://docs.google.com/document/d/1mMHGkiFFlG3lH-I4qg86cxSOOB35tCmicU35lleY7T0/edit?tab=t.0",
//   "How to register": "Hello {name}, below is the steps to register:",
  "roadmap": "Hello {name}, below is the roadmap: https://www.youtube.com/watch?v=kG9O9RM9Qrc",
  "timeline": "Hello {name}, below is the timeline: https://www.instagram.com/p/DEziKMpyroE/",
  "register": "Hello {name}, below is the registration link: https://esports.pubgmobile.com/tournaments/web/pubgm_match/brand-detail?brand_id=14",
  "calendar": "Hello {name}, below is the calendar: https://www.instagram.com/p/DFCxNRUyvnr",
  "help": `Hello {name}, please reply with one of the following keywords to get more information:\n\n` +
  `- "FAQ" for the FAQ Document 📄\n` +
  `- "Roadmap" for the Roadmap 🗺️\n` +
  `- "Timeline" for the Timeline 📅\n` +
  `- "Register" for the Registration Link\n\n` +
  `Looking forward to assisting you!`
};

setInterval(async () => {
    try {
        await withRetry(
            async () => {
                const result = await WAMessage.deleteMany({ 
                    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
                });
                console.log(`Cleaned up ${result.deletedCount} old messages`);
            },
            "messageCleanup"
        );
    } catch (error) {
        logError("messageCleanupInterval", error);
    }
}, 8 * 60 * 60 * 1000);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });
  await connectDB();

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
  
      const { remoteJid } = message.key;
      const isPrivate = remoteJid.endsWith("@s.whatsapp.net");
        
      try {
        const text = getMessageText(message);
        if (!text || !isPrivate) continue; // Only handle DMs
        await setMessage(message.key.id, message);
        const sender = message.key.participant || remoteJid;
        const name = message.pushName || "User";
        const command = text.toLowerCase().trim();
  
        // Capture interaction time BEFORE processing
        const currentTime = Date.now();
        const previousInteractionTime = await getLastInteraction(sender) || 0;
        await setLastInteraction(sender, currentTime); // Update timestamp
  
        if (command in COMMANDS) {
          // Handle valid command
          const responseText = COMMANDS[command].replace("{name}", name);
          await sendReply(sock, sender, responseText, message);
          console.log(`Replied to ${sender} with: ${command}`);
        } else {
          // Check if user hasn't interacted within expiration period
          if (currentTime - previousInteractionTime > HELP_EXPIRATION_MS) {
            const helpText = COMMANDS.help.replace("{name}", name)+ "\n"+ "This is an automated message.";
            await sendReply(sock, sender, helpText, message);
            console.log(`Sent help to ${sender}`);
          } else {
            console.log(`Ignored message from ${sender} (recent interaction)`);
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

        const originalMessage = await getMessage(reaction.key.id);
        if (!originalMessage) {
          console.log("Message not found in store");
          continue;
        }
        const isGroup = originalMessage.key.remoteJid.endsWith("@g.us");
        if (isGroup) {
        console.log("Ignoring reaction in group");
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
  const message = await sock.sendMessage(jid, { 
    text: text,
    mentions: originalMessage.key.fromMe ? undefined : [originalMessage.participant || originalMessage.key.remoteJid]
  }, { 
    quoted: originalMessage 
  });
    if (message.key.id) {
        await setMessage(message.key.id, message);
    }
}

async function setMessage(messageId, message) {
    return await withRetry(
        () => WAMessage.findOneAndUpdate(
            { messageId },
            { message },
            { upsert: true, new: true }
        ),
        "setMessage"
    ).catch(error => {
        logError("setMessage", error, { messageId });
        throw error;
    });
}

async function setLastInteraction(sender, lastInteractionTime) {
    return await withRetry(
        () => WALastInteraction.findOneAndUpdate(
            { sender },
            { lastInteractionTime: new Date(lastInteractionTime) },
            { upsert: true, new: true }
        ),
        "setLastInteraction"
    ).catch(error => {
        logError("setLastInteraction", error, { sender });
        throw error;
    });
}

async function getLastInteraction(sender){
    const interaction = await WALastInteraction.findOne({sender});
    return interaction?.lastInteractionTime?.getTime() || 0;
}

async function getMessage(messageId){
    const message = await WAMessage.findOne({messageId});
    return message.message;
}

module.exports = startBot;