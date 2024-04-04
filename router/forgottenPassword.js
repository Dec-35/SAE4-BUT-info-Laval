import express from 'express';
const router = express.Router();
import {forgotten_passcodes, forgotten_enteredPasscodes} from '../server.js';

router.get('', async (req, res) => {
  let step = 1;
  const email = req.session.email;

  if (email) {
    if (forgotten_passcodes[email]) {
      step = 2;

      if (
        forgotten_enteredPasscodes[email] &&
        forgotten_enteredPasscodes[email] === forgotten_passcodes[email]
      ) {
        step = 3;
        res.render('forgottenPass', {
          step,
          cartSize: req.session.cart && req.session.cart.length,
          isLoggedIn: req.session.isLoggedIn,
          passcode: forgotten_passcodes[email],
        });
        return;
      }
    }
  }

  res.render('forgottenPass', {
    step,
    cartSize: req.session.cart && req.session.cart.length,
    isLoggedIn: req.session.isLoggedIn,
    category: req.session.category,
    passcode: 0,
  });
});
export default router;
