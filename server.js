require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const axios = require('axios');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')
const useragent = require('express-useragent');
const request = require('request')
const ops = require('./functions/ops') // my middleware functions to get data from mongodb

const app = express()

app.use((req, res, next) => {
    req.client = axios.create({
        baseURL: process.env.API_URL
    })
    next()
})

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
app.use(useragent.express());
app.use(ops.siteOps()) // My custom functions.

app.use((req, res, next) => {
    req.dev = app.get('env') === 'development'
    next()
})

// All pages except the fullpage map render the same "main.pug" file.
// Data for each page is gathered from the "api" routes using 'request' then sent as data to the page.
// This is done because the site is a single page app, data is gathered and added to the page rather than a new page being loaded.
const apiRoutes = require('./routes/api') // "api" routes. Data that is added to the "main.pug" page dynamically.
const formRoutes = require('./routes/forms') // Used to submit forms when javascript is not working.
app.use('/api', apiRoutes)
app.use('/forms', formRoutes)

// Loads the fullscreen map and the content in the iframe.
app.get('/worldmap', async (req, res) => {
    // If user is coming from a mobile device they are redirected to the '/map' page with a message.
    if(req.useragent.isMobile) {
        req.session.message = {err: false, msg: 'Sorry but my interactive map is only available on desktop devices.'}
        res.redirect('/map')
        return
    }

    // const dots = await req.findMany('map', 'public', {})
    req.client.get('/map/public').then(resp => {
        res.render('map/map', {
            info: resp.data,
            public: true,
            frame: req.query.frame ? true : false // Hides a button if loaded through an iframe.
        })
    })
    
})

// All requests that don't start with "/api", "/forms", or "/worldmap" land here.
app.get(['/','/:page'], async (req, res, next) => {
    // the page param is used to determin what content to load from the "api" routes.
    const route = req.params.page || '' // if blank it grabs the index page.
    const url = `https://${req.hostname}/api/${route}?mobile=${req.useragent.isMobile}` // axios url string.
    // This is 'request' grabbing the page data from the "api" routes and adding the response to a variable.
    
    const msg = req.session.message
    req.session.message = null

    const err = req.session.error
    req.session.error = null

    // Gets page data.
    request(url, async (error, response, body) => {
        // Body will be split into two sections. This is identified by an 'hr' element with the a 'sep' class.
        // The first part is the head data, the second is the body data.
        const sep = body.split("<hr class='sep'>")

        // Renders the "main.pug" file and sends the data gathered from 'request'.
        res.render('main', {
            data: sep,
            route: route,
            message: msg,
            error: err,
            mobile: req.useragent.isMobile,
            status: response.statusCode
        })
    })
})

// Server ---
const http = require('http')
const PORT = process.env.PORT || 3000

app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`))