const {REST, Routes, ApplicationCommandOptionType} = require('discord.js');
const logger = require('../helper/logger');
const env = require('dotenv').config();

const commands = [

    // {
    //     name: 'email',
    //     description: 'Takes an email input and sends a verification code to that email',
    //     options: [
    //         {
    //             name: 'email',
    //             description: 'Email to send the verification code',
    //             required: true,
    //             type: ApplicationCommandOptionType.String,
    //         },
    //     ],
    // },
    // {
    //     name: 'verify',
    //     description: 'Takes an otp input and verifies the user',
    //     options: [
    //         {
    //             name: 'otp',
    //             description: 'OTP sent to the email',
    //             required: true,
    //             type: ApplicationCommandOptionType.Number,
    //         },
    //     ],
    // },
    {
        name: 'close',
        description: 'Closes the ticket channel and deletes it, by the admins',
    },
    {
        name: 'playerstats',
        description: 'Get the stats of the players',
        options: [
            {
                name: 'stage',
                description: 'Select stage to get the stage stats',
                choices: [
                    {
                        name: 'League Stage - Week 1',
                        value: '66c41f2833aa084df2231abe',
                    },
                    {
                        name: 'League Stage - Week 2',
                        value: '66ced75b9591ba738879ba2d',
                    },
                    {
                        name: 'League Stage - Week 3',
                        value: '66d81dbb8eeb95973d9a4fe3',
                    },
                    {
                        name: 'Finals',
                        value: '66e2a4b92892e28f32a1a32f',
                    }
                ],
                type: ApplicationCommandOptionType.String,

            }
        ],
    },
    {
        name: 'gunslingers',
        description: 'Get the top 5 gunslingers',
    },
    {
        name: 'grenademaster',
        description: 'Get the top 5 Grenade Master',
    }
];

const rest = new REST({ version: '10' }).setToken(env.parsed.DISCORD_TOKEN);

function registerCommands(guildId) {
    try {
        rest.put(
            Routes.applicationGuildCommands(env.parsed.CLIENT_ID, guildId),
            { body: commands },
        );
        logger.info('Successfully registered application commands');
    } catch (error) {
        logger.error('Failed to register application commands:', error);
        throw error;
    }
}

module.exports = registerCommands;