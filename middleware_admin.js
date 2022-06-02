module.exports.loggedin_admin = (req, res, next) => {
    if (!req.isAuthenticated() && !(req.user.role === 'admin')) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You are not an Admin, You cannot access this page');
        return res.redirect('/login');
    }
    next();
}
