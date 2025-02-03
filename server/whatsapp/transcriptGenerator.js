function generateTranscript(messages, channelName) {
    const transcriptHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transcript - ${channelName}</title>
        <style>
          :root {
            --background: #313338;
            --text-primary: #f2f3f5;
            --text-secondary: #b5bac1;
            --header-bg: #2b2d31;
            --message-hover: #2e3035;
            --border-color: #3f4147;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--background);
            color: var(--text-primary);
            line-height: 1.5;
          }
          
          .header {
            background: var(--header-bg);
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
          }
          
          .channel-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
          }
          
          .message-count {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 4px;
          }
          
          .messages {
            padding: 16px;
          }
          
          .message {
            padding: 8px 16px;
            margin: 2px 0;
            border-radius: 4px;
          }
          
          .message:hover {
            background: var(--message-hover);
          }
          
          .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
          }
          
          .author {
            font-weight: 700;
            margin-right: 8px;
            font-size: 1rem;
          }
          
          .timestamp {
            color: var(--text-secondary);
            font-size: 0.8rem;
          }
          
          .content {
            color: var(--text-primary);
            word-wrap: break-word;
            font-weight: 400;
            font-size: 0.9375rem;
          }
          
          .bot-tag {
            background: #5865f2;
            color: white;
            padding: 0 4px;
            border-radius: 3px;
            font-size: 0.7rem;
            margin-left: 4px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="channel-name">${channelName}</h1>
          <div class="message-count">${messages.length} messages</div>
        </div>
        <div class="messages">
          ${messages
            .map(
              (msg) => `
            <div class="message">
              <div class="message-header">
                <span class="author">${msg.author.username}</span>
                ${msg.author.bot ? '<span class="bot-tag">BOT</span>' : ""}
                <span class="timestamp">${new Date(msg.createdTimestamp).toLocaleString()}</span>
              </div>
              <div class="content">${msg.content}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </body>
      </html>
    `
  
    return transcriptHTML
  }
  
  module.exports = { generateTranscript }
  
  