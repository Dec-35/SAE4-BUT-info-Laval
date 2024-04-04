import express from 'express';
const router = express.Router();

router.get('', (req, res) => {
    res.render('nuitdelinfo', {
        cartSize: req.session.cart && req.session.cart.length,
        isLoggedIn: req.session.isLoggedIn,
        category: req.session.category,
    });
})

export default router;