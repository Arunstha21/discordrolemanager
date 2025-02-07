const { userData, guildData, teamData, adminData } = require("../module/user");
const { EmbedBuilder, AttachmentBuilder, DiscordAPIError, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const logger = require("../helper/logger");
const { tickets } = require("./discordTickets");
const sendEmail = require("../helper/email");
const {playerStats, gunslingers, grenadeMaster} = require("../helper/results");
const createTable = require("../helper/createTable");
const activeStatus = require("./roleManager.json")

async function email(interaction) {
  const email = interaction.options.getString("email");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await interaction.reply("Invalid email address");
    return;
  }
  let MessageEmbed;
  const users = await userData.find({ emailId: email })
  .populate({
    path: "guild",
    options: { strictPopulate: false },
        
    });

  const correctUser = users.find(user => user.guild.guildId == interaction.guildId);
  if (!correctUser) {
    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Failed")
      .setDescription(
        "Invalid E-Mail address provided or you have joined the wrong server. Please contact the Admin for further assistance."
      )
      .setColor("#FF0000");
  
  } else {
    if (correctUser.emailSent >= 3) {
        MessageEmbed = new EmbedBuilder()
          .setTitle("Verification Failed")
          .setDescription(
            "You have exceeded the maximum number of attempts. Please contact the Admin for further assistance."
          )
          .setColor("#FF0000");
    
        logger.info(`${correctUser.emailId} Exceeded maximum number of attempts`);
        await interaction.reply({ embeds: [MessageEmbed] });
        return;
      }
    if (correctUser.serverJoined === true) {
      MessageEmbed = new EmbedBuilder()
        .setTitle("Verification Failed")
        .setDescription("This Email has already been verified. Please use your registered email.")
        .setColor("#FF0000");
      await interaction.reply({ embeds: [MessageEmbed] });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    correctUser.otp = otp;
    correctUser.emailSent += 1;
    correctUser.sender = interaction.user.username;
    await correctUser.save();
    await sendEmail(email, otp);

    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Under Process")
      .setDescription(
        `An OTP has been sent to your ${email}. Enter the OTP using the command /verify or resend OTP using /email\n`
      )
      .addFields({
        name: "To submit OTP",
        value: "```/verify 123456```",
        inline: false,
      })
      .addFields({
        name: "To resend OTP",
        value: "```/email example@abc.com```",
        inline: false,
      })
      .setColor("#BF40BF");
  }

  await interaction.reply({ embeds: [MessageEmbed] });
}

async function verify(interaction) {
  const otp = interaction.options.getNumber("otp");
  const user = await userData.findOne({sender: interaction.user.username});
  if (!user) {
    const messageEmbed = new EmbedBuilder()
      .setTitle("Verification Failed")
      .setDescription(
        "No OTP has been sent to you. Please use the command /email to get the OTP."
      )
      .setColor("#FF0000");
  
    await interaction.reply({ embeds: [messageEmbed] });
    return;
  }
  let MessageEmbed;
  if (otp !== user.otp) {
    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Failed")
      .setDescription("Invalid OTP provided. Please try again.")
      .setColor("#FF0000");
  } else {
    const roles = user.role;
    for (const role of roles) {
      const serverRole = interaction.guild.roles.cache.find(
        (r) => r.name === role
      );
      if (serverRole) {
        try {
          await interaction.member.roles.add(serverRole);
          logger.info(
            `Role ${role} added to ${interaction.member.user.username}`
          );
        } catch (error) {
          logger.error(
            `Failed to add role ${role} to ${interaction.member.user.username}:`,
            error
          );
        }
      } else {
        logger.info(`Role ${role} not found in the guild`);
      }
    }
    const team = await teamData.findById(user.teamId);
    interaction.member.setNickname(
      team.teamTag + " | " + interaction.member.user.globalName
    );

    user.discordTag = interaction.user.tag;
    user.serverJoined = true;
    user.otp = null;
    await user.save();

    logger.info(`User ${user.discordTag} verified successfully`);
    MessageEmbed = new EmbedBuilder()
      .setTitle("Verification Successful")
      .setDescription("You have been successfully verified.")
      .setColor("#00FF00");

    interaction.channel.delete();
  }
  await interaction.reply({ embeds: [MessageEmbed] });
}

async function onJoin(member) {
  if(activeStatus.active === false){
    return;
  }
  logger.info(`New member joined: ${member.user.username}`);
  const guildCheck = await checkGuild(member);
  const userAuthorized = await checkUser(member);
  if (!userAuthorized || guildCheck.guildId !== member.guild.id) {
    tickets(member);
    return;                                                                                                                               
  }
  const roles = userAuthorized.role;
  for (const role of roles) {
    const serverRole = member.guild.roles.cache.find((r) => r.name === role);
    if (serverRole) {
      try {
        await member.roles.add(serverRole);
        logger.info(`Role ${role} added to ${member.user.username}`);
      } catch (error) {
        logger.error(
          `Failed to add role ${role} to ${member.user.username}:`,
          error
        );
      }
    } else {
      logger.info(`Role ${role} not found in the guild`);
    }
  }
  userAuthorized.serverJoined = true;
    await userAuthorized.save();
  const team = await teamData.findById(userAuthorized.teamId);
  if (team && team.teamTag) {
    member.setNickname(team.teamTag + " | " + member.user.globalName);
  }
}

async function checkGuild(member) {
  const guild = await member.guild.fetch();
  const guildId = guild.id;
  const guildDB = await guildData.findOne({ guildId });
  if (!guildDB) {
    return false;
  }
  return guildDB;
}

async function checkUser(member) {
  const { username, id, globalName } = member.user;
  const userRecord = await userData.findOne({
    $or: [
      { discordTag: username },
      { discordTag: id },
      { discordTag: globalName },
    ],
  });
  if (!userRecord) {
    return false;
  }
  return userRecord;
}

async function close(interaction){
    const {username, id, globalName} = interaction.user;
    const admin = await adminData.findOne({ $or: [
        { discordTag: username },
        { discordTag: id },
        { discordTag: globalName },
      ], });
    if(!admin){
        await interaction.reply("You are not authorized to close the ticket");
        return;
    }
    const ticketCategory = interaction.guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase() === 'tickets')
    if(ticketCategory.id !== interaction.channel.parent.id){
        await interaction.reply("This is not a ticket channel, You can't delete this channel");
        return;
    }
    await interaction.channel.delete();
    logger.info(`Ticket channel closed by ${interaction.user.username}`);

} 

async function playerStatsInt(interaction) {
  const stage = interaction.options.getString("stage");
  let playerData;

  try {
      await interaction.deferReply();

      if (!stage) {
          playerData = await playerStats();
      } else {
          playerData = await playerStats(stage);
      }

      const teamName = interaction.channel.name.replaceAll('-', ' ');
      const teamPlayerStats = playerData?.playerResult?.filter((player) => player.teamName.toLowerCase() === teamName);

      if (teamPlayerStats.length === 0) {
          await interaction.editReply("No player stats found");
          return;
      }

      const statsData = teamPlayerStats.map(row => [
          row.inGameName,
          row.kill,
          row.damage,
          row.matchPlayed,
          row.survivalTime,
          row.heal,
          row.headshot,
      ]);

      const data = {
          headers: ["Player Name", "Elims", "Dmg", "MP", "Surv.T", "Heal", "Head.S"],
          rows: statsData
      };

      const buffer = createTable(data, playerData.title);
      const attachment = new AttachmentBuilder(buffer, { name: 'stats.png' });

      await interaction.editReply({ files: [attachment] });
  } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
          await interaction.editReply("An error occurred while fetching player stats.");
      } else {
          await interaction.reply("An error occurred while fetching player stats.");
      }
  }
}

async function gunslingerStats(interaction) {
  try {
      await interaction.deferReply();
      const playerData = await gunslingers();

      const statsData = playerData.map(row => [
          row.inGameName,
          row.kill,
          row.damage,
          row.matchPlayed,
          row.headshot,
          row.slingerNumber
      ]);

      const data = {
          headers: ["Player Name", "Elims", "Dmg", "MP", "Head.S", "GS"],
          rows: statsData
      };

      const buffer = createTable(data, playerData.title);
      const attachment = new AttachmentBuilder(buffer, { name: 'gunslinger.png' });

      await interaction.editReply({ files: [attachment] });
  } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
          await interaction.editReply("An error occurred while fetching gunslinger stats.");
      } else {
          await interaction.reply("An error occurred while fetching gunslinger stats.");
      }
  }
}

async function grenadeMasterStats(interaction) {
  try {
      await interaction.deferReply();
      const playerData = await grenadeMaster();

      const statsData = playerData.map(row => [
          row.inGameName,
          row.kill,
          row.grenadeKill,
          row.matchPlayed,
          row.knockout,
      ]);

      const data = {
          headers: ["Player Name", "Elims", "Grenade.E", "MP", "knockout"],
          rows: statsData
      };

      const buffer = createTable(data, playerData.title);
      const attachment = new AttachmentBuilder(buffer, { name: 'grenadeMaster.png' });

      await interaction.editReply({ files: [attachment] });
  } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
          await interaction.editReply("An error occurred while fetching Grenade Master stats.");
      } else {
          await interaction.reply("An error occurred while fetching Grenade Master stats.");
      }
  }
}

async function pmgoFind(interaction){
  try{
    const adminChannelId = '1337388431734603797';
    await interaction.deferReply();
    const region = interaction.options.getString("region");
    const teamCode = interaction.options.getString("team_code");
    const inviteLink = interaction.options.getString("invite_link");
    const playersNeeded = interaction.options.getInteger("players_needed");
    const preferredLanguage = interaction.options.getString("preferred_language");
    const contact = interaction.options.getUser("contact");
    const user = interaction.user;

    const adminChannel = interaction.guild.channels.cache.get(adminChannelId);
    const regionChannel = interaction.guild.channels.cache.get(region);

    const embed = new EmbedBuilder()
    .setTitle("New Team Request")
    .setDescription(
      `**Team Code:** ${teamCode}\n` +
      `**Invite Link:** ${inviteLink}\n` +
      `**Players Needed:** ${playersNeeded}\n` +
      `**Preferred Language:** ${preferredLanguage}\n` +
      `**Contact:** ${contact.tag} (<@${contact.id}>)\n\n` +
      `**Requested by:** ${user.tag} (<@${user.id}>)`
    )
    .setColor("#3498db");

    const approveButton = new ButtonBuilder()
      .setCustomId(`approve_${interaction.id}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
      .setCustomId(`reject_${interaction.id}`)
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(approveButton, rejectButton);

    const adminMessage = await adminChannel.send({ embeds: [embed], components: [row] });
    await interaction.editReply("Your request has been sent to the Admin for approval. You will be notified once the request is approved or rejected on DM.");

    const filter = (i) => i.customId.startsWith("approve_") || i.customId.startsWith("reject_");
    const collector = adminMessage.createMessageComponentCollector({ filter, max: 1, time: 28800000 });

    collector.on("collect", async (buttonInteraction) => {
      if (!buttonInteraction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return buttonInteraction.reply({ content: "Only admins can approve or reject requests!", ephemeral: true });
      }

      if (buttonInteraction.customId.startsWith("approve_")) {
        await buttonInteraction.update({ components: [] });
        await regionChannel.send({ embeds: [embed] });

        const updatedEmbed = EmbedBuilder.from(embed)
        .setColor("#2ecc71")
        .setFooter({ text: "✅ Approved by " + buttonInteraction.user.tag })
        .setDescription(
          `**Team Code:** ${teamCode}\n` +
          `**Invite Link:** ${inviteLink}\n\n` +
          `**Requested by:** ${user.tag} (<@${user.id}>)`
        );

      await adminMessage.edit({ embeds: [updatedEmbed], components: [] });
        
        try {
          await user.send(`Your team request has been **Approved** by an admin.\n\n**Details:**\nTeam Code: ${teamCode}\nInvite Link: ${inviteLink}\nPreferred Language: ${preferredLanguage}\nPlayers Needed: ${playersNeeded}`);
        } catch (err) {
          console.error(`Could not send DM to ${user.tag}:`, err);
          adminChannel.send(`Could not send DM to ${user.tag}: ${err}`);
        }
      } else if (buttonInteraction.customId.startsWith("reject_")) {
        await buttonInteraction.update({ components: [] });

        const updatedEmbed = EmbedBuilder.from(embed)
          .setColor("#e74c3c")
          .setFooter({ text: "❌ Rejected by " + buttonInteraction.user.tag })
          .setDescription(
            `**Team Code:** ${teamCode}\n` +
            `**Invite Link:** ${inviteLink}\n\n` +
            `**Requested by:** ${user.tag} (<@${user.id}>)`
          );

        await adminMessage.edit({ embeds: [updatedEmbed], components: [] });

        try {
          await user.send(`Your team request has been **rejected** by an admin.\n\n**Details:**\nTeam Code: ${teamCode}\nInvite Link: ${inviteLink}\nPreferred Language: ${preferredLanguage}\nPlayers Needed: ${playersNeeded}`);
        } catch (err) {
          console.error(`Could not send DM to ${user.tag}:`, err);
          adminChannel.send(`Could not send DM to ${user.tag}: ${err}`);
        }
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await adminMessage.edit({ content: "⏳ **Approval request expired (8 hours).**", components: [] });
      }
    });

  }catch(error){
    console.error(error);
    await interaction.editReply("An error occurred while sending the request");
  }
}

module.exports = { email, verify, onJoin, close, playerStatsInt, gunslingerStats, grenadeMasterStats, pmgoFind };
