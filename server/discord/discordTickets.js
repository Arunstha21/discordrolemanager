const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const logger = require("../helper/logger");
let count = 0;
async function tickets(member){
    const category = member.guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase() === 'tickets');
        if(category){
            ticketCreator(member, category);
        }else{
            logger.info("There is no Ticket Category, creating Ticket Category");
            const category = await member.guild.channels.create({
                name: 'Tickets',
                type: 4,
                permissionOverwrites: [
                    {
                        id: member.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    }
                ],
                reason: 'Creating a Ticket channel as Ticket channel is missing'
            })
            logger.info("Ticket Category Created, now creating channel");
            ticketCreator(member, category);
        }
}

async function ticketCreator(member, category){
        // Create a new ticket channel
        const channel = await member.guild.channels.create({
            name: `ticket-${count++}`,
            type: 0,
            parent: category,
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions]
                }
            ],
            reason: 'Creating a Ticket channel for the user'
        });
        logger.info("Ticket Channel Created");

        const embed = new EmbedBuilder()
            .setTitle('Verification Under Process')
            .setDescription(`${member}, we couldn't find you in the list of registered users. Enter your email address used during registration after the command \`/email\``)
            .setColor('#800080')
            .addFields({name: 'Example',value: '```\n/email example@abc.com\n```', inline: false});
        await channel.send({ embeds: [embed] });
}

module.exports = {
    tickets
}