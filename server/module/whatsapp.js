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
    discordMessageId:{
        type: String,
    },
    message:{
        type: Object,
        require: true,
    },
})

const bridgeChannelSchema = new mongoose.Schema({
    whatsappId: { type: String, required: true, unique: true },
    discordChannelId: { type: String, required: true },
  }, { timestamps: true });

  const commands = new schema({
    guildId :{
        type: String,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    value: {
        type: String,
        require: true,
    },
  })
  

const WALastInteraction = mongoose.model('WALastInteraction', lastInteractionSchema);
const WAMessage = mongoose.model('WAMessage', messagesSchema);
const BridgeChannel = mongoose.model('BridgeChannel', bridgeChannelSchema);
const Commands = mongoose.model('Commands', commands);

module.exports = {WALastInteraction, WAMessage, BridgeChannel, Commands};