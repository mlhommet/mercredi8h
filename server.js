// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { sendNotification } = require('./twilio-service');
const { loadData } = require('./reservations-service');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Webhook to handle incoming WhatsApp messages
app.post('/whatsapp-webhook', (req, res) => {
    const incomingMessage = req.body.Body.toLowerCase().trim();
    const fromNumber = req.body.From;
    const data = loadData();

    const foundReservation = data.reservations.find(res => res.name.toLowerCase() === incomingMessage);

    if (foundReservation) {
        const message = `Reservation for ${foundReservation.name} on ${foundReservation.date}. Status: ${foundReservation.status}`;
        sendNotification(fromNumber, foundReservation.name, foundReservation.date);
    } else {
        sendNotification(fromNumber, 'Unknown', 'We couldn\'t find any reservation.');
    }

    res.send('<Response></Response>');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
