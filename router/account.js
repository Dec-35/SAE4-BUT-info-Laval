import express from 'express';
const router = express.Router();
import {
  getGradePrices,
  ironprice,
  goldprice,
  diamantprice,
  pool,
} from '../server.js';

router.get('', async (req, res) => {
  if (!req.session.isLoggedIn) {
    res.redirect('/login');
    return;
  }

  //get the user's grade
  const [gradeResults] = await pool.query(
    'SELECT grade FROM user WHERE user.email = ?',
    [req.session.email],
    (err) => {
      if (err) {
        console.error('Impossible de récupérer le grade :', err);
        res.status(500).json({error: 'Impossible de récupérer le grade'});
        return;
      }
    }
  );

  if (!ironprice || !goldprice || !diamantprice) {
    await getGradePrices();
  }

  if (gradeResults.length === 0) {
    var grade = 'None';
  } else var grade = gradeResults['0'].grade;
  req.session.grade = grade;

  // Determine if the user is an admin
  const isAdmin = req.session.category === 'admin';

  res.render('account', {
    username: req.session.username,
    category: req.session.category,
    email: req.session.email,
    xp: req.session.xp,
    xp_progress: (req.session.xp / process.env.XP_THRESHOLD) * 100,
    grade: grade,
    ironprice: ironprice,
    goldprice: goldprice,
    diamantprice: diamantprice,
    isAdmin: isAdmin // Pass isAdmin to the template
  });
});
export default router;
