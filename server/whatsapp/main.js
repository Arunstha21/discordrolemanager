const { getFlagMap, translateText } = require('../discord/translate');

function startBot(client) {

    client.onMessage(async (message) => {
        if (message.isGroupMsg && message.groupInfo.name === 'Tickets' && message.body === 'Ticket') {
            console.log('Ticket message received');
            const sender = message.author;
            const responseText = `Hello ${message.sender.pushname}, How can we help you?`;
            
            client.sendText(sender, responseText)
                .then(() => {
                    console.log(`Replied to ${sender}`);

                    client.sendReactions(message.id, '👍')
                      .then(() => console.log('Reaction added'))
                      .catch((err) => console.log('Reaction error:', err));
                  })
                .catch((err) => console.log(err));
        }else if(message.isGroupMsg && message.groupInfo.name === 'Tickets' && message.body != 'Ticket'){
            console.log('Ticket message received');
            const sender = message.from;
            
            const responseText = `Hello ${message.sender.pushname}, Please type 'Ticket' to get help.`;
            
            client.reply(message.chatId, responseText, message.id)
                .then(() => {
                    console.log(`Replied to ${sender}`);
                  })
                .catch((err) => console.log(err));
        }
    });

    client.onMessageReaction(async (reaction) => {
        const flagMap = await getFlagMap();
        if (flagMap.has(reaction.reactionText)) {
            const flag = flagMap.get(reaction.reactionText);
            
            try {
                const messageContent = await client.getMessageById(reaction.reactionParentKey._serialized, reaction.reactionParentKey.id);
                if(messageContent.erro == true){
                    console.log('Error:', messageContent);
                    return;
                }
                const message = messageContent.body;
                const chatId = messageContent.chatId;
                const messageId = messageContent.id;
                const messageUser = messageContent.from;
                console.log('Message:', message);
                console.log('Message User:', messageUser);
                const translate = await translateText(message, flag.code);
                const responseText = `Translated message: ${translate}`;
                console.log('Translated message:', responseText);
                client.reply(chatId, translate, messageId).then(() => {
                    console.log('Translated message sent');
                }).catch((err) => console.log(err));
            } catch (error) {
                console.log('Error:', error);
            }
        }else {
            console.log(`${reaction.emoji.name} Emoji is not flag`);
        }
    });
}

module.exports = startBot;