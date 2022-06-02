if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const agency = require('./models/agency');
const order = require('./models/orders');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const user = require('./models/user');
const usersRoutes = require('./routes/auth');
const { loggedin } = require('./middleware');
const { loggedin_admin } = require('./middleware_admin');
const multer = require('multer')
const { storage } = require('./cloudinary');
const catchAsync = require('./utils/catchAsync.js');
const generateHash = require('generatehash')
const upload = multer({ storage });
const methodOverride = require('method-override');
const { resourceUsage } = require('process');
const { data } = require('jquery');
// import path from 'path'

const MongoDBStore = require("connect-mongo")(session);
const cors = require('cors')

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/CarRent';


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const secret = process.env.SECRET || 'SECRET';

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


app.use(cors())
app.use(express.static(__dirname + '/public'));
app.use(session(sessionConfig));

app.use(flash());




require('./config/passport.js')(passport);
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy(user.authenticate()));
// passport.serializeUser(user.serializeUser());
// passport.deserializeUser(user.deserializeUser());







app.use((req, res, next) => {

    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/', usersRoutes);

app.get('/', (req, res) => {
    res.render('index')

})

app.get('/admin', function (req, res) {
    if (req.isAuthenticated() && req.user.isAdmin()) {
        res.render('admin/index')
    } else {
        req.flash('error', 'YOU ARE NOT ADMIN');
        res.redirect('/')
    }
})

app.get('/manager', function (req, res) {
    if (req.isAuthenticated() && req.user.isManager()) {
        res.render('manager/index')
    } else {
        req.flash('error', 'YOU ARE NOT MANAGER');
        res.redirect('/')
    }
})


app.get('/manager/agency', async (req, res) => {
    manager_email = (res.locals.currentUser.email)
    const agence = await agency.findOne({ email: manager_email })
    id = agence.id
    res.render('manager/my_agency', { agence, id })
})


app.get('/manager/orders', async (req, res) => {
    res.render('manager/orders')
})



app.get('/admin/create_account', (req, res) => {
    res.render('admin/create_account')
})




app.post('/admin/create_account', (req, res) => {

    if (user.findOne({ 'username': req.body.username }) === 1) {
        req.flash('error', 'User name already exists');
        res.redirect('/admin/create_account');
    } else {

        const password = req.body.password
        const u = new user({
            username: req.body.username,
            password: user.generateHash(password),
            email: req.body.email,
            role: req.body.role
        })
        u.save()
        res.redirect('/admin')
        flash('success', "Account created successfully ");


    }
});




app.get('/admin/agencies', async (req, res) => {
    const agence = await agency.find({});
    res.render('admin/agencies', { agence })
})

app.get('/admin/agencies/new', async (req, res) => {
    const agencies = await agency.find({});
    res.render('admin/new', { agencies })
})






app.get('/admin/agencies/:id', async (req, res) => {
    const id = req.params.id
    const agence = await agency.findById(req.params.id)
    res.render('admin/show', { agence, id });

})


app.get('/admin/agencies/:id/modify_agency', async (req, res) => {
    const agence = await agency.findById(req.params.id)
    res.render('admin/modify_agency', { agence })
})


app.put('/admin/agencies/:id/modify_agency', async (req, res) => {
    const id = req.params.id;
    const agence = await agency.findByIdAndUpdate(id, { name: req.body.name, adress: req.body.adress, phone: req.body.phone, description: req.body.description });
    res.redirect(`/admin/agencies/${agence.id}`)
})

app.delete('/admin/agencies/:id/delete_agency', async (req, res) => {
    await agency.findByIdAndDelete(req.params.id)
    res.redirect('/admin/agencies/')
})




app.get('/admin/agencies/:id/add_car', (req, res) => {
    id = req.params.id
    res.render('admin/add_car', { id })
})

app.post('/admin/agencies/:id/add_car', upload.array('car_image'), async (req, res) => {
    const agence = await agency.findById(req.params.id)
    const car_images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    agence.cars.push({
        Model: req.body.model,
        Price: req.body.price,
        Status: 'Available',
        Description: req.body.description,
        Images: car_images,
    })


    await agence.save();
    res.redirect(`/admin/agencies/${agence._id}`)
})



app.post('/admin/agencies/:id/:car_id/delete_car', async (req, res) => {
    const car_id = req.params.car_id
    const id = req.params.id

    agency.findOneAndUpdate(
        { _id: id },
        { "$pull": { "cars": { "_id": car_id } } },

        (err, result) => {
            if (err) {
                res.status(500)
                    .json({ error: 'Unable to delete car' });
            } else {
                flash('success', "Car deleted successfully ");
                res.redirect(`/admin/agencies/${id}`)

            }
        }
    );

})






app.post('/admin/add', upload.array('car_image'), async (req, res) => {

    const car_images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    const images = car_images
    const image_url = images.url
    const image_filename = images.filename

    const agence = new agency({
        name: req.body.name,
        adress: req.body.adress,
        phone: req.body.phone,
        email: req.body.email,
        description: req.body.description,
    })




    // agence.cars.push({
    //     Model: req.body.model,
    //     Price: req.body.price,
    //     Status: 'Available',
    //     Images: car_images,
    //     Description: req.body.car_description,
    // })





    await agence.save();
    res.redirect(`/admin/agencies/${agence._id}`);

})


//,








app.get('/admin/agencies/:id/:car_id', async (req, res) => {
    const car_id = req.params.car_id
    const id = req.params.id;
    const agence = await agency.findById(id)
    const car = agence.cars.find(car => car.id === car_id)
    res.render('admin/car_show', { id, car })
})

app.get('/admin/orders', async (req, res) => {
    const orders = await order.find();
    res.render('admin/orders', { orders })
})


app.get('/admin/change_status', (req, res) => {
    res.render('admin/change_status')
})
app.post('/admin/change_status', async (req, res) => {
    const orders = await order.findById(req.body.order_id);
    const car_id = orders.car_id
    const agency_id = orders.agency_id

    agency.findOneAndUpdate(
        { '_id': agency_id, "cars._id": car_id },
        { $set: { 'cars.$.Status': 'Available' } },
        (err, result) => {
            if (err) {
                res.status(500)
                    .json({ error: 'Unable to change car status.', });
            } else {
                flash('success', "Car Status changed successfully ");
                res.redirect('/admin')

            }
        }
    );

})


app.get('/admin/agencies/:id/:car_id/modify_car', async (req, res) => {
    const id = req.params.id
    const car_id = req.params.car_id
    const agence = await agency.findById(id)
    const car = agence.cars.find(car => car.id === car_id)
    res.render('admin/modify_car', { id, car_id, car })
})


app.post('/admin/agencies/:id/:car_id/modify_car', (req, res) => {
    const id = req.params.id
    const car_id = req.params.car_id

    agency.findOneAndUpdate(
        { '_id': id, "cars._id": car_id },
        { $set: { 'cars.$.Model': req.body.model, 'cars.$.Price': req.body.price, 'cars.$.Description': req.body.description } },
        (err, result) => {
            if (err) {
                res.status(500)
                    .json({ error: 'Unable to update car.', });
            } else {
                flash('success', "Modifications applied ");
                res.redirect(`/admin/agencies/${id}/${car_id}`)

            }
        }
    );

})



app.get('/:order_id/print', async (req, res) => {
    const orders = await order.findById(req.params.order_id);
    res.render('print_order', { orders })

})



app.post('/admin/orders/search', async (req, res) => {
    const orders = await order.findById(req.body.order_id);
    res.render('order_search', { orders })

})




app.get('/', async (req, res) => {
    const agencies = await agency.find({});
    res.render('agencies/index', { agencies })
})
app.post('/', async (req, res) => {
    const agence = new agency(req.body.agency);
    await agence.save();
    res.redirect(`/agencies/${agence._id}`)
})

app.get('/states/:city', async (req, res) => {
    const city = req.params.city;
    const by_city = await agency.find({ adress: { $regex: city } });
    res.render('agencies/bycity', { by_city, city });

})

app.get('/new', (req, res) => {
    res.render('agencies/new');
})

app.get('/states/:city/:id', async (req, res) => {
    const city = (req.params.city)
    const agence = await agency.findById(req.params.id)
    if (!agence) {
        req.flash('error', 'No agency');
        return res.redirect('/states');
    }
    res.render('agencies/show', { agence, city });

})

app.get('/states', (req, res) => {

    if (!(req.user) || req.user.isUser()) {
        res.render('states')
    } else {
        req.flash('error', 'YOU ARE NOT A USER');
        res.redirect('/')
    }


})


app.get('/states/:city/:id/:car', async (req, res) => {
    const city = req.params.city
    const car_id = req.params.car
    const id = req.params.id;
    const agence = await agency.findById(id)
    const car = agence.cars.find(car => car.id === car_id)
    res.render('agencies/car_show', { car, city, id, car_id });


})


app.get('/:id/:car_id/order', loggedin, (req, res) => {

    car_id = req.params.car_id
    agency_id = req.params.id
    res.render('order', { car_id, agency_id })


})

app.post('/:agency_id/:car_id/checkout', async (req, res) => {
    car_id = req.params.car_id
    agency_id = req.params.agency_id
    const agence = await agency.findById(agency_id)
    const myorder = await order.find({ 'car_id': car_id })
    const car = agence.cars.find(car => car.id === car_id)
    const { first_date, second_date } = req.body;
    const date1 = new Date(first_date);
    const date2 = new Date(second_date);
    const difftime = Math.abs(date2 - date1);
    const nb_days = Math.ceil(difftime / (1000 * 60 * 60 * 24)) + 1;
    user_id = (req.user._id)
    if (myorder) {
        car_first_date = myorder[0].first_date
        car_second_date = myorder[0].second_date
        const car_second_date_date = new Date(car_second_date)
        const available_date = `${car_second_date_date.getMonth()}/${car_second_date_date.getDate() + 1}/${car_second_date_date.getFullYear()}`
        if ((Date.parse(first_date) >= Date.parse(car_first_date)) && (Date.parse(first_date) <= Date.parse(car_second_date)) ||

            (Date.parse(second_date) >= Date.parse(car_first_date)) && (Date.parse(second_date) <= Date.parse(car_second_date)) ||

            (Date.parse(car_first_date) >= Date.parse(first_date)) && (Date.parse(car_first_date) <= Date.parse(second_date)) ||

            (Date.parse(car_second_date) >= Date.parse(first_date)) && (Date.parse(car_second_date) <= Date.parse(second_date))
        ) {
            req.flash('error', `This car is already rented during this period, it will be available on${available_date}`);
            res.redirect(`/${agency_id}/${car_id}/order`)
        } else {
            res.render('checkout', { nb_days, car, agence, agency_id, car_id, user_id, first_date, second_date });
        }
    } else {
        res.render('checkout', { nb_days, car, agence, agency_id, car_id, user_id, first_date, second_date });

    }




})


app.post('/order', async (req, res) => {
    const data = req.body;
    car_id = data.car_id;
    user_id = data.user_id
    const new_order = new order({
        user_id: data.user_id,
        agency: data.agency,
        agency_id: data.agency_id,
        car: data.car,
        car_id: data.car_id,
        date: data.date,
        first_date: data.first_date,
        second_date: data.second_date,
        period: data.nb_days,
        total: data.total,
        card_name: data.card_name,
        card_num: data.card_number
    })

    await new_order.save();
    const myorder = await order.find({ user_id: user_id })
    const order_id = myorder[0]._id
    const agence = await agency.findById(data.agency_id)

    const car = agence.cars.find(car => car.id === car_id)
    agency.findOneAndUpdate(
        { '_id': agence.id, "cars._id": car.id },
        { $set: { 'cars.$.Status': 'Not Available' } },
        (err, result) => {
            if (err) {
                res.status(500)
                    .json({ error: 'Unable to update car.', });
            } else {

                flash('success', "Transaction successful ");
                res.render('invoice', { data, car, order_id })


            }
        }
    );






})




app.get('/profile', loggedin, async (req, res) => {
    const orders = await order.find({ user_id: req.user.id });
    res.render('profile', { orders })

})






const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port 3000 ${port}`)
})