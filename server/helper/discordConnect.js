const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const logger = require("./logger");
require("dotenv").config();

const Token = process.env.DISCORD_TOKEN;
let isReady = false;

if (!Token) {
    logger.error('DISCORD_TOKEN environment variable not set');
    process.exit(1);
}

client.once('ready', () => {
    isReady = true;
    console.log('Bot connected and ready (inside discordConnect.js)');
});

async function connectDiscord() {
    if (client.isReady() || isReady) {
        logger.info("Client already connected");
        return client;
    }
    try {
        await client.login(Token);
        logger.info("Connected to Discord");
        return client;
    } catch (error) {
        logger.error("Failed to connect to Discord", error);
        throw error;
    }
}

module.exports = connectDiscord;
