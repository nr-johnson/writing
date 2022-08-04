require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const axios = require('axios');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')
const useragent = require('express-useragent');
const ops = require('./functions/ops') // my middleware functions to get data from mongodb

const app = express()

// Creates axios client and adds it to req to be used throughout the app.
app.use((req, res, next) => {
    req.client = axios.create({
        baseURL: process.env.API_URL
    })

    req.root = __dirname

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
    }).catch(err => {
        res.status(500).send('Error retrieving data.')
    })
    
})

// All requests that don't start with "/api", "/forms", or "/worldmap" land here.
app.get(['/','/:page', '/:page/:id'], async (req, res, next) => {
    // the page param is used to determin what content to load from the "api" routes.
    const route = req.params.page || '' // if blank it grabs the index page.
    let url = `https://${req.hostname}/api/${route}?mobile=${req.useragent.isMobile}` // axios url string.

    // I changed the url structure. This check ensure old links work.
    if(route.length > 24) {
        const story = route.substring(6)
        res.redirect(`/story/${story}`)
        return
    }
    
    if(req.hostname == 'localhost') {
        url = `localhost:${process.env.PORT}/api/${route}?mobile=${req.useragent.isMobile}`
    }

    const msg = req.session.message
    req.session.message = null

    const err = req.session.error
    req.session.error = null

    req.getData(route, req.params.id).then(resp => {
        // Body will be split into two sections. This is identified by an 'hr' element with the a 'sep' class.
        // The first part is the head data, the second is the body data.
        const sep = resp.split("<hr class='sep'>")
        // Renders the "main.pug" file and sends the data gathered from 'request'.
        res.render('main', {
            data: sep,
            title: route.length > 12 ? true : false, // Individual story pages need to set there own titles.
            route: route,
            message: msg,
            error: err,
            status: 200,
            mobile: req.useragent.isMobile
        })
    }).catch(err => {
        const status = err.response ? err.reponse.status : 500
        res.status(status).render('main', {
            data: [`<h3>Error ${status}</h3>
                <p>${err.response ? err.response.statusText : err.message}</p>`],
            title: `Error | ${status}`,
            message: msg,
            error: null,
            status: status,
            mobile: req.useragent.isMobile
        })
    })

    // // This is the axios request grabbing the page data from the "api" routes and sending the data to the page as a variable.
    // req.client.get(url).then((resp) => {
    
    // }).catch(err => {
    
    // })
})

// Server ---
const http = require('http')
const PORT = process.env.PORT || 8000

app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`))