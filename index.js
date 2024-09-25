// index.js
const puppeteer = require('puppeteer');
const config = require('./config_env');
const { loadData } = require('./reservations-service');
const { checkReservations } = require('./scrapper');

(async () => {
    const loginUrl = 'https://www.espace-citoyens.net/maisons-alfort/espace-citoyens/Home/AccueilPublic';
    const data = loadData();

    const browser = await puppeteer.launch(config.puppeteer);
    const page = await browser.newPage();

    try {
        await page.goto(loginUrl);
        await page.type('input#username', data.user.login);
        await page.type('input#password', data.user.password);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Extract reservation URLs from the main page
        const reservationUrls = await page.$$eval('#tblDalleDetail_Reservation tr', rows => {
            return rows.map(row => row.querySelector('a')?.href).filter(url => url);
        });

        for (const url of reservationUrls) {
            await checkReservations(page, url);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();
