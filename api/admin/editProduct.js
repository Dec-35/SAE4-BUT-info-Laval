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
      id,
      name,
      description,
      price,
      release_date,
      expire_date,
      confirm_threashold,
      is_promoted,
      sizes,
      colors,
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

    var color = null;
    if (colors !== '') {
      colors = colors.replace(' ', '');
      colors = colors.split(',');

      //get the colors from the product_color table, then delete the colors that are in the list and in the table
      //so that we only add new colors

      //get the colors from the product_color table
      const [productColors] = await pool.query(
        'SELECT color.name FROM product_color JOIN color ON product_color.color_id = color.id WHERE product_id = ?',
        [id]
      );

      //check if the list if productColors is bigger than the list of colors
      if (productColors.length > colors.length) {
        //means the product has less colors than before and we need to delete the colors that are not in the list
        //get the colors that are in the list and in the table
        const colorsToDelete = productColors.filter(
          (productColor) => !colors.find((color) => productColor.name === color)
        );

        //delete the colors that are in the list and in the table
        colorsToDelete.forEach(async (color) => {
          //get the id of the color
          const [colorResults] = await pool.query(
            'SELECT * FROM color WHERE name = ?',
            [color.name]
          );

          //delete the color from the product_color table

          await pool.query(
            'DELETE FROM product_color WHERE product_id = ? AND color_id = ?',
            [id, colorResults[0].id]
          );

          //delete the color from the color table if it is not used anymore
          const [productColor] = await pool.query(
            'SELECT * FROM product_color WHERE color_id = ?',
            [colorResults[0].id]
          );

          if (productColor.length === 0) {
            await pool.query('DELETE FROM color WHERE id = ?', [
              colorResults[0].id,
            ]);
          }
        });

        colors = null;
      } else {
        if (colors.length === 1) {
          color = colors[0];
        } else {
          //delete the colors that are in the list and in the table
          colors = colors.filter(
            (color) =>
              !productColors.find((productColor) => productColor.name === color)
          );
        }
      }
    }

    sizes = sizes.replace(' ', '');
    sizes = sizes.split(',');

    //get the sizes from the product_size table, then delete the sizes that are in the list and in the table
    //so that we only add new sizes

    //get the sizes from the product_size table
    const [productSizes] = await pool.query(
      'SELECT name FROM product_size WHERE product_id = ?',
      [id]
    );

    //check if the list if productSizes is bigger than the list of sizes
    if (productSizes.length > sizes.length) {
      //means the product has less sizes than before and we need to delete the sizes that are not in the list
      //get the sizes that are in the list and in the table

      const sizesToDelete = productSizes.filter(
        (productSize) => !sizes.find((size) => productSize.name === size)
      );

      //delete the sizes that are in the list and in the table
      sizesToDelete.forEach(async (size) => {
        //delete the size from the product_size table

        await pool.query(
          'DELETE FROM product_size WHERE product_id = ? AND name = ?',
          [id, size.name]
        );
      });

      sizes = null;
    } else {
      if (sizes[0] === '') {
        sizes = null;
      } else {
        //delete the sizes that are in the list and in the table
        sizes = sizes.filter(
          (size) =>
            !productSizes.find((productSize) => productSize.name === size)
        );
      }
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

    // Check if file was uploaded
    if (!req.file) {
      //modify product without image
      await pool
        .query(
          'UPDATE product SET name = ?, description = ?, price = ?, release_date = ?, expire_date = ?, confirm_threashold = ?, is_promoted = ?, color = ? WHERE id = ?',
          [
            name,
            description,
            price,
            release_date,
            expire_date,
            confirm_threashold,
            is_promoted,
            color,
            id,
          ]
        )
        .then(() => {
          if (!color && colors) {
            //means the product has a list of colors
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
                [id, colorId]
              );
            });
          }

          if (sizes) {
            //insert into product_size table the product id and the size string
            sizes.forEach(async (size) => {
              await pool.query(
                'INSERT INTO product_size (product_id, name) VALUES (?, ?)',
                [id, size]
              );
            });
          }

          res.status(200).json({success: true, message: 'Produit mis à jour'});
        })
        .catch((err) => {
          console.error(
            'Erreur lors du traitement des requêtes SQL de modification de produit :',
            err
          );
          // Gérer l'erreur comme vous le souhaitez
          res.status(500).json({success: false, message: err});
          return;
        });
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
      }

      if (uploadedFile.size > 1000000) {
        //delete the uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(403).json({
          success: false,
          message: "L'image est trop lourde, 1Mo maximum",
        });
        return;
      }

      var imageName = uploadedFile.filename;

      //delete the old image
      const [oldImage] = await pool.query(
        'SELECT image FROM product WHERE id = ?',
        [id]
      );

      if (oldImage[0].image) {
        try {
          fs.unlinkSync(`./public/products/${oldImage[0].image}`);
        } catch (err) {
          console.error("Ajout d'une image pour un produit qui n'en avait pas");
        }
      }

      //modify product with image
      await pool
        .query(
          'UPDATE product SET name = ?, description = ?, price = ?, image = ?, release_date = ?, expire_date = ?, confirm_threashold = ? WHERE id = ?',
          [
            name,
            description,
            price,
            `${imageName}`,
            release_date,
            expire_date,
            confirm_threashold,
            id,
          ]
        )
        .then(() => {
          res.status(200).json({success: true, message: 'Produit mis à jour'});
        })
        .catch((err) => {
          //delete the uploaded file
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          console.error(
            'Erreur lors du traitement des requêtes SQL de modification de produit :',
            err
          );
          // Gérer l'erreur comme vous le souhaitez
          res.status(500).json({success: false, message: err});
          return;
        });
    }
  } catch (err) {
    console.error('Erreur lors de la modification de produit :', err);
    // Gérer l'erreur comme vous le souhaitez
    res.status(500).json({success: false, message: err});
  }
});

export default router;
