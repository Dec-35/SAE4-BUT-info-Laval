import express from 'express';
import fs from 'fs';
import ICAL from 'ical.js';
const router = express.Router();
import {
  fromURL,
  generateEventId,
  checkAndAddEventToDatabase,
  pool,
} from '../server.js';

function cleanStringToObject(inputString) {
  // Extract content within <span> tags
  const spanContent = inputString.match(/<span>(.*?)<\/span>/)[1];

  // Split content based on curly braces {} to separate key-value pairs
  const keyValuePairs = spanContent.split(/\s*},\s*/);

  // Remove empty strings and trim whitespace from each key-value pair
  const cleanedObject = {};
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair
      .replace(/[{}]/g, '')
      .split(':')
      .map((part) => part.trim());
    if (key && value) {
      cleanedObject[key] = value;
    }
  });

  return cleanedObject;
}

router.get('', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.redirect('/login?returnUrl=/pay');
    return;
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    res.render('payment', {
      paypalClientId: process.env.PAYPAL_CLIENT_ID,
      cart: [],
      cartSize: 0,
      isLoggedIn: req.session.isLoggedIn,
    });
    return;
  }

  try {
    //fetch the bde events onto the database
    const data = fs.readFileSync('./public/ical/basic.ics', 'utf8');

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
    }

    //create the id for each event

    //for debuging pruposes
    const debugEventTitles = [];
    const promises = [];

    events.forEach(async (event) => {
      let id = generateEventId(event.start, event.summary);

      if (event.description === undefined) return;
      console.log(event)
      var eventDescription = cleanStringToObject(event.description);
      event.price = parseFloat(eventDescription['prix']);
      event.description = eventDescription['description'];
      event.image = eventDescription['image'];

      //check if the event is already in the database
      promises.push(checkAndAddEventToDatabase(id, event));
      debugEventTitles.push(event.summary + ' having id of ' + id);
    });
    await Promise.all(promises);

    //get the items from the cart and check if they are events or grades
    let itemsToSend = [];

    Promise.all(
      req.session.cart.map(async (item) => {
        if (item.type === 'grade') {
          //check if the user already has the grade
          const [userGradeResults] = await pool.query(
            'SELECT * FROM user WHERE email = ? AND grade = ?',
            [req.session.email, item.id],
            (err) => {
              if (err) {
                console.error('Impossible de récupérer les grades :', err);
                return false;
              }
            }
          );

          if (userGradeResults.length === 0) {
            //delete the item from the cart
            itemsToSend.push(item);
          }
        } else if (item.type === 'event') {
          //check if the user is already registered to the event
          const [inscriptionResults] = await pool.query(
            'SELECT * FROM inscription WHERE user = ? AND event_id = ?',
            [req.session.email, item.id],
            (err) => {
              if (err) {
                console.error(
                  'Impossible de récupérer les inscriptions :',
                  err
                );
                return false;
              }
            }
          );

          if (inscriptionResults.length === 0) {
            //delete the item from the cart
            itemsToSend.push(item);
          }
        } else if (item.type === 'product') {
          //delete the item from the cart
          const [productResults] = await pool.query(
            'SELECT * FROM product WHERE id = ?',
            [item.id],
            (err) => {
              if (err) {
                console.error('Impossible de récupérer les produits :', err);
                return false;
              }
            }
          );

          if (productResults.length === 0) {
            res.status(404).json({error: 'Impossible de trouver le produit'});
            return;
          } else {
            itemsToSend.push(item);
          }
        }
      })
    ).then(() => {
      req.session.cart = itemsToSend;
      // Effectuer le rendu ici, à l'intérieur de la condition
      res.render('payment', {
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        cartSize: itemsToSend && itemsToSend.length,
        isLoggedIn: req.session.isLoggedIn,
        category: req.session.category,
        cart: itemsToSend,
      });
    });
  } catch (err) {
    console.error('Error rendering index:', err);
    res.status(500).send('Internal Server Error');
  }
});
export default router;
