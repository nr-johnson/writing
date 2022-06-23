const express = require('express')
const router = express.Router()

// Get content for home page
router.get('/', async (req, res) => {
    const stories = await req.findMany('writing', 'stories', {})
    req.session.route = ''
    res.render('pages/index')
})

// Gets content for blog page
router.get('/stories', (req, res) => {
    req.session.route = 'stories'
    res.render('pages/stories')
})

// Gets Map page
router.get('/map', (req, res) => {
    req.session.route = 'map'
    res.render('pages/map')
})

// Gets Contect Me page
router.get('/contact', (req, res) => {
    req.session.route = 'contact'
    res.render('pages/contact')
})

module.exports = router