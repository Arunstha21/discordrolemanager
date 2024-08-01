
async function playerStats() {
    const matchIds = [
        "666addec523d96d94f03b9e0",
        "666ae77c3078d10368b6e32e",
        "666af1c53078d10368b7729d",
        "666afb613078d10368b82518",
        "666b07db3078d10368b8d808",
        "666b107029932c12ee1aeaf0",
        "666c30d1cdc59430da9c84d0",
        "666c3ae0cdc59430da9d3447",
        "666c456a401d1647b251c2dd",
        "666c4f52401d1647b2526d08",
        "666c5b5d3411f6e9c0d14fe4",
        "666c6526ca55d2da86eec90d",
        "666d8124321bd711e0f0d4af",
        "666d8a9f321bd711e0f18ac8",
        "666d94b8321bd711e0f213c5",
        "666d9dfe321bd711e0f2be8a",
        "666da92a321bd711e0f36c6f",
        "666db1cd321bd711e0f41a5c"
      ]
    try {
        const response = await fetch(`http://localhost:3004/api/overallResults`,{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({matchIds})
        })

        if(response.ok){
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = playerStats;