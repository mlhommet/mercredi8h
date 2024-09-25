// reservations-service.js
const fs = require('fs');
const config = require('./config');

const loadData = () => {
    if (fs.existsSync(config.storagePath)) {
        const rawData = fs.readFileSync(config.storagePath);
        // return JSON.parse(rawData); // uncomment for production
        const user = JSON.parse(rawData).user; // comment for production
        return { user, reservations: [] }; //  comment for production
    }
    return { user: {}, reservations: [] }; // Default structure if file doesn't exist
};

const saveData = (data) => {
    fs.writeFileSync(config.storagePath, JSON.stringify(data, null, 2));
};

const findNewReservations = (existingReservations, newReservations) => {
    return newReservations.filter(reservation => {
        return !existingReservations.some(stored =>
            stored.date === reservation.date && stored.name === reservation.name
        );
    });
};

module.exports = {
    loadData,
    saveData,
    findNewReservations,
};
