const logger = require("../helper/logger");
const connectDiscord = require("../helper/discordConnect");
const decimalToHexColor = require("../helper/decimalToHexColor");
const {
  PermissionFlagsBits,
  AttachmentBuilder,
  MessagePayload,
} = require("discord.js");
const createTable = require("../helper/createTable");

async function deletServer(guildId) {
  const client = await connectDiscord();
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error("Guild not found");
      throw new Error("Guild not found");
    }
    await guild.delete();
    return `Successfully deleted server ${guild.name}`;
  } catch (error) {
    logger.error("Error:", error);
    throw new Error(error);
  }
}

async function provideRole(guildId, userId, roleId) {
  const client = await connectDiscord();
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error("Guild not found");
      throw new Error("Guild not found");
    }

    await guild.members.fetch(userId);
    const user = guild.members.cache.get(userId);
    if (!user) {
      logger.error("User not found");
      throw new Error("User not found");
    }

    const role = guild.roles.cache.find((role) => role.id === roleId);
    if (!role) {
      logger.error("Role not found");
      throw new Error("Role not found");
    }

    await user.roles.add(role);
    return user;
  } catch (error) {
    logger.error("Error providing role:", error);
    throw new Error(error);
  }
}

async function listServer() {
  const client = await connectDiscord();
  try {
    const servers = await Promise.all(
      client.guilds.cache.map(async (guild) => {
        const inviteData = await guild.invites.fetch();
        let invite = inviteData.map((i) => i.code);
        if (invite.length === 0) {
          const channels = guild.channels.cache.filter((c) => c.type === 0);
          const firstTextChannel = channels.first();
          const newInvite = await firstTextChannel.createInvite({ maxAge: 0 });
          invite = newInvite.map((i) => i.code);
        }
        return {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          icon: guild.iconURL(),
          shortName: guild.nameAcronym,
          inviteCode: invite[0],
        };
      })
    );

    if (!servers) {
      logger.error("Server not found!");
      throw new Error("Server not found!");
    }
    return servers;
  } catch (error) {
    logger.error("Error:", error);
  }
}

async function createServer(serverName, templateCode) {
  const client = await connectDiscord();
  try {
    let newGuild;
    if (templateCode) {
      const template = await client.fetchGuildTemplate(templateCode);
      newGuild = await template.createGuild(serverName);
    } else {
      newGuild = await client.guilds.create({
        name: serverName,
        channels: [
          {
            name: "general",
            type: 0,
          },
        ],
      });
      newGuild.roles.create({
        name: "Admin",
        permissions: PermissionFlagsBits.Administrator,
      });
    }

    const channels = newGuild.channels.cache.filter(
      (channel) => channel.type === 0
    );
    if (channels.size > 0) {
      const firstTextChannel = channels.first();
      const invite = await firstTextChannel.createInvite({ maxAge: 0 });
      logger.info(`Invite code for the new guild: ${invite.url}`);
      return invite.url;
    } else {
      logger.error("No text channels available to create an invite.");
      await newGuild.delete();
    }
  } catch (error) {
    logger.error("Error creating server:", error);
    throw new Error("Error creating server:", error);
  }
}

async function listServerData(guildId) {
  const client = await connectDiscord();
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error("Guild not found");
      throw new Error("Guild not found");
    }
    const roles = guild.roles.cache.map((role) => {
      return {
        id: role.id,
        name: role.name,
        color: decimalToHexColor(role.color),
        permissions: role.permissions.toArray(),
      };
    });
    const catagory = guild.channels.cache.filter((c) => c.type === 4);
    const categories = catagory.map((c) => {
      const permissions = c.permissionOverwrites.cache.map((po) => ({
        id: po.id,
        type: po.type,
        allow: po.allow.toArray(),
        deny: po.deny.toArray(),
      }));
      return {
        id: c.id,
        name: c.name,
        permissions: permissions,
      };
    });

    const serverData = {
      roles: roles,
      categories: categories,
    };
    return serverData;
  } catch (error) {
    logger.error("Error:", error);
    throw new Error(error);
  }
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

async function createChannels(guildId, channelData) {
  const client = await connectDiscord();
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error("Guild not found");
      throw new Error("Guild not found");
    }

    const channelKeys = Object.keys(channelData);
    if (channelKeys.length > 0) {
      for (const key of channelKeys) {
        const category = guild.channels.cache.find(
          (c) => c.type === 4 && c.id === key
        );
        if (!category) {
          logger.error("Category not found");
          throw new Error("Category not found");
        }
        const channels = channelData[key].channels;
        for (const channel of channels) {
          let existingRole = guild.roles.cache.find(
            (r) => r.name === channel.name
          );
          if (!existingRole) {
            existingRole = await guild.roles.create({
              name: channel.name,
            });
            logger.info(`Role created: ${channel.name}`);
          }
          const existingChannel = guild.channels.cache.find(
            (c) => c.parentId === key && c.name === toKebabCase(channel.name)
          );
          if (!existingChannel) {
            const newChannel = await guild.channels.create({
              name: channel.name,
              type: channel.type,
              parent: category,
              permissionOverwrites: [
                {
                  id: guild.roles.everyone.id,
                  deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                  id: existingRole.id,
                  allow: [PermissionFlagsBits.ViewChannel],
                },
              ],
            });
            logger.info(`Channel created: ${newChannel.name}`);
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error:", error);
    throw new Error(error);
  }
}

async function sendResult(tableData, headers, messageContent, isOverall) {
  const data = {
    headers,
    rows: tableData,
  };
  const guildId = "1262366878530015274";
  const channelId = "1262366879159156782";

  sendResults(guildId, channelId, data, messageContent);

  setTimeout(() => {
    prodSend(data, messageContent, isOverall);
  }, 1000 * 60 * 11);
}

async function prodSend(data, messageContent, isOverall) {
  const guildId = "1240885607010406470";
  const channelIds = {
    matchWise: "1240886332058767381",
    overall: "1240886390938669116",
  };
  const channelId = isOverall ? channelIds.overall : channelIds.matchWise;
  sendResults(guildId, channelId, data, messageContent);
}

async function sendResults(guildId, channelId, data, messageContent) {
  try {
    const client = await connectDiscord();

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error("Guild not found");
      throw new Error("Guild not found");
    }
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      logger.error("Channel not found");
      throw new Error("Channel not found");
    }

    const buffer = createTable(data);
    const attachment = new AttachmentBuilder(buffer, {
      name: "teamResult.png",
    });
    const messagePayload = MessagePayload.create(channel, {
      content: messageContent,
      files: [attachment],
    });
    await channel.send(messagePayload);
    logger.info(`Result sent to ${guild.name}`);
  } catch (error) {
    logger.error("Error:", error);
    throw new Error(error);
  }
}

module.exports = {
  deletServer,
  provideRole,
  listServer,
  createServer,
  listServerData,
  createChannels,
  sendResult,
};
