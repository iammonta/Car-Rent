module.exports.loggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Please log in');
        return res.redirect('/login');
    }
    next();
}


