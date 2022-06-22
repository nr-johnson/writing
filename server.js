require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const connectMongo = require('./functions/connect-mongo') // middleware to connect to mongodb
const ops = require('./functions/ops') // middleware functions to get data from mongodb

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(bodyParser.json())
app.use(express.json())

app.use(connectMongo(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}))
app.use(ops.dataOps())

const routes = require('./routes')
app.use('/', routes)

// Server ---
const http = require('http')
const PORT = process.env.PORT || 8000

app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`))