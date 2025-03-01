const logger = require('./logger');
const credentials = require('../../credentials.json');

let access_token = '';
let expiry = new Date(Date.now() - 120 * 1000);

function isTokenExpired() {
    const currentTime = new Date();
    if (expiry < currentTime) {
        return true;
    } else {
        logger.info('Google API access token expired. Refreshing token.');
        console.log('Google API access token expired. Refreshing token.');
        return false;
    }
}

async function refreshAccessToken() {
    if (isTokenExpired()) {
        const payload = {
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            refresh_token: credentials.refreshToken,
            grant_type: 'refresh_token',
        };

        const response = await fetch(credentials.tokenUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload),
        });

        if (response.ok) {
            const responseJson = await response.json();
            access_token = responseJson.access_token;
            const expiry_in = responseJson.expires_in;
            expiry = new Date(Date.now() + (expiry_in - 180) * 1000);
        } else {
            logger.error('Failed to refresh access token');
            console.error('Failed to refresh access token');
        }
    }
}

async function sendEmail( to, otp) {
    await refreshAccessToken();
    const sender = 'leagueops@nodwin.com';
    const subject = `OTP for Discord Verification`;
    const message = `Your OTP for Discord Verification is: ${otp}`;

    const messageBytes = `From: ${sender}\nTo: ${to}\nSubject: ${subject}\n\n${message}`;
    const encodedMessage = Buffer.from(messageBytes).toString('base64url');

    const payload = {
        raw: encodedMessage,
    };

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        logger.info(`Mail successfully sent to: ${to}, Subject: ${subject}, Message: ${message}`);
    } else {
        logger.error(`Error sending email to: ${to}`);
    }
}

module.exports = sendEmail;