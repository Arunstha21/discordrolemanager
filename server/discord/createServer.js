const {PermissionsBitField} = require("discord.js");
const logger = require("../helper/logger");

const connectDiscord = require("../helper/discordConnect");
const client = connectDiscord();

async function createServerWithTemplate(serverName, templateCode, channelAndRoleData) {
    try {
        const template = await client.fetchGuildTemplate(templateCode);

        if (!template) {
            throw new Error("Template not found");
        }
        const newGuild = await template.createGuild(serverName);

        channelAndRoleData.forEach(async (name) => {
            await newGuild.roles.create({
                name: name,
            });
        });

        channelAndRoleData.forEach(async (name) => {
            const existingRole = newGuild.roles.cache.find(r => r.name === name);
            if(!existingRole){
                await newGuild.roles.create({
                    name: name,
                });
                logger.info(`${name} role created`);
            }
            logger.error(`${name} role already exists`);
        });

        let catagory = newGuild.channels.cache.find(c => c.type === 4 && c.name === 'Team Chat Channels');
        if(!catagory){
            catagory = await newGuild.channels.create({
                name: 'Team Chat Channels',
                type: 4,
                permissionOverwrites: [
                    {
                        id: newGuild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });
            logger.info("Category created");
        }

        channelAndRoleData.forEach(async (name) => {
            const role = newGuild.roles.cache.find(r => r.name === name);
            if(!role){
                logger.error("Role not found");
            }
            await newGuild.channels.create({
                name: name,
                type: 0,
                parent: catagory,
                permissionOverwrites: [
                    {
                        id: newGuild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: role.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });
            logger.info(`${name} channel created`);
        });

        const channels = newGuild.channels.cache.filter(channel => channel.type === 0);
        if (channels.size > 0) {
          const firstTextChannel = channels.first();
          const invite = await firstTextChannel.createInvite({ maxAge: 0 });
          logger.info(`Invite code for the new guild: ${invite.url}`);
        } else {
          logger.error('No text channels available to create an invite.');
          await newGuild.delete();
        }

    } catch (error) {
        logger.error("Error creating server:", error);
    }
}

module.exports = createServerWithTemplate;