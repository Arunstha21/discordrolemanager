const express = require("express");
const router = express.Router();
const { teamData, userData, guildData } = require("../../module/user");
const logger = require("../../helper/logger");

router.post('/admin/import', async (req, res) => {
    const datas = req.body;
    for (const data of datas) {
        try {
            const guild = await findOrCreateGuild(data.guildId, data.guildName);

            const user = new userData({
                discordTag: data.discordTag,
                emailId: data.emailId,
                role: ["Admin"],
                guild: guild._id,
            });
            guild.admins.push(user._id);
            await Promise.all([guild.save(), user.save()]);
        } catch (error) {
            res.status(500).json({ error: error.message });
            
            logger.error(`Error processing data for ${data.discordTag}:`, error);
        }
    }
    res.status(200).json({ message: "Data imported successfully" });
    logger.info("Data imported successfully");
});

const findOrCreateGuild = async (guildId, guildName) => {
    let guild = await guildData.findOne({ guildId });
    if (!guild) {
      guild = new guildData({ guildId, guildName });
      await guild.save();
    }
    return guild;
  };

// Route to handle import
router.post("/import", async (req, res) => {
  const datas = req.body;

  const findOrCreateTeam = async (teamName, teamTag) => {
    let team = await teamData.findOne({ teamName });
    if (!team) {
      team = new teamData({ teamName, teamTag });
      await team.save();
    }
    return team;
  };

  for (const data of datas) {
    try {
      const team = await findOrCreateTeam(data.teamName, data.teamTag);
      const guild = await findOrCreateGuild(data.guildId, data.guildName);
      const roles = [
        data.rolePlayer ? 'Player' : '', 
        data.roleOwner ? 'Owner' : '', 
        data.teamName
      ].filter(Boolean);
       
      const user = new userData({
        discordTag: data.discordTag,
        emailId: data.emailId,
        role: roles,
        teamId: team._id,
        guild: guild._id,
      });

      team.teamMembers.push(user._id);
      guild.users.push(user._id);

      await Promise.all([team.save(), guild.save(), user.save()]);
    } catch (error) {
      res.status(500).json({ error: error.message });
      logger.error(`Error processing data for ${data.discordTag}:`, error);
    }
  }

  res.status(200).json({ message: "Data imported successfully" });
  logger.info("Data imported successfully");
});

// Get all members with team and guild data
router.get("/", async (req, res) => {
  try {
    const users = await userData.find()
    .populate({
        path: 'teamId',
        options: { strictPopulate: false }
        
    })
    .populate({
        path: 'guild',
        options: { strictPopulate: false }
        
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific member by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await userData.findById(req.params.id)
    .populate({
        path: 'teamId',
        options: { strictPopulate: false }
        
    })
    .populate({
        path: 'guild',
        options: { strictPopulate: false }
        
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific member by ID
router.put("/:id", async (req, res) => {
  try {
    const { teamName, teamTag, guildId, guildName, ...userDataToUpdate } = req.body;

    // Update user data
    const user = await userData.findByIdAndUpdate(req.params.id, userDataToUpdate, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update team data if provided
    if (teamName || teamTag) {
      const team = await teamData.findById(user.teamId);
      if (team) {
        if (teamName) team.teamName = teamName;
        if (teamTag) team.teamTag = teamTag;
        await team.save();
      }
    }

    // Update guild data if provided
    if (guildId || guildName) {
      const guild = await guildData.findById(guildId);
      if (guild) {
        if (guildName) guild.guildName = guildName;
        await guild.save();
      }
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific member by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await userData.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove the user from the associated team and guild
    await teamData.updateOne({ _id: user.teamId }, { $pull: { teamMembers: user._id } });
    await guildData.updateMany({ users: user._id }, { $pull: { users: user._id } });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific guild by ID with populated user data
router.get("/guild/:id", async (req, res) => {
  try {
    const guild = await guildData.findById(req.params.id).populate('users');
    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }
    res.status(200).json(guild);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
