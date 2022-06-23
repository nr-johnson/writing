require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const axios = require('axios');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')
const connectMongo = require('./functions/mongo-connection') // middleware to connect to mongodb
const ops = require('./functions/ops') // middleware functions to get data from mongodb

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(expressSession({
    secret: 'max',
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),  
}))
app.use(connectMongo(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}))
app.use(ops.dataOps())

const routes = require('./routes')
app.use('/api', routes)

app.get(['/','/:id'], async (req, res, next) => {
    if(req.params.id) {
        req.session.route = req.params.id
        req.session.redir = true
        res.redirect('/')
    } else {
        const route = req.session.redir ? req.session.route || '' : ''
        req.session.redir = null
        const url = `https://${req.hostname}/api/${route}`
        const data = await axios.get(url).then(response => {
            return response.data
        }).catch(error => {
            return error
        });

        req.session.route = null

        res.render('main', {
            data: data,
            route: route
        })

        
    }
})

// Server ---
const http = require('http')
const PORT = process.env.PORT || 8000

app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`))