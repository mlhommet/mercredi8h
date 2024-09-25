const puppeteer = require('puppeteer');
const fs = require('fs');
const accountSid = '***'; // Your Account SID
const authToken = '***';   // Your Auth Token
const client = require('twilio')(accountSid, authToken);

// Function to load previous reservations
const loadData = () => {
    if (fs.existsSync('storage.json')) {
        const rawData = fs.readFileSync('storage.json');
        return JSON.parse(rawData);
    }
    return { user: {}, reservations: [] }; // Default structure if file doesn't exist
};

// Function to save updated reservations
const saveData = (data) => {
    fs.writeFileSync('storage.json', JSON.stringify(data, null, 2));
};

const sendNotification = (userPhoneNumber, enfant, date) => {
    client.messages
        .create({
            contentSid: "***",
            contentVariables: JSON.stringify({ enfant: enfant, date: date }),
            from: 'whatsapp:+***', // Twilio WhatsApp number
            to: userPhoneNumber
        })
        .then(message => console.log(`Message sent: ${message.body}`))
        .catch(error => console.error(`Failed to send message: ${error.message}`));
};

// Function to simulate notification (for testing)
const fakeNotification = (userPhoneNumber, messageBody) => {
    console.log(messageBody);
};

// Reservation-checking function
const checkReservations = async (page, demarcheURL) => {
    // Load previous reservations from storage.json
    const data = loadData();

    try {
        // Step 1: Go to the reservation page
        await page.goto(demarcheURL);
        await page.locator('#lnkCommencerDemarche').click();

        // Step 2: Extract child name and reservation information
        const childName = await page.$eval('#hInfosDem', element => {
            const infoText = element.textContent.trim();
            const nameMatch = infoText.match(/^([^ -]*)/); // Extract name before " - "
            return nameMatch ? nameMatch[0] : null;
        });

        if (!childName) {
            console.error('Child name could not be found.');
            return;
        } else {
            console.log("Child name found:", childName);
        }

        // Step 3: Extract reservation information
        const newReservations = await page.$$eval('div.case_calendrier', (elements, childName) => {
            return elements.map(element => {
                const daySpan = element.querySelector('p.numerojour span.visible-phone');
                const dateSpan = element.querySelector('p.numerojour span:not(.visible-phone)');

                if (!daySpan || !dateSpan) return null;

                const day = daySpan.textContent.trim();
                const date = dateSpan.textContent.trim();
                const idJour = element.getAttribute('id');
                const dayInitial = day.charAt(0).toUpperCase();

                let status = 'ouvert';
                const reservedElements = element.querySelectorAll('input[type="checkbox"]:checked');
                if (reservedElements.length > 0) {
                    status = 'reservé';
                }

                const year = idJour.slice(0, 4);
                return {
                    name: childName,
                    date: `${dayInitial} - ${date}/${year}`,
                    status
                };
            }).filter(item => item !== null);
        }, childName); // Pass childName to the browser context

        // Step 4: Compare new reservations with previous ones
        const newEntries = newReservations.filter(reservation => {
            return !data.reservations.some(stored => stored.date === reservation.date && stored.name === reservation.name);
        });

        if (newEntries.length > 0) {
            console.log('New reservations found:', newEntries);

            // Step 5: Notify user via SMS for new reservations that are not already reserved
            newEntries.filter(reservation => reservation.status !== 'reservé').forEach(entry => {
                const messageBody = `New reservation for: ${entry.name} on ${entry.date} - Status: ${entry.status}`;
                // fakeNotification(data.user.phoneNumber, messageBody);
                sendNotification(data.user.phoneNumber, entry.name, entry.date);
                entry.status = 'new'
            });

            // Step 6: Update and save new reservations to storage
            data.reservations = [...data.reservations, ...newEntries];
            saveData(data);
        } else {
            console.log('No new reservations.');
        }

    } catch (error) {
        console.error('Error during reservation checking:', error);
    }
};

// Main Script
(async () => {
    const loginUrl = 'https://www.espace-citoyens.net/maisons-alfort/espace-citoyens/Home/AccueilPublic';

    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: false, // Change to true for headless mode
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Path to Chrome on macOS
    });

    const page = await browser.newPage();
    const data = loadData();

    try {
        // Step 1: Log in to the website
        await page.goto(loginUrl);
        await page.waitForSelector('input#username'); // Wait for the login input field to load
        await page.type('input#username', data.user.login); // Input the username (adjust the selector if necessary)
        await page.type('input#password', data.user.password); // Input the password (adjust the selector if necessary)
        await page.keyboard.press('Enter'); // Submit by simulating Enter key
        await page.waitForNavigation({ waitUntil: 'networkidle0' }); // Wait for the page to fully load

        // Step 2: Call the reservation-checking function
        //Retrieve the reservation pages

        // Step 2: Extract reservation URLs
        const reservationUrls = await page.$$eval('#tblDalleDetail_Reservation tr', rows => {
            return rows.map(row => {
                const link = row.querySelector('a');
                return link ? link.href : null;
            }).filter(url => url !== null); // Filter out null values (if any row doesn't have a link)
        });

        for (const reservationURL of reservationUrls) {
            await checkReservations(page, reservationURL);
        }

    } catch (error) {
        console.error('Error during automation:', error);
    } finally {
        await browser.close();
    }
})();

