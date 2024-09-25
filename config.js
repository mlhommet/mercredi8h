// config.js
module.exports = {
    twilio: {
        accountSid: 'your_account_sid',
        authToken: 'your_auth_token',
        whatsappNumber: 'twilio_whatsapp_number',
        reservationContentSid: 'twilio_content_sid'
    },
    puppeteer: {
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Path to Chrome on macOS
        headless: false,  // Change to true for headless mode
    },
    storagePath: './storage.json',  // Path to storage
};
