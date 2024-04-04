import express, {json} from 'express';
import ICAL from 'ical.js';
import fs from 'fs';
const router = express.Router();
import {
  fromURL,
  getUserGrade,
  getGradePrices,
  getPodium,
  ironprice,
  goldprice,
  diamantprice,
  getVersion,
} from '../server.js';

function getHomeImages() {
  //get all images from public/images/home
  const homeImages = fs.readdirSync('./public/images/home');
  //remove all files that don't have .jpg / .jpeg or .png extension
  homeImages.forEach((element, index) => {
    if (
      !element.endsWith('.jpg') &&
      !element.endsWith('.jpeg') &&
      !element.endsWith('.png') &&
      !element.endsWith('.webp') &&
      !element.endsWith('.JPG')
    ) {
      homeImages.splice(index, 1);
    }
  });

  return homeImages;
}

router.get('', async (req, res) => {
  try {
    const data = fs.readFileSync('./public/ical/basic.ics', 'utf8');
    if (!ironprice || !goldprice || !diamantprice) {
      await getGradePrices();
    }

    await getPodium(req);

    const userGrade = await getUserGrade(req.session.email);
    req.session.grade = userGrade;

    if (req.session.isLoggedIn) {
      console.log('User ' + req.session.email + ' is logged in');
    }

    const version = getVersion();
    const homeImages = getHomeImages();

    const jcalData = ICAL.parse(data);
    // Assuming the main component is a VCALENDAR
    const comp = new ICAL.Component(jcalData);
    // Extract all VEVENT components from the VCALENDAR
    const jCal = comp.jCal;
    const vevents = jCal[2][0][1];

    var events = [];

    if (vevents.length > 0) {
      events = [vevents].map((vevent) => {
        return {
          summary: vevent.find((x) => x[0] === 'summary')[3],
          start: new Date(vevent.find((x) => x[0] === 'dtstart')[3]),
          end: new Date(vevent.find((x) => x[0] === 'dtend')[3]),
          description: vevent.find((x) => x[0] === 'description')[3],
          location: vevent.find((x) => x[0] === 'location')[3],
          // Add other properties as needed
        };
      });
    } else {
      console.log('No VEVENT components found in the VCALENDAR.');
      res.status(500).send('No VEVENT components found in the VCALENDAR.');
      return;
    }
    res.render('index', {
      username: req.session.username,
      cartSize: req.session.cart && req.session.cart.length,
      isLoggedIn: req.session.isLoggedIn,
      category: req.session.category,
      events: events,
      ironprice: ironprice,
      goldprice: goldprice,
      diamantprice: diamantprice,
      grade: userGrade,
      podium: req.session.podium,
      version,
      homeImages,
    });
    return;
  } catch (err) {
    console.error('Error fetching iCal data (from google cal)');
    console.error('Error rendering index:', err);
    res
      .status(500)
      .send(
        'Internal Server Error : the server encountered an error trying to read the provided google calendar file.'
      );
    return;
  }
});
export default router;
