import express from 'express';
const router = express.Router();
import {pool} from '../../server.js';

router.post('', async (req, res) => {
  const {ironprice, goldprice, diamantprice} = req.body;

  if (!req.session.isLoggedIn || req.session.category !== 'admin') {
    res.status(403).json({error: 'Accès refusé'});
    return;
  }

  // Vérification des prix pour s'assurer qu'ils ne sont pas négatifs
  if (parseFloat(ironprice) < 0 || parseFloat(goldprice) < 0 || parseFloat(diamantprice) < 0) {
    res.status(403).json({ error: 'Le prix ne peut pas être négatif' });
    return;
  }

  // Mise à jour du prix du grade iron
  await pool.query(
    'UPDATE grade SET price = ? WHERE name = ?',
    [ironprice, 'iron'],
    (err) => {
      if (err) {
        console.error('Impossible de changer le prix :', err);
        res.status(500).json({error: 'Impossible de changer le prix de iron'});
        return;
      }
    }
  );

  // Mise à jour du prix du grade gold
  await pool.query(
    'UPDATE grade SET price = ? WHERE name = ?',
    [goldprice, 'gold'],
    (err) => {
      if (err) {
        console.error('Impossible de changer le prix :', err);
        res.status(500).json({error: 'Impossible de changer le prix de gold'});
        return;
      }
    }
  );

  // Mise à jour du prix du grade diamant
  await pool.query(
    'UPDATE grade SET price = ? WHERE name = ?',
    [diamantprice, 'diamant'],
    (err) => {
      if (err) {
        console.error('Impossible de changer le prix :', err);
        res.status(500).json({error: 'Impossible de changer le prix de diamant'});
        return;
      }
    }
  );

  res.status(200).json({success: true});
});

export default router;