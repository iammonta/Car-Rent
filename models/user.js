const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username cannot be blank']

    },
    password: String,

    email: {
        type: String,
        required: [true, 'Email cannot be blank'],
        Unique: true
    },
    role: { type: String, default: "user" }
})



userSchema.statics.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
// this method takes the password, hashes it, and compares it to the user's own password
// when the two hashes are equal, it means the passwords match
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.isUser = function () {
    return (this.role === "user");
};
userSchema.methods.isAdmin = function () {
    return (this.role === "admin");
};
userSchema.methods.isManager = function () {
    return (this.role === "manager");
};

// userSchema.plugin(passportLocalMongoose);

// userSchema.statics.findAndValidate = async function (username, password) {
//     const foundUser = await this.findOne({ username });
//     const isValid = await bcrypt.compare(password, foundUser.password);
//     return isValid ? foundUser : false;
// }

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// })

module.exports = mongoose.model('User', userSchema);