const router = require('express').Router()
const passport = require('passport');
const user_model = require('../models/user.js')
//  Signup ====================================================================
router.get('/register', function (req, res) {
    res.render('users/register');
});

router.post('/register', passport.authenticate('local-register', {
    failureRedirect: '/register',
    failureFlash: true // allow flash messages
}), function (req, res, next) {

    res.redirect('/');



});

// Login ====================================================================
router.get('/login', function (req, res, next) {
    if (req.user) {
        res.redirect('/')
    } else {
        res.render('users/login')
    }
})

router.post('/login', passport.authenticate('local-login', {
    failureRedirect: '/login',
    failureFlash: true // allow flash messages

}), function async(req, res, next) {

    const name = req.body.username

    user_model.findOne({ 'username': name })
        .then(acc => {


            if (acc.role === 'admin') {
                res.redirect('/admin');
            } else {
                if (acc.role === 'manager') {
                    res.redirect('/manager');
                } else {

                    req.flash('success', `Welcome back ${req.body.username}`);
                    const redirectUrl = req.session.returnTo || '/states';
                    delete req.session.returnTo;
                    res.redirect(redirectUrl);
                }
            }


        })
        .catch(err => {
            console.log(err);
        });







});


// LOGOUT ==============================
router.get('/logout', function (req, res, next) {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/');
});




module.exports = router;