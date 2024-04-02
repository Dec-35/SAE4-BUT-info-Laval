import express from 'express';
import multer from 'multer';
import fs from 'fs';

var storage = multer.diskStorage({
  destination: './public/products/',
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + '.' + file.mimetype.split('/')[1]
    );
  },
});
const upload = multer({storage: storage});
const router = express.Router();

import {pool} from '../../server.js';

router.post('', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.isLoggedIn || req.session.category !== 'admin') {
      //delete the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.redirect('/login?returnUrl=/admin/products');
      return;
    }

    if (req.body.length === 0) {
      res.status(403).json({success: false, message: 'No data provided'});
      return;
    }
    //extract data from multipart form
    var {
      name,
      description,
      price,
      release_date,
      expire_date,
      confirm_threashold,
      is_promoted,
      color,
      sizes,
    } = req.body;

    // Check if price is negative
    if (parseFloat(price) < 0) {
      //delete the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(403).json({success: false, message: 'Le prix ne peut pas être négatif'});
      return;
    }

    if (confirm_threashold === '' || confirm_threashold === '0') {
      confirm_threashold = null;
    }

    if (
      !is_promoted ||
      is_promoted === '0' ||
      is_promoted === 'false' ||
      is_promoted === 'null' ||
      is_promoted === 'off'
    ) {
      is_promoted = 0;
    } else {
      is_promoted = 1;
    }

    //check all the fields are filled
    if (
      name === '' ||
      description === '' ||
      price === '' ||
      release_date === '' ||
      expire_date === ''
    ) {
      //delete the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(403).json({success: false, message: 'Missing data'});
      return;
    }
    var colors;
    if (color === '') {
      color = null;
    } else {
      color = color.replace(' ', '');
      colors = color.split(',');
      if (colors.length === 1) {
        color = colors[0];
      } else {
        color = null;
        //trim all the color names
        colors.forEach((color, index) => {
          colors[index] = color.trim();
        });
      }
    }

    var sizes;
    if (sizes === '') {
      sizes = null;
    } else {
      sizes = sizes.replace(' ', '');
      sizes = sizes.split(',');
      sizes.forEach((size, index) => {
        sizes[index] = size.trim();
      });
    }

    if (confirm_threashold === '' || confirm_threashold === '0') {
      confirm_threashold = null;
    }

    //sanitize the price, name and description
    price = price.replace(',', '.');
    name = name.trim();
    description = description.trim();

    // Check if file was uploaded
    if (!req.file) {
      //send error message
      res.status(403).json({success: false, message: 'Aucune image fournie'});
      return;
    } else {
      // Access the uploaded file
      const uploadedFile = req.file;

      // Check if file is an image
      if (!uploadedFile.mimetype.startsWith('image/')) {
        //delete the uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res
          .status(403)
          .json({success: false, message: "Le fichier n'est pas une image"});
        return;
      } else {
        var imageName = uploadedFile.filename;

        //add product with image
        await pool
          .query(
            'INSERT INTO product (name, description, price, image, release_date, expire_date, confirm_threashold, is_promoted, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              name,
              description,
              price,
              `${imageName}`,
              release_date,
              expire_date,
              confirm_threashold,
              is_promoted,
              color,
            ]
          )
          .then(async () => {
            const [product] = await pool.query(
              'SELECT * FROM product WHERE name = ?',
              [name]
            );

            const productId = product[0].id;
            if (colors) {
              colors.forEach(async (color) => {
                //check if the color already exists
                const [colorExists] = await pool.query(
                  'SELECT * FROM color WHERE name = ?',
                  [color]
                );
                var colorId = 0;

                if (colorExists.length === 0) {
                  //add the color
                  await pool.query('INSERT INTO color (name) VALUES (?)', [
                    color,
                  ]);

                  //get the id of the color
                  const [colorResults] = await pool.query(
                    'SELECT * FROM color WHERE name = ?',
                    [color]
                  );
                  colorId = colorResults[0].id;
                } else {
                  colorId = colorExists[0].id;
                }
                await pool.query(
                  'INSERT INTO product_color (product_id, color_id) VALUES (?, ?)',
                  [productId, colorId]
                );
              });
            }

            if (sizes) {
              //insert into product_size table the product id and the size string
              sizes.forEach(async (size) => {
                await pool.query(
                  'INSERT INTO product_size (product_id, name) VALUES (?, ?)',
                  [productId, size]
                );
              });
            }

            res.status(200).json({success: true, message: 'Produit ajouté'});
          })
          .catch((err) => {
            //delete the uploaded file
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            console.error(
              'Erreur lors du traitement des requêtes SQL d ajout de produit:',
              err
            );
            // Gérer l'erreur comme vous le souhaitez
            res.status(500).json({success: false, message: err});
            return;
          });
      }
    }
  } catch (err) {
    console.error('Erreur lors de l ajout du produit :', err);
    // Gérer l'erreur comme vous le souhaitez
    res.status(500).json({success: false, message: err});
  }
});

export default router;
