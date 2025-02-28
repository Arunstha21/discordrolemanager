const { gacData, teamData, guildData } = require("../module/user");

async function sendGACData(message) {
    try {
        const teamName = message.channel.name.replaceAll('-', ' ');
        const team = await teamData.findOne(
            { teamName: { $regex: new RegExp('^' + teamName.toLowerCase() + '$', 'i') } }
        );

        if (!team) {
            console.log(`Team ${teamName} not found.`);
            return;
        }

        const gacCreds = await gacData.find({ team: team._id });

        if (!gacCreds.length) {
            console.log(`No GAC credentials found for team ${teamName}.`);
            return;
        }

        const data = gacCreds.map(creds => {
            return `${creds.uid} - ${creds.userName} - ${creds.password}`;
        }).join('\n') || 'No credentials found';

        const GACMessage = `GAC Credentials for ${teamName}:\n\n**UID - UserName - Password**\n${data}`;

        if (!message.channel) {
            console.error("Message channel not found.");
            return;
        }

        await message.channel.send(GACMessage);
        console.log("GAC Data sent successfully of team:", teamName);
    } catch (error) {
        console.error("Error sending GAC Data:", error);
    }
}

async function importGacData(data) {
    for (const row of data) {
        try {
            const { team, guild } = await findTeamAndGuild(row.teamName, row.guildId);
            if (!team || !guild) {
                console.log(`Skipping ${row.userName} - Missing team or guild`);
                continue;
            }

            const gacCredsExists = await gacData.findOne({ userName: row.userName });
            if (gacCredsExists) {
                console.log(`Skipping ${row.userName} - Credentials already exist`);
                continue;
            }

            const gacCreds = new gacData({
                team: team._id,
                guild: guild._id,
                userName: row.userName,
                password: row.password,
                inGameName: row.inGameName,
                uid: row.uid
            });

            await gacCreds.save();
            console.log(`Successfully saved data for ${row.userName}`);

        } catch (error) {
            console.error(`Error processing data for ${row.userName}:`, error);
        }
    }
}

async function findTeamAndGuild(teamName, guildId) {
    const team = await teamData.findOne({ teamName });
    const guild = await guildData.findOne({ guildId });
    return { team, guild };
}

module.exports = {sendGACData, importGacData};