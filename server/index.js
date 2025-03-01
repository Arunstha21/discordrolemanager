const express = require('express');
const app = express();
const createServerWithTemplate = require('./discord/createServer');
const {deletServer, provideRole, listServer, createServer, listServerData, createChannels, sendResult} = require('./discord/discord');
const jsonParser = express.json();
const cors = require('cors');
const router = require('./routes/api/members');
const csaRouter = require('./routes/api/csa');
const pmncRouter = require('./routes/api/pmnc');
const {registerCommands, deleteCommand} = require('./discord/registerCommands');
const connectDb = require('./helper/db');
const { onJoin, email, verify, close, playerStatsInt, gunslingerStats, grenadeMasterStats, pmgoFind, listCommands, registerCommand, claimGroupRole, matchLogger } = require('./discord/commands');
const { Client, GatewayIntentBits, EmbedBuilder, messageLink } = require("discord.js");
const fs = require('fs'); // Ensure fs module is imported
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILDMEMBER'],
});
const logger = require("./helper/logger");
const { translateText, getFlagMap } = require('./discord/translate');
require("dotenv").config();
const startBot = require('./whatsapp/main');
const token = process.env.DISCORD_TOKEN;

app.use(jsonParser);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



app.post('/api/createServerWithTemplate', async (req, res) => {
    const { name, templateCode, roles } = req.body;
    const inviteLink = await createServerWithTemplate(client, name, templateCode, roles);
    res.json({ inviteLink });
});

app.post('/api/provideRole', async (req, res) => {
    const { guildId, userId, roleId } = req.body;
    const role = await provideRole(client, guildId, userId, roleId);
    res.json({ role });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/serverList', async (req, res) => {
    const server = await listServer(client);
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
        const inviteLink = await createServer(client, serverName, templateCode);
        res.status(200).json({ inviteLink });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.get('/api/serverData/:guildId', async (req, res) => {
    const guildId = req.params.guildId
    const roles = await listServerData(client, guildId);
    res.status(200).json(roles);
});

app.post('/api/createChannels', async (req, res) => {
    const { guildId, channels } = req.body;
    const channel = await createChannels(client, guildId, channels);
    res.json({ channel });
});

app.use('/api/members', router);
app.use('/api/csa', csaRouter);
app.use('/api/pmnc', pmncRouter);


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
    `- "Calendar" for the Calendar\n` +
    `- "Register" for the Registration Link\n\n` +
    `Looking forward to assisting you!`
  };

app.listen(3001, async () => {
    console.log('Server is running on port 3001');
    await connectDb();
    const flagMap = await getFlagMap();
    const BridgeCategoryId = "1334811119906328647"
    const TicketCategoryId = "1326058681426645084"
    const slashCommandChannel = "1341067978879406181"

    try {
        
        client.on("ready", () => {
            // startBot(client);
            console.log("Bot is ready!!");
        });

        client.on("guildMemberAdd", async (member) => {
            if(member.guild.id != "1344495827086872681") return;
            await onJoin(member);
        });

        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isCommand()) return;
            if(interaction.channel.parentId === TicketCategoryId){
                if(interaction.commandName === 'find') await pmgoFind(interaction);
            }

            if(interaction.channelId === slashCommandChannel){
                if(interaction.commandName === 'roleclaim') await claimGroupRole(interaction);
            }

            const commands = {
                email: email,
                verify: verify,
                close: close,
                matchlog : matchLogger,
                playerstats: playerStatsInt,
                gunslingers: gunslingerStats,
                grenademaster: grenadeMasterStats,
                registercommand: registerCommand,
                listcommands: listCommands,
            };

            const { commandName } = interaction;
            const commandFunction = commands[commandName];
            if (commandFunction) {
                await commandFunction(interaction);
            }
        });

        client.on("messageReactionAdd", async (reaction, user) => {
            try {
                if(reaction.message.channel.parentId === BridgeCategoryId) return;
                if (flagMap.has(reaction.emoji.name)) {
                    const flag = flagMap.get(reaction.emoji.name);
                    const message = reaction.message.content;
                    const messageUser = reaction.message.author;
                    const {translation, detectedLanguage} = await translateText(message, flag.code);
                    console.log(translation);
                    
                    let embed = new EmbedBuilder()
                        .setColor(0x3498db)
                        .setDescription(translation);
    
                    if (messageUser.id === user.id) {
                        embed.setAuthor({
                            name: `${messageUser.username}`,
                            iconURL: messageUser.displayAvatarURL(),
                        }).setFooter({
                            text: `Detected Language: ${detectedLanguage[0].language}`,
                        });
                    } else {
                        embed.setAuthor({
                            name: `${messageUser.username}`,
                            iconURL: messageUser.displayAvatarURL(),
                        }).setFooter({
                            text: `Requested by ${user.username}\n Detected Language: ${detectedLanguage[0].language}`,
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

        client.on("channelCreate", async (channel) => {
            if(channel.parentId === TicketCategoryId){
                try{
                    setTimeout(async () => {
                    await channel.send("Hello, Do you have any question regarding PMGO ? Please ask here. Our support team will help you shortly.");
                    }, 1500);
                } catch (error) {
                    console.log("Error sending message to new channel:" + channel.name, error);
                }
            }
        });

        client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if(message.content === "GAC Credentials"){
                await sendGACData(message);
            } 
          });

        await client.login(token);
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
app.post('/api/deleteCommands', async (req, res) => {
    const {guildId, commandId} = req.body;
    try {
        deleteCommand(commandId, guildId);
        res.status(200).json({message: 'Command deleted successfully'});
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
const { Commands } = require('./module/whatsapp');
const { sendGACData } = require('./discord/gacCreds');

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