require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const axios = require('axios');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')
const connectMongo = require('./functions/mongo-connection') // my middleware to connect to mongodb
const ops = require('./functions/ops') // my middleware functions to get data from mongodb

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json())
app.use(express.static(path.join(__dirname, '/public')))
// User session cookies stored on monogdb.
app.use(expressSession({
    secret: 'max',
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),  
}))
// Establishes connection with mongodb.
app.use(connectMongo(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}))
app.use(ops.dataOps()) // My custom functions for getting data from mongodb.

// All pages render the same "main.pug" file.
// Data for each page is gathered from the "api" routes using axios then sent as data to the page.
// This is done because the site is a single page app, data is gathered and added to the page rather than a new page being loaded.

const routes = require('./routes') // "api" routes. Data that is added to the "main.pug" page dynamically.
app.use('/api', routes)

// All requests that don't start with "/api" land here.
app.get(['/','/:page'], async (req, res, next) => {
    // the page param is used to determin what content to load from the "api" routes.
    const route = req.params.page || '' // if blank it grabs the index page.
    const url = `https://${req.hostname}/api/${route}` // axios url string.
    // This is axios grabbing the page data from the "api" routes and adding the response to a variable.
    const data = await axios.get(url).then(response => {
        return response.data
    }).catch(error => {
        console.log(error.status)
        return error.response
    });
    

    // Renders the "main.pug" file and sends the data gathered from axios.
    res.render('main', {
        data: data,
        route: route
    })
})

// Server ---
const http = require('http')
const PORT = process.env.PORT || 8000

app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`))