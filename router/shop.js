import express from 'express';
const router = express.Router();
import {pool} from '../server.js';

router.get('', async (req, res) => {
  var splashProduct;
  var splashImage;
  var products = [];

  //get the splash product (product.is_promoted = 1)

  try {
    const [splashResults] = await pool.query(
      'SELECT * FROM product WHERE is_promoted = 1 ORDER BY release_date DESC'
    );
    if (splashResults.length === 0) {
      splashProduct = 'None';
      splashImage = 'None';
    } else {
      splashProduct = splashResults['0'].name;
      splashImage = splashResults['0'].image;
    }

    //get all products
    const [productsResults] = await pool.query('SELECT * FROM product');

    products = productsResults;
  } catch (err) {
    console.error(err);
  }

  res.render('shop', {
    cartSize: req.session.cart && req.session.cart.length,
    isLoggedIn: req.session.isLoggedIn,
    category: req.session.category,
    splashProduct: splashProduct,
    splashImage: splashImage,
    products: products,
  });
});
export default router;
