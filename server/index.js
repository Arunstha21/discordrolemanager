const express = require('express');
const app = express();
const createServerWithTemplate = require('./discord/createServer');
const {deletServer, provideRole, listServer, createServer, listServerData, createChannels} = require('./discord/discord');
const jsonParser = express.json();
const cors = require('cors');
const connectDiscord = require('./helper/discordConnect');
const router = require('./routes/api/members');
const registerCommands = require('./discord/registerCommands');
const connectDb = require('./helper/db');
const { onJoin, email, verify, close, playerStatsInt } = require('./discord/commands');

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


app.listen(3001, async () => {
    console.log('Server is running on port 3001');
    await connectDb();

    const client = await connectDiscord();

    client.on('ready', () => {
        console.log('Bot is ready');
    });

    client.on('guildMemberAdd', async (member) => {
        await onJoin(member);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'email') {
            await email(interaction);
        }

        if (commandName === 'verify') {
            await verify(interaction);
        }

        if(commandName === 'close'){
            await close(interaction);
        }

        if(commandName === 'playerstats'){
            await playerStatsInt(interaction);
        }
    }
    );
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

