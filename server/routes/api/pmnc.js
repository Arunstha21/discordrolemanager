const express = require("express");
const pmncRouter = express.Router();
require("dotenv").config();
const pmncDB = process.env.PMGO_DBURL;

const { MongoClient, ObjectId } = require("mongodb");
const { getData, overallResults } = require("./pmncResults");
const client = new MongoClient(pmncDB);

const toHHMMSS = (secs) => {
  const sec_num = parseInt(secs, 10);
  const hours = Math.floor(sec_num / 3600);
  const minutes = Math.floor(sec_num / 60) % 60;
  const seconds = sec_num % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? "0" + v : v))
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
};

pmncRouter.get("/", async (req, res) => {

  try {
    const gesData = await getData();
    const parsedGesData = JSON.parse(gesData);
    // Send the response
    res.status(200).json({ parsedGesData });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.get("/event", async (req, res) => {

  try {
    const event = await client
      .db("briskFlowPubgM")
      .collection("events")
      .find( { projection: { __v: 0 } });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch stages without __v field
    const stages = await client
      .db("briskFlowPubgM")
      .collection("stages")
      .find({ projection: { __v: 0 } })
      .toArray();

    // Populate stages in event
    event.stages = stages;

    // Send the response
    res.status(200).json(event);
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.post("/overallResults", async (req, res) => {
  try {
    const ids = req.body.matchIds;
    const result = await overallResults(ids);
    res.status(200).json({ result });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.post("/perMatchResults", async (req, res) => {
  try {
    const matchId = new ObjectId(req.body.matchId);

    const teamStatsColl = client.db("briskFlowPubgM").collection("teamstats");
    const playerStatsColl = client
      .db("briskFlowPubgM")
      .collection("playerstats");
    const teamColl = client.db("briskFlowPubgM").collection("teams");
    const playerColl = client.db("briskFlowPubgM").collection("players");
    const schedulesColl = client.db("briskFlowPubgM").collection("schedules");

    // Fetch schedule document first
    const scheduleDoc = await schedulesColl.findOne(
      { match: matchId },
      { projection: { "matchDetails.number": 1 } }
    );
    if (!scheduleDoc) {
      return res
        .status(404)
        .json({ error: "Schedule not found for the match" });
    }

    const matchNo = scheduleDoc.matchDetails.number;

    // Fetch team and player stats in parallel with projections
    const [teamStats, playerStats] = await Promise.all([
      teamStatsColl
        .find(
          { match: matchId },
          {
            projection: {
              team: 1,
              kill: 1,
              damage: 1,
              rank: 1,
              placePoint: 1,
              totalPoint: 1,
            },
          }
        )
        .toArray(),
      playerStatsColl
        .find(
          { match: matchId },
          {
            projection: {
              player: 1,
              team: 1,
              kill: 1,
              damage: 1,
              survivalTime: 1,
              assist: 1,
              heal: 1,
              headshot: 1,
            },
          }
        )
        .toArray(),
    ]);

    const teamIds = [...new Set(teamStats.map((ts) => ts.team))];
    const playerIds = [...new Set(playerStats.map((ps) => ps.player))];

    // Fetch team and player documents in parallel with projections
    const [teams, players] = await Promise.all([
      teamColl
        .find({ _id: { $in: teamIds } }, { projection: { name: 1, tag: 1 } })
        .toArray(),
      playerColl
        .find(
          { _id: { $in: playerIds } },
          { projection: { ign: 1, uId: 1, teams: 1 } }
        )
        .toArray(),
    ]);

    const teamMap = teams.reduce((acc, team) => {
      acc[team._id] = team;
      return acc;
    }, {});

    const playerMap = players.reduce((acc, player) => {
      acc[player._id] = player;
      return acc;
    }, {});

    const teamResult = teamStats
      .map((data) => {
        const teamDoc = teamMap[data.team];
        if (!teamDoc) return null; // Skip if team not found
        return {
          match: `Match ${matchNo}`,
          team: teamDoc.name,
          tag: teamDoc.tag,
          kill: data.kill,
          damage: data.damage,
          rank: data.rank,
          placePoint: data.placePoint,
          totalPoint: data.totalPoint,
          wwcd: data.rank === 1 ? 1 : 0,
        };
      })
      .filter(Boolean);

    teamResult.sort((a, b) => {
      if (a.totalPoint !== b.totalPoint) return b.totalPoint - a.totalPoint;
      if (a.placePoint !== b.placePoint) return b.placePoint - a.placePoint;
      if (a.kill !== b.kill) return b.kill - a.kill;
      return a.rank - b.rank;
    });

    teamResult.forEach((item, index) => {
      item.cRank = index + 1;
    });

    const playerResult = playerStats
      .map((data) => {
        const playerDoc = playerMap[data.player];
        const teamDoc = teamMap[data.team];
        if (!playerDoc || !teamDoc) return null; // Skip if player or team not found
        return {
          match: `Match ${matchNo}`,
          teamName: teamDoc.name,
          inGameName: playerDoc.ign,
          uId: playerDoc.uId,
          kill: data.kill,
          damage: data.damage,
          dataSurvTime: data.survivalTime,
          survivalTime: toHHMMSS(data.survivalTime),
          assist: data.assist,
          heal: data.heal,
          headshot: data.headshot,
        };
      })
      .filter(Boolean);

    playerResult.sort((a, b) => {
      if (a.kill !== b.kill) return b.kill - a.kill;
      if (a.damage !== b.damage) return b.damage - a.damage;
      return b.dataSurvTime - a.dataSurvTime;
    });

    playerResult.forEach((item, index) => {
      item.cRank = index + 1;
    });

    const result = {
      teamResult,
      playerResult,
    };

    res.status(200).json({ result });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.post("/topTenMvps", async (req, res) => {
  try {
    const matchIds = req.body.matchIds.map((id) => new ObjectId(id));

    const playerStatsColl = client
      .db("briskFlowPubgM")
      .collection("playerstats");
    const teamColl = client.db("briskFlowPubgM").collection("teams");
    const playerColl = client.db("briskFlowPubgM").collection("players");

    let playerResult = [];
    const playerStatsMap = {};
    let totalSurvivalTime = 0;
    let totalDamage = 0;
    let totalKills = 0;

    // Fetch player stats for all matchIds in parallel
    const allPlayerStats = await playerStatsColl
      .find({ match: { $in: matchIds } })
      .toArray();

    // Aggregate player stats
    for (const data of allPlayerStats) {
      const playerId = data.player;
      if (!playerStatsMap[playerId]) {
        playerStatsMap[playerId] = {
          kill: 0,
          damage: 0,
          survivalTime: 0,
          assist: 0,
          heal: 0,
          headshot: 0,
          matchPlayed: 0,
          knockout: 0,
          grenadeKill: 0,
        };
      }
      playerStatsMap[playerId].matchPlayed++;
      playerStatsMap[playerId].kill += data.kill;
      playerStatsMap[playerId].damage += data.damage;
      playerStatsMap[playerId].survivalTime += data.survivalTime;
      playerStatsMap[playerId].assist += data.assist;
      playerStatsMap[playerId].heal += data.heal;
      playerStatsMap[playerId].headshot += data.headshot;
      playerStatsMap[playerId].knockout += data.knockout;
      playerStatsMap[playerId].grenadeKill += data.grenadeKill;

      totalSurvivalTime += data.survivalTime;
      totalDamage += data.damage;
      totalKills += data.kill;
    }

    const playerIds = Object.keys(playerStatsMap).map((id) => new ObjectId(id));

    // Fetch player and team documents in parallel
    const [players, teams] = await Promise.all([
      playerColl.find({ _id: { $in: playerIds } }).toArray(),
      teamColl.find({}).toArray(), // fetch all teams to reduce queries
    ]);

    const teamMap = teams.reduce((acc, team) => {
      acc[team._id] = team;
      return acc;
    }, {});

    const playerMap = players.reduce((acc, player) => {
      acc[player._id] = player;
      return acc;
    }, {});

    // Calculate MVP scores and prepare player results
    for (const playerId in playerStatsMap) {
      const playerDoc = playerMap[new ObjectId(playerId)];
      const teamDoc = teamMap[playerDoc.teams];

      const teamName = teamDoc.name;
      const ign = playerDoc.ign;
      const uId = playerDoc.uId;

      const playerSurvivalTimeRatio = playerStatsMap[playerId].survivalTime / totalSurvivalTime;
      const playerDamageRatio = playerStatsMap[playerId].damage / totalDamage;
      const playerKillRatio = playerStatsMap[playerId].kill / totalKills;

      const MVP = (
        (playerSurvivalTimeRatio * 0.4 +
          playerDamageRatio * 0.4 +
          playerKillRatio * 0.2) *
        100
      ).toFixed(3);

      const survTime =
        playerStatsMap[playerId].survivalTime /
        playerStatsMap[playerId].matchPlayed;
      const avgSurvTime = toHHMMSS(survTime);

      playerResult.push({
        teamName: teamName,
        inGameName: ign,
        uId: uId,
        kill: playerStatsMap[playerId].kill,
        damage: playerStatsMap[playerId].damage,
        matchPlayed: playerStatsMap[playerId].matchPlayed,
        dataSurvTime: survTime,
        survivalTime: avgSurvTime,
        assist: playerStatsMap[playerId].assist,
        heal: playerStatsMap[playerId].heal,
        headshot: playerStatsMap[playerId].headshot,
        mvp: MVP,
      });
    }

    // Sort and get top 10 MVPs
    playerResult.sort((a, b) => {
      if (a.mvp !== b.mvp) {
        return b.mvp - a.mvp;
      }
      if (a.kill !== b.kill) {
        return b.kill - a.kill;
      }
      if (a.damage !== b.damage) {
        return b.damage - a.damage;
      }
      return b.dataSurvTime - a.dataSurvTime;
    });

    playerResult.forEach((item, index) => {
      item.cRank = index + 1;
    });

    playerResult = playerResult.slice(0, 10);

    res.status(200).json({ playerResult });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.get("/gesData", async (req, res) => {
  try {
    // Parallelize database queries
    const [event, stage, group, schedules] = await Promise.all([
      client.db("briskFlowPubgM").collection("events").find({}).toArray(),
      client.db("briskFlowPubgM").collection("stages").find({}).toArray(),
      client.db("briskFlowPubgM").collection("groups").find({}).toArray(),
      client
        .db("briskFlowPubgM")
        .collection("schedules")
        .find({})
        .project({ match: 1, type: 1, groups: 1, matchDetails: 1 })
        .toArray(),
    ]);

    let matchData = [];
    schedules.forEach((schedule) => {
      if (schedule.match && schedule.type !== "test") {
        const data = {
          id: schedule.match,
          groupId: schedule.groups,
          matchNo: `${schedule.matchDetails.number}`,
        };
        matchData.push(data);
      }
    });

    const matchTypeMap = schedules.reduce((acc, schedule) => {
      acc[schedule.match] = schedule.type;
      return acc;
    }, {});

    const groupDataWithoutSlots = group.map((group) => {
      const filteredMatches = group.matches.filter(
        (matchId) => matchTypeMap[matchId] !== "test"
      );
      return { ...group, matches: filteredMatches };
    });

    const gesData = {
      event,
      stage,
      group: groupDataWithoutSlots,
      matchData,
    };
    res.status(200).json({ gesData });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});

pmncRouter.get("/getPlayerIds", async (req, res) => {
  try {
    const playerStatsColl = await client
      .db("briskFlowPubgM")
      .collection("teams")
      .find({event: new ObjectId("66c41f2833aa084df2231abc")})
      .toArray();

    const playerIds = playerStatsColl.reduce((acc, team) => {
      acc.push(...team.players);
      return acc;
    }, []);

    const playerInfo = await client
      .db("briskFlowPubgM")
      .collection("players")
      .find({ _id: { $in: playerIds } })
      .toArray();

    res.status(200).json({ playerInfo });
  } catch (err) {
    console.error("Error while fetching data:", err);
    res.status(500).json({ error: "Error while fetching data" });
  }
});


module.exports = pmncRouter;

