const express = require('express');
const csaRouter = express.Router();
const pmslDB = process.env.PMSL_DBURL;
console.log(pmslDB);
const {MongoClient, ObjectId} = require('mongodb');
const client = new MongoClient(pmslDB);

client.connect()
.then(() => {
    console.log("Connected to database");
})
.catch(err => {
    console.error("Error connecting to database:", err);
});

const toHHMMSS = (secs) => {
    const sec_num = parseInt(secs, 10)
    const hours   = Math.floor(sec_num / 3600)
    const minutes = Math.floor(sec_num / 60) % 60
    const seconds = sec_num % 60
  
    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
  }

csaRouter.get('/', async (req, res) => {
    const csaEventId = "66c41f2833aa084df2231abc";

    try {
        const event = await client.db("briskFlowPubgM").collection("events").findOne(
            { _id: new ObjectId(csaEventId) },
            { projection: { __v: 0 } }
        );
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Fetch stages without __v field
        const stages = await client.db("briskFlowPubgM").collection("stages").find(
            { event: new ObjectId(csaEventId) },
            { projection: { __v: 0 } }
        ).toArray();

        // Populate stages in event
        event.stages = stages;

        // Fetch groups related to these stages
        const stageIds = stages.map(stage => stage._id);
        const groups = await client.db("briskFlowPubgM").collection("groups").find(
            { stage: { $in: stageIds } },
            { projection: { __v: 0 } }
        ).toArray();

        // Fetch schedules related to these stages
        const schedules = await client.db("briskFlowPubgM").collection("schedules").find(
            { stage: { $in: stageIds }, type: { $ne: 'test' } },
            { projection: { __v: 0 } }
        ).toArray();

        // Prepare match data
        const matchData = schedules.map(schedule => ({
            id: schedule.match,
            groupId: schedule.groups,
            matchNo: `${schedule.matchDetails.number}`,
        }));

        // Create a map of match types
        const matchTypeMap = schedules.reduce((acc, schedule) => {
            acc[schedule.match] = schedule.type;
            return acc;
        }, {});

        // Filter out 'test' matches from groups and prepare group data
        const groupDataWithoutSlots = groups.map(group => {
            const { slotList, matches, ...rest } = group;
            return {
                ...rest,
                matches: matches.filter(matchId => matchTypeMap[matchId] !== 'test'),
            };
        });

        // Combine all data into a single object
        const gesData = {
            event,
            group: groupDataWithoutSlots,
            matchData,
        };

        // Send the response
        res.status(200).json({ gesData });

    } catch (err) {
        console.error("Error while fetching data:", err);
        res.status(500).json({ error: "Error while fetching data" });
    }
});

csaRouter.get('/event',async (req, res)=>{
    const csaEventId = "66c41f2833aa084df2231abc";

    try {
        const event = await client.db("briskFlowPubgM").collection("events").findOne(
            { _id: new ObjectId(csaEventId) },
            { projection: { __v: 0 } }
        );
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Fetch stages without __v field
        const stages = await client.db("briskFlowPubgM").collection("stages").find(
            { event: new ObjectId(csaEventId) },
            { projection: { __v: 0 } }
        ).toArray();

        // Populate stages in event
        event.stages = stages;

        // Send the response
        res.status(200).json(event);

    } catch (err) {
        console.error("Error while fetching data:", err);
        res.status(500).json({ error: "Error while fetching data" });
    }
})

csaRouter.post("/overallResults", async (req, res) => {
    try {
      const matchIds = req.body.matchIds.map(id => new ObjectId(id));
      const teamStatsColl = client.db("briskFlowPubgM").collection("teamstats");
      const playerStatsColl = client.db("briskFlowPubgM").collection("playerstats");
      const matchNoColl = client.db("briskFlowPubgM").collection("matches");
      const teamColl = client.db("briskFlowPubgM").collection("teams");
      const playerColl = client.db("briskFlowPubgM").collection("players");
  
      let result = {};
      let teamResult = [];
      let playerResult = [];
  
      const teamStatsMap = {};
      const playerStatsMap = {};
  
      let totalSurvivalTime = 0;
      let totalDamage = 0;
      let totalKills = 0;
  
      // Fetch all matches at once with projection
      const matches = await matchNoColl.find({ _id: { $in: matchIds } }, { projection: { _id: 1 } }).toArray();
      const validMatchIds = matches.map(match => match._id);
  
      // Fetch all team and player stats at once with projections
      const [teamStats, playerStats] = await Promise.all([
        teamStatsColl.find({ match: { $in: validMatchIds } }, { projection: { team: 1, kill: 1, damage: 1, placePoint: 1, totalPoint: 1, rank: 1 } }).toArray(),
        playerStatsColl.find({ match: { $in: validMatchIds } }, { projection: { player: 1, kill: 1, damage: 1, survivalTime: 1, assist: 1, heal: 1, headshot: 1 } }).toArray()
      ]);
  
      // Process team stats
      for (const data of teamStats) {
        const teamId = data.team;
  
        if (!teamStatsMap[teamId]) {
          teamStatsMap[teamId] = {
            matchCount: 0,
            kill: 0,
            damage: 0,
            placePoint: 0,
            totalPoint: 0,
            wwcd: 0,
            starterPoint: 0,
            lastMatchRank: data.rank
          };
        } else {
          teamStatsMap[teamId].lastMatchRank = data.rank;
        }
  
        teamStatsMap[teamId].matchCount++;
        teamStatsMap[teamId].wwcd += data.rank === 1 ? 1 : 0;
        teamStatsMap[teamId].kill += data.kill;
        teamStatsMap[teamId].damage += data.damage;
        teamStatsMap[teamId].placePoint += data.placePoint;
        teamStatsMap[teamId].totalPoint += data.totalPoint;
      }
  
      
  
      // Process player stats
      for (const data of playerStats) {
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
          };
        }
  
        playerStatsMap[playerId].matchPlayed++;
        playerStatsMap[playerId].kill += data.kill;
        playerStatsMap[playerId].damage += data.damage;
        playerStatsMap[playerId].survivalTime += data.survivalTime;
        playerStatsMap[playerId].assist += data.assist;
        playerStatsMap[playerId].heal += data.heal;
        playerStatsMap[playerId].headshot += data.headshot;
        totalSurvivalTime += data.survivalTime;
        totalDamage += data.damage;
        totalKills += data.kill;
      }
  
      const teamIds = Object.keys(teamStatsMap).map(id => new ObjectId(id));
      const playerIds = Object.keys(playerStatsMap).map(id => new ObjectId(id));
  
      // Fetch teams and players in parallel with projections
      const [teams, players] = await Promise.all([
        teamColl.find({ _id: { $in: teamIds } }, { projection: { name: 1, tag: 1 } }).toArray(),
        playerColl.find({ _id: { $in: playerIds } }, { projection: { ign: 1, uId: 1, teams: 1 } }).toArray()
      ]);
  
      const teamMap = teams.reduce((acc, team) => {
        acc[team._id] = team;
        return acc;
      }, {});
  
      const playerMap = players.reduce((acc, player) => {
        acc[player._id] = player;
        return acc;
      }, {});
  
      // Prepare team results
      for (const teamId in teamStatsMap) {
        const teamDoc = teamMap[new ObjectId(teamId)];
        if (!teamDoc) continue; // skip if team not found
        const teamName = teamDoc.name;
        const teamTag = teamDoc.tag;
  
        const overallPoint = teamStatsMap[teamId].totalPoint;
  
        teamResult.push({
          team: teamName,
          tag: teamTag,
          kill: teamStatsMap[teamId].kill,
          damage: teamStatsMap[teamId].damage,
          matchCount: teamStatsMap[teamId].matchCount,
          placePoint: teamStatsMap[teamId].placePoint,
          totalPoint: overallPoint,
          lastMatchRank: teamStatsMap[teamId].lastMatchRank,
          wwcd: teamStatsMap[teamId].wwcd
        });
      }
  
      // Prepare player results
      for (const playerId in playerStatsMap) {
        const playerDoc = playerMap[new ObjectId(playerId)];
        if (!playerDoc) continue; // skip if player not found
        const teamDoc = teamMap[playerDoc.teams[0]];
  
        const teamName = teamDoc ? teamDoc.name : "Unknown";
        const ign = playerDoc.ign;
        const uId = playerDoc.uId;
  
        const playerSurvivalTimeRatio = playerStatsMap[playerId].survivalTime / totalSurvivalTime;
        const playerDamageRatio = playerStatsMap[playerId].damage / totalDamage;
        const playerKillRatio = playerStatsMap[playerId].kill / totalKills;
  
        const MVP = (((playerSurvivalTimeRatio * 0.4) + (playerDamageRatio * 0.4) + (playerKillRatio * 0.2)) * 100).toFixed(3);
        const survTime = playerStatsMap[playerId].survivalTime / playerStatsMap[playerId].matchPlayed;
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
  
      // Sort and rank results
      teamResult.sort((a, b) => {
        if (a.totalPoint !== b.totalPoint) {
          return b.totalPoint - a.totalPoint;
        }
        if (a.wwcd !== b.wwcd) {
          return b.wwcd - a.wwcd;
        }
        if (a.placePoint !== b.placePoint) {
          return b.placePoint - a.placePoint;
        }
        if (a.kill !== b.kill) {
          return b.kill - a.kill;
        }
        return a.lastMatchRank - b.lastMatchRank;
      });
  
      teamResult.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
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
  
      result = {
        teamResult,
        playerResult
      };
  
      res.status(200).json({ result });
    } catch (err) {
      console.error("Error while fetching data:", err);
      res.status(500).json({ error: "Error while fetching data" });
    }
  });
  
csaRouter.post("/perMatchResults", async (req, res) => {
    try {
      const matchId = new ObjectId(req.body.matchId);
  
      const teamStatsColl = client.db("briskFlowPubgM").collection("teamstats");
      const playerStatsColl = client.db("briskFlowPubgM").collection("playerstats");
      const teamColl = client.db("briskFlowPubgM").collection("teams");
      const playerColl = client.db("briskFlowPubgM").collection("players");
      const schedulesColl = client.db("briskFlowPubgM").collection("schedules");
  
      // Fetch schedule document first
      const scheduleDoc = await schedulesColl.findOne({ match: matchId }, { projection: { "matchDetails.number": 1 } });
      if (!scheduleDoc) {
        return res.status(404).json({ error: "Schedule not found for the match" });
      }
  
      const matchNo = scheduleDoc.matchDetails.number;
  
      // Fetch team and player stats in parallel with projections
      const [teamStats, playerStats] = await Promise.all([
        teamStatsColl.find({ match: matchId }, { projection: { team: 1, kill: 1, damage: 1, rank: 1, placePoint: 1, totalPoint: 1 } }).toArray(),
        playerStatsColl.find({ match: matchId }, { projection: { player: 1, team: 1, kill: 1, damage: 1, survivalTime: 1, assist: 1, heal: 1, headshot: 1 } }).toArray()
      ]);
  
      const teamIds = [...new Set(teamStats.map(ts => ts.team))];
      const playerIds = [...new Set(playerStats.map(ps => ps.player))];
  
      // Fetch team and player documents in parallel with projections
      const [teams, players] = await Promise.all([
        teamColl.find({ _id: { $in: teamIds } }, { projection: { name: 1, tag: 1 } }).toArray(),
        playerColl.find({ _id: { $in: playerIds } }, { projection: { ign: 1, uId: 1, teams: 1 } }).toArray()
      ]);
  
      const teamMap = teams.reduce((acc, team) => {
        acc[team._id] = team;
        return acc;
      }, {});
  
      const playerMap = players.reduce((acc, player) => {
        acc[player._id] = player;
        return acc;
      }, {});
  
      const teamResult = teamStats.map(data => {
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
      }).filter(Boolean);
  
      teamResult.sort((a, b) => {
        if (a.totalPoint !== b.totalPoint) return b.totalPoint - a.totalPoint;
        if (a.placePoint !== b.placePoint) return b.placePoint - a.placePoint;
        if (a.kill !== b.kill) return b.kill - a.kill;
        return a.rank - b.rank;
      });
  
      teamResult.forEach((item, index) => {
        item.cRank = index + 1;
      });
  
      const playerResult = playerStats.map(data => {
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
      }).filter(Boolean);
  
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
        playerResult
      };
  
      res.status(200).json({ result });
  
    } catch (err) {
      console.error("Error while fetching data:", err);
      res.status(500).json({ error: "Error while fetching data" });
    }
  });
  
csaRouter.post("/topTenMvps", async (req, res) => {
    try {
      const matchIds = req.body.matchIds.map(id => new ObjectId(id));
  
      const playerStatsColl = client.db("briskFlowPubgM").collection("playerstats");
      const teamColl = client.db("briskFlowPubgM").collection("teams");
      const playerColl = client.db("briskFlowPubgM").collection("players");
  
      let playerResult = [];
      const playerStatsMap = {};
      let totalSurvivalTime = 0;
      let totalDamage = 0;
      let totalKills = 0;
  
      // Fetch player stats for all matchIds in parallel
      const allPlayerStats = await playerStatsColl.find({ match: { $in: matchIds } }).toArray();
  
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
          };
        }
        playerStatsMap[playerId].matchPlayed++;
        playerStatsMap[playerId].kill += data.kill;
        playerStatsMap[playerId].damage += data.damage;
        playerStatsMap[playerId].survivalTime += data.survivalTime;
        playerStatsMap[playerId].assist += data.assist;
        playerStatsMap[playerId].heal += data.heal;
        playerStatsMap[playerId].headshot += data.headshot;
        totalSurvivalTime += data.survivalTime;
        totalDamage += data.damage;
        totalKills += data.kill;
      }
  
      const playerIds = Object.keys(playerStatsMap).map(id => new ObjectId(id));
  
      // Fetch player and team documents in parallel
      const [players, teams] = await Promise.all([
        playerColl.find({ _id: { $in: playerIds } }).toArray(),
        teamColl.find({}).toArray() // fetch all teams to reduce queries
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
  
        const MVP = (((playerSurvivalTimeRatio * 0.4) + (playerDamageRatio * 0.4) + (playerKillRatio * 0.2)) * 100).toFixed(3);
        const survTime = playerStatsMap[playerId].survivalTime / playerStatsMap[playerId].matchPlayed;
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

csaRouter.get("/gesData", async (req, res) => {
    try {
      // Parallelize database queries
      const [event, stage, group, schedules] = await Promise.all([
        client.db("briskFlowPubgM").collection("events").find({}).toArray(),
        client.db("briskFlowPubgM").collection("stages").find({}).toArray(),
        client.db("briskFlowPubgM").collection("groups").find({}).toArray(),
        client.db("briskFlowPubgM").collection("schedules").find({}).project({ match: 1, type: 1, groups: 1, matchDetails: 1 }).toArray()
      ]);
  
      let matchData = [];
      schedules.forEach(schedule => {
        if (schedule.match && schedule.type !== 'test') {
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
  
      const groupDataWithoutSlots = group.map(group => {
        const filteredMatches = group.matches.filter(matchId => matchTypeMap[matchId] !== 'test');
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


module.exports = csaRouter;