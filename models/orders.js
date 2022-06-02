const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AgenceSchema = new Schema({
    user_id: String,
    agency: String,
    agency_id: String,
    car: String,
    car_id: String,
    date: Date,
    period: Number,
    first_date: String,
    second_date: String,
    total: String,
    card_name: String,
    card_num: String
})


module.exports = mongoose.model('Order', AgenceSchema);

