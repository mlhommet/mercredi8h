// twilio-service.js
const twilio = require('twilio');
const config = require('./config_env');

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendNotification = (userPhoneNumber, enfant, date) => {
    return client.messages
        .create({
            contentSid: config.twilio.reservationContentSid,
            contentVariables: JSON.stringify({ enfant, date }),
            from: config.twilio.whatsappNumber,
            to: userPhoneNumber,
        })
        .then(message => console.log(`Message sent: ${message.sid}`))
        .catch(error => console.error(`Failed to send message: ${error.message}`));
};

module.exports = {
    sendNotification,
};
