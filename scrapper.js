//scraper.js
const puppeteer = require('puppeteer');
const config = require('./config');
const { loadData, saveData, findNewReservations } = require('./reservations-service');
const { sendNotification } = require('./twilio-service');

const checkReservations = async (page, demarcheURL) => {
    const data = loadData();

    await page.goto(demarcheURL);
    await page.click('#lnkCommencerDemarche');  // Adjust to your site's selector

    const childName = await page.$eval('#hInfosDem', element => {
        const infoText = element.textContent.trim();
        const nameMatch = infoText.match(/^([^ -]*)/);
        return nameMatch ? nameMatch[0] : null;
    });

    const newReservations = await page.$$eval('div.case_calendrier', (elements, childName) => {
        return elements.map(element => {
            const daySpan = element.querySelector('p.numerojour span.visible-phone');
            const dateSpan = element.querySelector('p.numerojour span:not(.visible-phone)');
            const dayInitial = daySpan ? daySpan.textContent.charAt(0).toUpperCase() : '';
            const date = dateSpan ? dateSpan.textContent.trim() : '';

            const reserved = element.querySelectorAll('input[type="checkbox"]:checked').length > 0;
            const status = reserved ? 'reservé' : 'ouvert';

            const idJour = element.getAttribute('id');
            const year = idJour.slice(0, 4);

            return {
                name: childName,
                date: `${dayInitial} - ${date}/${year}`,
                status,
            };
        });
    }, childName);

    const newEntries = findNewReservations(data.reservations, newReservations);

    if (newEntries.length > 0) {
        newEntries.filter(res => res.status !== 'reservé').forEach(entry => {
            sendNotification(data.user.phoneNumber, entry.name, entry.date);
            entry.status = 'new';
        });

        data.reservations = [...data.reservations, ...newEntries];
        saveData(data);
    }
};

module.exports = {
    checkReservations,
};
