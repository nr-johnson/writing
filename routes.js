// The site is a single page app. So the front end makes requests to an "api" route that routes through this page.
// The pages rendered here are pieces meant to be added to the "main.pug" page without the page being reloaded.

const express = require('express')
const router = express.Router()
const axios = require('axios');
const cheerio = require("cheerio");
const pretty = require('pretty')

// Get content for home page
router.get('/', async (req, res) => {
    const stories = await req.findMany('writing', 'stories', {})
    res.render('pages/index')
})

// Gets content for blog page
router.get('/stories', async (req, res) => {
    // const url = `https://vocal.media/fiction/fifty-six` // axios url string.
    // // This is axios grabbing the page data from the "api" routes and adding the response to a variable.
    // const data = await axios.get(url).then(response => {
    //     return response.data
    // }).catch(error => {
    //     return error
    // });
    // const html = cheerio.load(data)
    // const image = html(".css-cg8l2w-HeroUnsplashImage")
    // const story = html('.css-1mu5bpv-TextContent-PostPage')
    // const media = {
    //     title: 'Fifty Six',
    //     image: image.attr('src'),
    //     story: story,
    //     url: url
    // }
    // const stories = [media]
    
    let stories = await req.findMany('writing', 'stories', {published: true})
    
    // const content = cheerio.load(stories[0].content)("p").text()
    // const preview = content.split(' ').slice(0, 60).join(' ')
    // console.log(preview)
    
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

module.exports = router