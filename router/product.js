import express from 'express';
const router = express.Router();
import {pool} from '../server.js';

router.get('/:productName', async (req, res) => {
  var product = [];
  var sizes = [];
  var productNameFromUrl = req.params.productName;
  //sanitize the product name to avoid SQL injection
  productNameFromUrl = productNameFromUrl.replace(/['"]/g, '');
  // Remove dashes and spaces from the product name in the URL
  const cleanedProductNameFromUrl = productNameFromUrl.replace(/[-\s]/g, '');

  try {
    const [productResults] = await pool.query(
      'SELECT * FROM product WHERE REPLACE(REPLACE(name, "-", ""), " ","") = ?',
      [cleanedProductNameFromUrl]
    );

    if (productResults.length === 0) {
      res.status(404).render('404page');
      return;
    } else {
      product = productResults[0]; // Use productResults[0] to get the first row
    }

    // Get the sizes of the product
    const [sizeResults] = await pool.query(
      'SELECT * FROM product_size WHERE product_id = ?',
      [product.id]
    );

    sizes = sizeResults;
    var colors = [];
    //check if the product has a single color
    if (!product.color) {
      //get all the colors for that product
      const [colorResults] = await pool.query(
        'SELECT name FROM product_color JOIN color ON color.id = product_color.color_id WHERE product_id = ?',
        [product.id]
      );

      colors = colorResults.map((color) => color.name);
    } else {
      colors.push(product.color);
    }

    if (product.confirm_threashold) {
      //now get the number of orders
      const [orderResults] = await pool.query(
        'SELECT COUNT(*) AS count FROM transactionContent WHERE product_id = ?',
        [product.id]
      );

      const orderCount = orderResults[0].count;
      product.orderCount = orderCount;

      product.progress = Math.floor(
        (orderCount / product.confirm_threashold) * 100
      );
    }
  } catch (err) {
    console.error(err);
  }

  res.render('product', {
    product,
    sizes,
    colors,
    cartSize: req.session.cart && req.session.cart.length,
    isLoggedIn: req.session.isLoggedIn,
    category: req.session.category,
  });
});

export default router;
