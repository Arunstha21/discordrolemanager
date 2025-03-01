const mongoose = require("mongoose");
const schema = mongoose.Schema;

const pmgoServerTestRole = new schema({
teamId :{
    type: String,
    require: true,
},
region: {
    type: String,
    require: true,
},
teamName:{
    type: String,
    require: true,
},
group: {
    type: String,
    require: true,
},
roleId: {
    type: String,
    require: true,
}
})

const matchLog = new schema({
    matchId :{
        type: String,
        require: true,
    },
    region: {
        type: String,
        require: true,
        enum: ['asia', 'europe', 'middle_east', 'north_america', 'south_america']
    },
    logType: {
        type: String,
        require: true,
        enum: ['issue', 'match_end', 'match_start']
    },
    noOfPlayers: {
        type: Number,
        require: true,
    },
    log: {
        type: String,
        require: false,
    }
    },
    {
        timestamps: true
    })

  
const PMGOServerTest = mongoose.model('pmgoServerTest', pmgoServerTestRole);
const MatchLog = mongoose.model('matchLog', matchLog);

module.exports = {PMGOServerTest, MatchLog};