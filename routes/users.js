const express = require('express');
const user = require('../models/user');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync.js');



router.get('/register', (req, res) => {
    res.render('users/register');
})

router.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const u = new user({ username, email, role });
        const registeredUser = await user.register(u, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', "Welcome to CarRent");
            res.redirect('/');
        })

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');

    }
}));


router.get('/login', (req, res) => {
    res.render('users/login');
})

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    const user = req.body;
    req.flash('success', `Welcome back ${user.username}`);
    const redirectUrl = req.session.returnTo || '/states';
    delete req.session.returnTo;
    res.redirect(redirectUrl);


})

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/');
})


module.exports = router;