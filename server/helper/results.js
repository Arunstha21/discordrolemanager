const { getData, overallResults } = require("../routes/api/results");
const logger = require("./logger");

async function getMatchIds(){
    try {
        const csaEventId = "66c41f2833aa084df2231abc";
        const gesData = await getData(csaEventId);
        const parsedGesData = JSON.parse(gesData);
        const {event, group, matchData } = parsedGesData;
        const stages = event.stages;

        const stageWithMatchIds = stages.map(s => {
            const stageGroupIds = group
                .filter(g => g.stage === s._id)
                .map(g => g._id);

            const matchIds = matchData
                .filter(m => m.groupId.some(gid => stageGroupIds.includes(gid)))
                .map(m => m.id);

            return { id: s._id, name: s.name, matchIds  };
        });

        return stageWithMatchIds;
    } catch (error) {
        logger.error("Error fetching Gunslinger", error);
    }
}

async function playerStats(stage) {
    try {
        const stageWithMatchIds = await getMatchIds();

        let matchIds = [];
        let title;
        if (!stage) {
            title = "Overall Player Stats";
            matchIds = stageWithMatchIds.map(s => s.matchIds).flat();
        } else {
            const stageData = stageWithMatchIds.find(s => s.id === stage);
            title = `${stageData.name} - Player Stats`;
            matchIds = stageData.matchIds;
        }

        const overallData = await overallResults(matchIds);
        overallData.title = title;
        return overallData;
    } catch (error) {
        logger.error("Error fetching player stats", error);
    }
}



async function gunslingers(){
    try {
        const stageWithMatchIds = await getMatchIds();

        const title = "Top 5 Gunslingers";
        const matchIds = stageWithMatchIds.map(s => s.matchIds).flat();
        const overallResult = await overallResults(matchIds);
        const playerStats = overallResult.playerResult
        .sort((a, b) => {
          if (b.slingerNumber === a.slingerNumber) {
            return b.kill - a.kill;
          }
          return b.slingerNumber - a.slingerNumber;
        })
        .slice(0, 5);
      
        playerStats.title = title;
        return playerStats;
    } catch (error) {
        logger.error("Error fetching Gunslinger", error);
    }
}

async function grenadeMaster(){
    try {
        const stageWithMatchIds = await getMatchIds();

        const title = "Top 5 Grenade Masters";
        const matchIds = stageWithMatchIds.map(s => s.matchIds).flat();
        const overallResult = await overallResults(matchIds);
        const playerStats = overallResult.playerResult
        .sort((a, b) => {
          if (b.grenadeKill === a.grenadeKill) {
            return b.kill - a.kill;
          }
          return b.grenadeKill - a.grenadeKill;
        })
        .slice(0, 5);
      
        playerStats.title = title;
        return playerStats;
    } catch (error) {
        logger.error("Error fetching Grenade Master", error);
    }
}

module.exports = {playerStats, gunslingers, grenadeMaster};