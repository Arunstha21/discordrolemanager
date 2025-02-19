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
  

const PMGOServerTest = mongoose.model('pmgoServerTest', pmgoServerTestRole);

module.exports = {PMGOServerTest};