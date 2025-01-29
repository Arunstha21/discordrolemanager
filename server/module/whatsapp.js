const mongoose = require("mongoose");
const schema = mongoose.Schema;

const lastInteractionSchema = new schema({
    sender: {
        type: String,
        require: true,
        unique: true,
    },
    lastInteractionTime: {
        type: mongoose.Schema.Types.Date,
        require: true,
    },
});

const messagesSchema = new schema({
    messageId:{
        type: String,
        require: true,
    },
    message:{
        type: Object,
        require: true,
    },
})

const WALastInteraction = mongoose.model('WALastInteraction', lastInteractionSchema);
const WAMessage = mongoose.model('WAMessage', messagesSchema);

module.exports = {WALastInteraction, WAMessage};