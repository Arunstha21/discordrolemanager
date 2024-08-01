const mongoose = require("mongoose");
const schema = mongoose.Schema;

const teamDataSchema = new schema({
    teamName:{
        type: String,
        require: true,
    },
    teamTag:{
        type: String,
        require: true,
    },
    teamMembers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
    }],
});

const userDataSchema = new schema({
    discordTag:{
        type: String,
        require: true,
    },
    emailId:{
        type: String,
        require: true,
    },
    role: {
        type: Array,
        require: true,
    },
    otp:{
        type: Number,
    },
    teamId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teamData',
    },
    serverJoined:{
        type: Boolean,
        default: false,
    },
    emailSent :{
        type: Number,
        default: 0,
    },
    guild:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'guildData',
    },
    sender:{
        type: String,
    }
});

const guildDataSchema = new schema({
    guildId:{
        type: String,
        require: true,
        unique: true,
    },
    guildName:{
        type: String,
        require: true,
    },
    users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
    }],
    admins:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminData',
    }],
});

const adminDataSchema = new schema({
    discordTag:{
        type: String,
        require: true,
    },
    emailId:{
        type: String,
        require: true,
    },
    role: {
        type: Array,
        require: true,
    },
    serverJoined:{
        type: Boolean,
        default: false,
    },
    guild:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'guildData',
    },
    sender:{
        type: String,
    }
});

const teamData = mongoose.model('teamData', teamDataSchema);
const userData = mongoose.model('userData', userDataSchema);
const guildData = mongoose.model('guildData', guildDataSchema);
const adminData = mongoose.model('adminData', adminDataSchema);

module.exports = {teamData, userData, guildData, adminData};