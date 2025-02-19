const {REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits} = require('discord.js');
const logger = require('../helper/logger');
const { options } = require('../routes/api/members');
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
    // {
    //     name: 'close',
    //     description: 'Closes the ticket channel and deletes it, by the admins',
    // },
    // {
    //     name: 'playerstats',
    //     description: 'Get the stats of the players',
    //     options: [
    //         {
    //             name: 'stage',
    //             description: 'Select stage to get the stage stats',
    //             choices: [
    //                 {
    //                     name: 'League Stage - Week 1',
    //                     value: '66c41f2833aa084df2231abe',
    //                 },
    //                 {
    //                     name: 'League Stage - Week 2',
    //                     value: '66ced75b9591ba738879ba2d',
    //                 },
    //                 {
    //                     name: 'League Stage - Week 3',
    //                     value: '66d81dbb8eeb95973d9a4fe3',
    //                 },
    //                 {
    //                     name: 'Finals',
    //                     value: '66e2a4b92892e28f32a1a32f',
    //                 }
    //             ],
    //             type: ApplicationCommandOptionType.String,

    //         }
    //     ],
    // },
    // {
    //     name: 'gunslingers',
    //     description: 'Get the top 5 gunslingers',
    // },
    // {
    //     name: 'grenademaster',
    //     description: 'Get the top 5 Grenade Master',
    // },
    // {
    //     name: 'find',
    //     description: 'Find team members',
    //     options:[{
    //         name: 'region',
    //         description: 'Select the region',
    //         required: true,
    //         choices:[{
    //             name: 'Asia',
    //             value: '1337386661855629323'
    //         },
    //         {
    //             name: 'Europe',
    //             value: '1337386799709945866'
    //         },
    //         {
    //             name: 'North America',
    //             value: '1337386876549599283'
    //         },
    //         {
    //             name: 'South America',
    //             value: '1337386906052460574'
    //         },
    //         {
    //             name: 'Middle East',
    //             value: '1337386747104989184'
    //         }],
    //         type: ApplicationCommandOptionType.String,
    //     },{
    //         name: 'team_code',
    //         description: 'Enter the team code',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     },{
    //         name: 'invite_link',
    //         description: 'Enter the invite link',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     },{
    //         name: 'players_needed',
    //         description: 'Enter the number of players needed',
    //         required: true,
    //         type: ApplicationCommandOptionType.Integer,
    //     },{
    //         name: 'preferred_language',
    //         description: 'Enter the preferred language',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     },{
    //         name: 'contact',
    //         description: 'Enter the contact details',
    //         required: true,
    //         type: ApplicationCommandOptionType.User,
    //     }]
    // },
    // {
    //     name: 'registercommand',
    //     description: 'Register the command',
    //     default_member_permissions: 8,
    //     options:[{
    //         name: 'command_name',
    //         description: 'Enter the command name',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     },
    //     {
    //         name: 'command_value',
    //         description: 'Enter the command value',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     }]
    // },
    // {
    //     name: 'listcommands',
    //     default_member_permissions: 8,
    //     description: 'List all the commands',
    // },
    // {
    //     name: 'deletecommand',
    //     default_member_permissions: 8,
    //     description: 'Delete the command',
    //     options:[{
    //         name: 'command_name',
    //         description: 'Enter the command name',
    //         required: true,
    //         type: ApplicationCommandOptionType.String,
    //     }]
    // },
    {
        name: 'claim',
        description: 'Claim the group role',
        options:[{
            name: 'invite_link',
            description: 'Enter the invite link',
            required: true,
            type: ApplicationCommandOptionType.String,
        },{
            name: 'team_name',
            description: 'Enter the team name',
            required: true,
            type: ApplicationCommandOptionType.String,
        }]
    }
];

const rest = new REST({ version: '10' }).setToken(env.parsed.DISCORD_TOKEN);

function registerCommands(guildId) {
    try {
        rest.put(
            Routes.applicationGuildCommands(env.parsed.CLIENT_ID, guildId),
            { body: commands },
        );
        console.log(guildId);
        
        logger.info('Successfully registered application commands');
    } catch (error) {
        logger.error('Failed to register application commands:', error);
        throw error;
    }
}

function deleteCommand(commandId, guildId){
    try {
        rest.delete(
            Routes.applicationGuildCommand(env.parsed.CLIENT_ID, guildId, commandId),
        );
        logger.info('Successfully deleted application command');
    } catch (error) {
        logger.error('Failed to delete application command:', error);
        throw error;
    }
}

module.exports = {registerCommands, deleteCommand};