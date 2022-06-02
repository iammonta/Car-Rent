const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const agency = require('./models/agency');
const { addAbortSignal } = require('stream');
const { where } = require('./models/agency');

mongoose.connect('mongodb://localhost:27017/CarRent', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }));


const new_agency = async () => {
    const a = new agency({
        name: 'AAAAAA',
        adress: 'Rue Mednine, Sfax',
        image: 'Image Link',
        description: 'BEST CARS EVER !!!!',
    })
    a.cars.push({
        Model: 'GOLD 7',
        Price: '500',
        Status: 'Available',
        image: 'Image Link'
    })
    a.cars.push(
        {
            Model: 'MERCEDES',
            Price: '700',
            Status: 'Not Available',
            image: 'MERCEDES IMAGES'
        }
    )
    a.cars.push(
        {
            Model: 'POLO 6',
            Price: '80',
            Status: 'Not Available',
            image: 'POLO 6 IMAGES'
        }
    )



    const res = await a.save();
    console.log(res);
}

new_agency();