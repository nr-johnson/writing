// The site is a single page app. So the front end makes requests to an "api" route that routes through this page.
// The pages rendered here are pieces meant to be added to the "main.pug" page without the page being reloaded.

const express = require('express')
const router = express.Router()
const axios = require('axios');
const cheerio = require("cheerio");
const pretty = require('pretty')

// Get content for home page
router.get('/', async (req, res) => {
    let stories = await req.findMany('writing', 'stories', {published: true})
    stories.sort(function(a, b){
        return a.date < b.date ? -1 : 1 
        return 0
    });
    res.render('pages/index', {
        story: stories[0]
    })
})

// Gets content for blog page
router.get('/stories', async (req, res) => {
    let stories = await req.findMany('writing', 'stories', {published: true})
    
    res.render('pages/stories', {
        stories: stories
    })
})

// Gets Map page
router.get('/map', (req, res) => {
    res.render('pages/map')
})

// Gets Contect Me page
router.get('/contact', (req, res) => {
    res.render('pages/contact')
})

// Contact form post
router.post('/contact', (req, res) => {
    res.send(req.body)
})

module.exports = router