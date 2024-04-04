import express from 'express';
import {createPool} from 'mysql2';
import {json} from 'express';

import session from 'express-session';

import {readFileSync, readdirSync} from 'fs';

import https from 'https';
import http from 'http';

import dotenv from 'dotenv';
dotenv.config();
import {fromURL} from 'node-ical';
import { Server } from 'socket.io';

const pool = createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
}).promise();
export {pool};

const app = express();

let ironprice;
let goldprice;
let diamantprice;

import Banner from './Banner.js';
var banner = new Banner();
export {banner};

app.set('view engine', 'ejs');

app.use(json());
app.use(express.static('public'));

const sessionMiddleWare = session({
  secret: 'fgjfhebjcjksdvd54657654676', 
  resave: false, 
  saveUninitialized: true, 

  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // Définissez la durée de vie du cookie de session
  },
})
app.use(
  sessionMiddleWare
);

let passcodes = {};
let enteredPasscodes = {};

let forgotten_passcodes = {};
let forgotten_enteredPasscodes = {};

export {
  passcodes,
  enteredPasscodes,
  forgotten_passcodes,
  forgotten_enteredPasscodes,
};

//test if db link is working
try {
  await pool.query('SELECT 1');
  console.log('Database connected');
} catch (err) {
  console.error('Database not connected');
  console.error(err);
  process.exit(1);
}

//GET SECTION BELOW
//res.render section
import homepage from './router/accueil.js';
app.use('/', homepage);

import admin from './router/admin.js';
app.use('/admin', admin);

import login from './router/login.js';
app.use('/login', login);

import calendar from './router/calendar.js';
app.use('/calendar', calendar);

import account from './router/account.js';
app.use('/account', account);

import changelogs from './router/changelogs.js';
app.use('/changelogs', changelogs);

import pay from './router/pay.js';
app.use('/pay', pay);

import forgottenPassword from './router/forgottenPassword.js';
app.use('/account/forgottenPass', forgottenPassword);

import ndli from './router/nuitdelinfo.js';
app.use('/ndli', ndli);

import shop from './router/shop.js';
app.use('/shop', shop);

import product from './router/product.js';
app.use('/shop/product', product);

app.get('/legal', (req, res) => {
  res.render('legal');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/faq', (req, res) => {
  res.render('faq');
});

app.get('/discord-verif', async (req, res) => {
  res.redirect('/account');
});

app.get('/changelogs', async (req, res) => {
  res.render('changelogsMenu');
});

app.get('/leaderboard', async (req, res) => {
  res.render('leaderboard', {
    cartSize: req.session.cart && req.session.cart.length,
    isLoggedIn: req.session.isLoggedIn,
  });
});

app.get('/', (req, res) => {
  res.render('index');
});

//functions stuff

function getVersion() {
  const changelogs = readdirSync('./public/changelogs', 'utf-8');

  var changelogsArray = [];

  //fill the array with all the changelogs files names without the .txt extension
  changelogs.forEach((changelog) => {
    changelogsArray.push(changelog.substring(0, changelog.length - 4));
  });

  return changelogsArray[changelogsArray.length - 1];
}

async function getGradePrices() {
  // Récupérer les prix des catégories de la base de données (table grade)
  const gradesQuery = 'SELECT * FROM grade';
  const [gradesResults] = await pool.query(gradesQuery);

  ironprice = gradesResults[0].price;
  goldprice = gradesResults[1].price;
  diamantprice = gradesResults[2].price;
}

async function getUserGrade(email) {
  const [gradeResults] = await pool.query(
    'SELECT grade FROM user WHERE user.email = ?',
    [email],
    (err) => {
      if (err) {
        return null;
      }
    }
  );

  if (gradeResults.length === 0) {
    var grade = 'None';
  } else var grade = gradeResults['0'].grade;
  return grade;
}

async function getPodium(req) {
  var podiumResults;
  [podiumResults] = await pool.query(
    'SELECT username, xp FROM user WHERE username != ? ORDER BY xp DESC LIMIT 3',
    ['admin']
  );

  while (podiumResults.length < 3) {
    podiumResults.push({username: 'Anonyme', xp: 0});
  }

  req.session.podium = podiumResults;
}

function djb2Hash(s) {
  let hashValue = 5381;
  for (let i = 0; i < s.length; i++) {
    hashValue = (hashValue << 5) + hashValue + s.charCodeAt(i);
  }
  return hashValue >> 0; // Convert to a 32-bit signed integer
}

function getFormattedDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateEventId(startDate, title) {
  const formattedDate = getFormattedDate(startDate);
  const uniqueString = formattedDate + title;
  const hashedValue = djb2Hash(uniqueString);

  const maxInt32 = 2147483647;
  return Math.abs(hashedValue) % (maxInt32 + 1);
}

async function checkAndAddEventToDatabase(id, event) {
  const [eventExists] = await pool.query(
    'SELECT * FROM event WHERE id = ?',
    [id],
    async (err) => {
      if (err) {
        console.error('Impossible de récupérer les events :', err);
        return;
      }
    }
  );

  if (eventExists.length === 0) {
    const date = new Date(event.start);
    const sqlDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
    console.log(
      'Adding this event to the events table:' +
        [id, event.summary, event.price, sqlDateTime]
    );
    //add the event to the database
    await pool.query(
      'INSERT INTO event (id, name, price, date, image) VALUES (?, ?, ?, ?, ?)',
      [id, event.summary, event.price, sqlDateTime, event.image],
      (err) => {
        if (err) {
          console.error('Impossible to add an event :', err);
          return;
        } else {
          console.log('Event ' + event.summary + ' added to database');
        }
      }
    );
  } else if (eventExists[0].price !== event.price) {
    //it already exists but the price is different
    await pool.query(
      'UPDATE event SET price = ? WHERE id = ?',
      [event.price, id],
      (err) => {
        if (err) {
          console.error('Impossible to update an event :', err);
          return;
        } else {
          console.log('Event ' + event.summary + ' updated in database');
        }
      }
    );
  }
}

// ENDPOINTS SECTION BELOW
//functions stuff

async function addUserToEventWithXp(
  email,
  item,
  xpAmount,
  transaction_id,
  req
) {
  /**
   * Adds the user to the event or gives them a grade base on the item they bought.
   *
   * @param {String} email - The user's email
   * @param {type : String, id : int, name : String, price : Float} item - The event to add the user to
   * @param {int} xpAmount - The amount of xp to add to the user
   * @param {String} transaction_id - The transaction id link to the purchase
   * @param {Request} req - The request object
   *
   * @returns {Boolean} - True if the user was added to the event / grade, false otherwise
   */

  const type = item.type;
  const itemId = item.id;
  const name = item.name;
  const price = item.price;

  if (type === 'grade') {
    console.log(
      'Paiement valide. Ajout du grade ' +
        name +
        ' a l utilisateur ' +
        email +
        '.'
    );

    // Update the user's grade
    await pool.query('UPDATE user SET grade = ? WHERE email = ?', [
      itemId,
      email,
    ]);

    //add a transaction content line to the database referencing the transaction_id
    await pool.query(
      'INSERT INTO transactionContent (transaction_id, grade_id, item_name, item_price) VALUES (?, ?, ?, ?)',
      [transaction_id, itemId, name, price],
      (err) => {
        if (err) {
          console.error(
            'Impossible d ajouter le contenu de la transaction :',
            err
          );
          return;
        }
      }
    );
  } else if (type === 'event') {
    //check if the user is already registered to the event
    console.log(
      'Paiement valide. Ajout de l utilisateur ' +
        email +
        ' a l evenement ' +
        name +
        '.'
    );
    const [inscriptionResults] = await pool.query(
      'SELECT name FROM inscription JOIN event ON inscription.event_id = event.id WHERE user = ? AND event_id = ?',
      [email, itemId],
      (err) => {
        if (err) {
          console.error('Impossible de récupérer les inscriptions :', err);

          return false;
        }
      }
    );

    if (inscriptionResults.length !== 0) {
      console.error('L utilisateur est deja inscrit a l evenement');
      return false;
    }

    await pool.query(
      'INSERT INTO inscription (user, event_id) VALUES (?, ?)',
      [email, itemId],
      (err) => {
        if (err) {
          console.error("Impossible de créer l'inscription :", err);
          return false;
        }
      }
    );

    //add a transaction content line to the database referencing the transaction_id
    await pool.query(
      'INSERT INTO transactionContent (transaction_id, event_id, item_name, item_price) VALUES (?, ?, ?, ?)',
      [transaction_id, itemId, name, price],
      (err) => {
        if (err) {
          console.error(
            'Impossible d ajouter le contenu de la transaction :',
            err
          );
          return;
        }
      }
    );
  } else if (type === 'product') {
    //add a transaction content line to the database referencing the transaction_id
    await pool.query(
      'INSERT INTO transactionContent (transaction_id, product_id, item_name, item_price) VALUES (?, ?, ?, ?)',
      [transaction_id, itemId, name, price],
      (err) => {
        if (err) {
          console.error(
            'Impossible d ajouter le contenu de la transaction :',
            err
          );
          return;
        }
      }
    );
  }
  //add xp to the user
  console.log(
    `Ajout de ${xpAmount} xp a l utilisateur ${email} pour l'item ${name}.`
  );
  await pool.query('UPDATE user SET xp = xp + ? WHERE email = ?', [
    xpAmount,
    email,
  ]);

  if (req.session.isLoggedIn && req.session.email === email) {
    req.session.xp += parseInt(xpAmount);

    if (req.session.xp >= process.env.XP_THRESHOLD) {
      //check if the user already is in the list of users to renew

      const [usersToRenewResults] = await pool.query(
        'SELECT * FROM usersToRenew WHERE user = ?',
        [email]
      );

      if (usersToRenewResults.length === 0) {
        //add the user and the grade to the usersToRenew table
        console.log('Adding user the users to renew list');
        console.log(req.session.grade);
        const [gradeResults] = await pool.query(
          'SELECT id FROM grade WHERE name = ?',
          [req.session.grade]
        );
        const gradeId = gradeResults['0'].id;

        await pool.query(
          'INSERT INTO usersToRenew (user, grade) VALUES (?, ?)',
          [email, gradeId]
        );
      }
    }
  }

  //add a transaction content line to the database referencing the transaction_id

  return true;
}

async function deleteItemFromCart(req, item) {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const itemIndex = req.session.cart.findIndex(
    (cartItem) =>
      (cartItem.id.toString() === item.id.toString() &&
        cartItem.type === item.type) ||
      (cartItem.id === item.id && cartItem.type === item.type)
  );

  if (itemIndex !== -1) {
    req.session.cart.splice(itemIndex, 1);
  }
}

async function sendEmail(reciever, subject, passcode, reason) {
  //fonction pour envoyer un mail de vérification
  //a été remplacé par un simple console log pour raison de simplicité

  console.log(
    'Envoi du mail de vérification à ' +
      reciever +
      ' pour la raison ' +
      reason +
      ' avec le code ' +
      passcode
  );

  //TODO
}

async function setSessionItems(req, username, category, email, xp, grade) {
  req.session.isLoggedIn = true;
  req.session.username = username;
  req.session.category = category;
  req.session.email = email;
  req.session.xp = xp;
  req.session.discordUsername = null;
  req.session.grade = grade;
}

// '/user/'

import leaderboard from './api/user/leaderboard.js';
app.use('/api/user/leaderboard', leaderboard);

import getCartItems from './api/user/getCartItems.js';
app.use('/api/user/getCartItems', getCartItems);

import getEvents from './api/user/getAgenda.js';
app.use('/api/user/getAgenda', getEvents);

import getEventsUser from './api/user/getEventsUser.js';
app.use('/api/user/getEventsUser', getEventsUser);

import getPodiumPfps from './api/user/getPodiumPfps.js';
app.use('/api/user/getPodiumPfps', getPodiumPfps);

import changeClass from './api/user/changeClass.js';
app.use('/api/user/changeClass', changeClass);

import unsubscribe from './api/user/unsubscribe.js';
app.use('/api/user/unsubscribe', unsubscribe);

// '/help/'

import forgottenPass from './api/account/forgottenPassword.js';
app.use('/api/help/forgottenPassword', forgottenPass);

import verifyPasscode from './api/account/verifyPasscode.js';
app.use('/api/help/verifyPasscode', verifyPasscode);

import changePassword from './api/account/changePassword.js';
app.use('/api/help/changePassword', changePassword);

// '/payment/'

import freeCheckout from './api/payment/checkout.js';
app.use('/api/payment/checkout', freeCheckout);

// '/account/'

import verifyEmail from './api/account/verifyEmail.js';
app.use('/api/account/verifyEmail', verifyEmail);

import register from './api/account/register.js';
app.use('/api/account/register', register);

import nonInfoRegister from './api/account/nonInfoRegister.js';
app.use('/api/account/nonInfoRegister', nonInfoRegister);

import loginPort from './api/account/login.js';
app.use('/api/account/login', loginPort);

import checkPassCode from './api/account/checkPassCode.js';
app.use('/api/account/checkPasscode', checkPassCode);

// '/admin/'

import changeBanner from './api/admin/changeBanner.js';
app.use('/api/admin/changeBanner', changeBanner);

import changeXpThreshold from './api/admin/changeXpThreshold.js';
app.use('/api/admin/changeXpThreshold', changeXpThreshold);

import changeXpAmount from './api/admin/updateXp.js';
app.use('/api/admin/changeXpAmount', changeXpAmount);

import adminSQL from './api/admin/sqlRequests.js';
app.use('/api/admin/sql', adminSQL);

import changeGradePrices from './api/admin/changeGradesPrices.js';
app.use('/api/admin/changeGradePrices', changeGradePrices);

import getEventsAdmin from './api/admin/getEvents.js';
app.use('/api/admin/getEvents', getEventsAdmin);

import getGradesSales from './api/admin/getGradesSales.js';
app.use('/api/admin/getGradesSales', getGradesSales);

import updateGrades from './api/admin/updateGrades.js';
app.use('/api/admin/updateGrades', updateGrades);

import removeUser from './api/admin/removeUser.js';
app.use('/api/admin/removeUser', removeUser);

import addUser from './api/admin/addUser.js';
app.use('/api/admin/addUser', addUser);

import searchUser from './api/admin/searchUser.js';
app.use('/api/admin/searchUser', searchUser);

import addProduct from './api/admin/addProduct.js';
app.use('/api/admin/product/add', addProduct);

import editProduct from './api/admin/editProduct.js';
app.use('/api/admin/product/edit', editProduct);

import getProducts from './api/admin/getProducts.js';
app.use('/api/admin/products', getProducts);

import addProductBuyer from './api/admin/addProductBuyer.js';
app.use('/api/admin/products/addBuyer', addProductBuyer);

// '/discord/'

import getDiscordInfos from './api/discord/getDiscordInfos.js';
app.use('/api/discord/getDiscordInfos', getDiscordInfos);

import setDiscordInfos from './api/discord/setDiscordInfos.js';
app.use('/api/discord/setDiscordInfos', setDiscordInfos);

//random API endpoints

import getBannerInfo from './api/divers/getBannerInfo.js';
app.use('/api/getBannerInfo', getBannerInfo);

import getNdliTeams from './api/divers/getNdliTeams.js';
app.use('/api/ndli/getTeams', getNdliTeams);

import getNdliRoom from './api/divers/getNdliRoom.js';
app.use('/api/ndli/getRoom', getNdliRoom);

//native app.posts (non api)

import getImageLink from './api/divers/getImageLink.js';
app.use('/getImageLinkPort', getImageLink);

app.get('/api/changelogs/:version', (req, res) => {
  const version = req.params.version;

  const changelog = readFileSync(`./public/changelogs/${version}.txt`, 'utf-8');
  const changelogArray = changelog.split('\n');

  res.json({changelogArray});
});

app.get('/api/getChangelogs', (req, res) => {
  const changelogs = readdirSync('./public/changelogs', 'utf-8');

  var changelogsArray = [];

  //fill the array with all the changelogs files names without the .txt extension
  changelogs.forEach((changelog) => {
    changelogsArray.push(changelog.substring(0, changelog.length - 4));
  });

  res.json({changelogsArray});
});

app.post('/removeItemFromCartPort', async (req, res) => {
  var {id} = req.body;
  if (id === 'all') {
    req.session.cart = [];
    res.status(200).json({success: true, message: 'Cart cleared'});
    return;
  }

  await deleteItemFromCart(req, id);
  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    cartSize: req.session.cart.length,
  });
});

app.post('/addItemToCartPort', (req, res) => {
  const {id, size} = req.body;
  //get item type from header
  const type = req.headers['item-type'];

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const item = req.session.cart.find((item) => item.id === id);

  if (!item) {
    if (size !== undefined && size !== null && type === 'product') {
      req.session.cart.push({type: type, id: id, size: size}); // add the item to the cart if it doesn't exist yet
    } else req.session.cart.push({type: type, id: id}); // add the item to the cart if it doesn't exist yet
  } else {
    res
      .status(409)
      .json({success: false, message: 'Item déjà dans votre panier'});
    return;
  }

  res.status(200).json({success: true, message: 'Item added to cart'});
});

app.get('/api/account/logout', (req, res) => {
  // Clear session variables and destroy the session
  req.session.destroy();
  res.redirect('/');
});

app.post('/loginStatus', (req, res) => {
  res.json({isLoggedIn: !!req.session.isLoggedIn});
});

app.get('*', function (req, res) {
  res.status(404).render('404page');
});

//api stuff
//post
export {
  addUserToEventWithXp,
  deleteItemFromCart,
  sendEmail,
  setSessionItems,
  getVersion,
};

//get
export {
  fromURL,
  getUserGrade,
  getGradePrices,
  getPodium,
  ironprice,
  goldprice,
  diamantprice,
  generateEventId,
  checkAndAddEventToDatabase,
  readdirSync,
  readFileSync,
};

import fs from 'fs';

const PORT = process.env.PORT || 443;
let server = https
  .createServer(
    {
      key: fs.readFileSync('server-key.pem'),
      cert: fs.readFileSync('server-cert.pem'),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });


//Socket.io stuff
const io = new Server(server);

io.engine.use(sessionMiddleWare);
io.on('connection', (socket) => {
  socket.on("sendMsg", (msg) => {
    socket.broadcast.emit("msgReceived", msg);
  })
});

export default app;
