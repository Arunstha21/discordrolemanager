const logger = require("./logger");

async function playerStats(stage) {
    try {
        const csa = await fetch('http://localhost:3004/api/csa');
        const {gesData} = await csa.json();
        const {event, group, matchData } = gesData;
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
        
        const response = await fetch(`http://localhost:3004/api/overallResults`,{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({matchIds})
        })

        if(response.ok){
            const data = await response.json();
            data.title = title;
            return data;
        }
    } catch (error) {
        logger.error("Error fetching player stats", error);
    }
}

module.exports = playerStats;