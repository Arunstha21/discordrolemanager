const express = require('express');
const app = express();
const createServerWithTemplate = require('./discord/createServer');
const {deletServer, provideRole, listServer, createServer, listServerData, createChannels, sendResult} = require('./discord/discord');
const jsonParser = express.json();
const cors = require('cors');
const router = require('./routes/api/members');
const csaRouter = require('./routes/api/csa');
const pmncRouter = require('./routes/api/pmnc');
const registerCommands = require('./discord/registerCommands');
const connectDb = require('./helper/db');
const { onJoin, email, verify, close, playerStatsInt, gunslingerStats, grenadeMasterStats } = require('./discord/commands');
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require('fs'); // Ensure fs module is imported
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const logger = require("./helper/logger");
const { translateText, getFlagMap } = require('./discord/translate');
require("dotenv").config();
const venom = require('venom-bot');

const Token = process.env.DISCORD_TOKEN;

app.use(jsonParser);
app.use(cors());


app.post('/api/createServerWithTemplate', async (req, res) => {
    const { name, templateCode, roles } = req.body;
    const inviteLink = await createServerWithTemplate(name, templateCode, roles);
    res.json({ inviteLink });
});

app.post('/api/provideRole', async (req, res) => {
    const { guildId, userId, roleId } = req.body;
    const role = await provideRole(guildId, userId, roleId);
    res.json({ role });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/serverList', async (req, res) => {
    const server = await listServer();
    res.status(200).json(server);
});

app.delete('/api/server/:id', async (req, res) => {
    const guildId = req.params.id;
    console.log(guildId);
    const server = await deletServer(guildId);
    if (!server) {
        res.status(404).json({ message: 'Server not found' });
    }
    res.status(200).json({message: server});
})

app.post('/api/createServer', async (req, res) => {
    const { serverName, templateCode } = req.body;
    try {
        const inviteLink = await createServer(serverName, templateCode);
        res.status(200).json({ inviteLink });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.get('/api/serverData/:guildId', async (req, res) => {
    const guildId = req.params.guildId
    const roles = await listServerData(guildId);
    res.status(200).json(roles);
});

app.post('/api/createChannels', async (req, res) => {
    const { guildId, channels } = req.body;
    const channel = await createChannels(guildId, channels);
    res.json({ channel });
});

app.use('/api/members', router);
app.use('/api/csa', csaRouter);
app.use('/api/pmnc', pmncRouter);

app.listen(3001, async () => {
    console.log('Server is running on port 3001');
    await connectDb();

    const flagMap = await getFlagMap();
    venom.create({
        session: 'whatsapp-bot',
        multidevice: true,
        headless: 'new',
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      }).then((client) => startBot(client)).catch((err) => console.log(err));
      
    try {
        
        client.on("ready", () => {
            console.log("Bot is ready!!");
        });

        client.on("guildMemberAdd", async (member) => {
            await onJoin(member);
        });

        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;

            const commands = {
                email: email,
                verify: verify,
                close: close,
                playerstats: playerStatsInt,
                gunslingers: gunslingerStats,
                grenademaster: grenadeMasterStats
            };

            const { commandName } = interaction;
            const commandFunction = commands[commandName];
            if (commandFunction) {
                await commandFunction(interaction);
            }
        });

        client.on("messageReactionAdd", async (reaction, user) => {
            try {
                if (flagMap.has(reaction.emoji.name)) {
                    const flag = flagMap.get(reaction.emoji.name);
                    const message = reaction.message.content;
                    const messageUser = reaction.message.author;
                    const translate = await translateText(message, flag.code);
                    let embed = new EmbedBuilder()
                        .setColor(0x3498db)
                        .setDescription(translate);
    
                    if (messageUser.id === user.id) {
                        embed.setAuthor({
                            name: `${messageUser.username}`,
                            iconURL: messageUser.displayAvatarURL(),
                        });
                    } else {
                        embed.setAuthor({
                            name: `${messageUser.username}`,
                            iconURL: messageUser.displayAvatarURL(),
                        }).setFooter({
                            text: `Requested by ${user.username}`,
                        });
                    }
                    reaction.message.channel.send({ embeds: [embed] });
                }else {
                    console.log(`${reaction.emoji.name} Emoji is not flag`);
                }
            } catch (error) {
                logger.error("Error translating message:", error);
                console.log("Error translating message:", error);
            }
        });

        await client.login(Token);
    } catch (error) {
        logger.error("Failed to initialize Discord client", error);
    }
})

app.post('/api/registerCommands', async (req, res) => {
    const {guildId} = req.body;
    try {
        registerCommands(guildId);
        res.status(200).json({message: 'Commands registered successfully'});
    } catch (error) {
        res.status(500).json({error: error.message});
        
    }
})

app.post('/api/sendResult', async (req, res) => {
    const { tableData, headers, message, isOverall } = req.body;
    if (tableData.length === 0) {
        res.status(400).json({ error: 'No data to send' });
        return;
    }
    
    try {
        await sendResult(tableData, headers, message, isOverall);
        res.status(200).json({ message: 'Result sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
)

const roleManagerActiveStatus = require("./discord/roleManager.json");
const startBot = require('./whatsapp/main');

app.post('/api/activateRoleManager', (req, res) => {
    const { activate } = req.body;
    if (activate === undefined) {
        return res.status(400).json({ message: "Please provide activate status" });
    }
    const messages = {
        true: "Role Manager is active",
        false: "Role Manager is inactive",
    };
    if (activate === roleManagerActiveStatus.active) {
        return res.status(200).json({ message: messages[activate] });
    }

    roleManagerActiveStatus.active = activate;
    fs.writeFile('./discord/roleManager.json', JSON.stringify(roleManagerActiveStatus, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: "Failed to activate Role Manager" });
        }
        return res.status(200).json({ message: messages[activate] });
    });
});